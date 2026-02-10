
import 'dotenv/config';
import { MDocument } from '@mastra/rag';
import { PgVector } from '@mastra/pg';
import { embedMany } from 'ai-v5';
import fs from 'fs';
import path from 'path';
import { openai } from '@ai-sdk/openai-v5';


const VECTOR_DIMENSION = 1536;
const MODEL = openai.embedding("text-embedding-3-small");

// Default Configuration
const config = {
  loadNested: false,
} as any;

async function getFilesFromPath(inputPath: string, recursive: boolean = false): Promise<string[]> {
  try {
    const stats = await fs.promises.stat(inputPath);
    if (stats.isDirectory()) {
      let files: string[] = [];
      const dirents = await fs.promises.readdir(inputPath, { withFileTypes: true });
      
      for (const dirent of dirents) {
        const fullPath = path.join(inputPath, dirent.name);
        if (dirent.isDirectory()) {
          if (recursive) {
            const nestedFiles = await getFilesFromPath(fullPath, true);
            files.push(...nestedFiles);
          }
        } else if (dirent.isFile() && dirent.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
      return files;
    } else if (stats.isFile() && inputPath.endsWith('.md')) {
      return [inputPath];
    }
  } catch (err) {
    console.warn(`Warning: Could not access path ${inputPath}:`, err);
  }
  return [];
}

function parseArgs(args: string[]) {
  const paths: string[] = [];
  
  for (const arg of args) {
    if (arg.includes('=')) {
      const [key, value] = arg.split('=');
      if (key && value) {
        if (key === 'indexName') config.indexName = value;
        else if (key === 'vectorStoreId') config.vectorStoreId = value;
        else if (key === 'connectionString') config.connectionString = value;
        else if (key === 'schemaName') config.schemaName = value;
        else if (key === 'loadNested') config.loadNested = (value === 'true' || value === '1');
        else if (key === 'paths') {
          // Add the value of 'paths=' as a path
          paths.push(value);
        }
      }
    } else if (arg === 'loadNested') {
        config.loadNested = true;
    } else {
      // Treat as a path
      paths.push(arg);
    }
  }
  return paths;
}

async function main() {
  const args = process.argv.slice(2);
  const inputPaths = parseArgs(args);
  let filesToProcess: string[] = [];

  console.log(`\n📚 Ingesting Documentation`);

  // Validate Configuration
  const missingConfig: string[] = [];
  if (!config.indexName) missingConfig.push('indexName');
  if (!config.vectorStoreId) missingConfig.push('vectorStoreId');
  if (!config.connectionString) missingConfig.push('connectionString');
  if (!config.schemaName) missingConfig.push('schemaName');

  if (missingConfig.length > 0) {
    console.error(`\n❌ Error: Missing required configuration: ${missingConfig.join(', ')}`);
    console.log('Usage: npx tsx src/mastra/scripts/ingest-order-routing-docs.ts [options] <path-to-file-or-dir>');
    console.log('Options required: indexName=..., vectorStoreId=..., connectionString=..., schemaName=...');
    console.log('Optional: loadNested=true (to recursively load .md files)');
    process.exit(1);
  }

  console.log(`   Configuration:`);
  console.log(`   - Index Name: ${config.indexName}`);
  console.log(`   - Store ID: ${config.vectorStoreId}`);
  console.log(`   - Schema: ${config.schemaName}`);
  console.log(`   - Recursive: ${config.loadNested}`);

  // Initialize Vector Store with parsed/default config
  const store = new PgVector({
    id: config.vectorStoreId,
    connectionString: config.connectionString,
    schemaName: config.schemaName,
  });

  if (inputPaths.length === 0) {
    console.error('\n❌ Error: No path provided.');
    console.log('Usage: npx tsx src/mastra/scripts/ingest-order-routing-docs.ts [options] <path-to-file-or-dir>');
    console.log('Options: indexName=..., vectorStoreId=..., connectionString=..., schemaName=..., loadNested=true');
    process.exit(1);
  }

  console.log(`   Processing paths...`);
  for (const argPath of inputPaths) {
    const resolvedPath = path.resolve(argPath);
    const files = await getFilesFromPath(resolvedPath, config.loadNested);
    filesToProcess.push(...files);
  }

  if (filesToProcess.length === 0) {
    console.log('No valid .md files found to process.');
    return;
  }

  console.log(`   Found ${filesToProcess.length} markdown files.`);

  // Ensure Index Exists
  try {
    await store.createIndex({
      indexName: config.indexName,
      dimension: VECTOR_DIMENSION,
      metric: 'cosine',
    });
    console.log(`Index '${config.indexName}' check passed.`);
  } catch (e) {
    // Ignore if exists
    console.log("Error creating the index", config.indexName);
  }

  let totalUpserted = 0;

  for (const filePath of filesToProcess) {
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found (skipping): ${filePath}`);
      continue;
    }

    const filename = path.basename(filePath);
    console.log(`\nProcessing: ${filename}`);

    // 1. Read Content
    const content = fs.readFileSync(filePath, 'utf-8');

    // 2. Normalize Path (ID)
    // Goal: "documents/retail-operations/orders/order-routing/rules.md"
    let normalizedPath = filePath;
    const splitKey = '/documents/';
    const splitIndex = filePath.indexOf(splitKey);
    
    if (splitIndex !== -1) {
      // +1 to include the leading 'd' of 'documents'
      normalizedPath = filePath.substring(splitIndex + 1); 
    } else {
      // Fallback: just use relative path from cwd if 'documents' not found
      normalizedPath = path.relative(process.cwd(), filePath);
    }
    
    // Split into Folder (Source) and Filename
    const sourceDir = path.dirname(normalizedPath);
    const fileBasename = path.basename(normalizedPath);

    console.log(`   ID: ${sourceDir} / ${fileBasename}`);

    // 3. Chunk
    const doc = MDocument.fromMarkdown(content, {
      source: sourceDir,
      filename: fileBasename
    });

    const chunks = await doc.chunk({
      strategy: 'recursive',
      maxSize: 512,
      overlap: 50,
      separators: ["\n"],
      extract: {
        keywords: true,
      },
    });

    if (chunks.length === 0) {
      console.log('Warning: No chunks generated.');
      continue;
    }

    console.log(`Generated ${chunks.length} chunks. Embedding...`);

    // 4. Embed
    const { embeddings } = await embedMany({
      model: MODEL,
      values: chunks.map(c => c.text),
    });

    // 5. Upsert with Replacement
    await store.upsert({
      indexName: config.indexName,
      vectors: embeddings,
      metadata: chunks.map((c: any, index: number) => ({
        text: c.text,
        source: sourceDir,
        filename: fileBasename,
        ...c.metadata,
        nested: {
          keywords: c.metadata.excerptKeywords
            .replace("KEYWORDS:", "")
            .split(",")
            .map((k: string) => k.trim()),
          id: index,
        },
      })),
      // Composite key filter: Delete only vectors matching BOTH source directory AND filename
      deleteFilter: { source: sourceDir, filename: fileBasename } 
    });

    console.log(`Replaced vectors for '${fileBasename}' in '${sourceDir}'.`);
    totalUpserted += chunks.length;
  }

  console.log(`\nIngestion complete! Total active chunks: ${totalUpserted}`);
}

main().catch(console.error);
