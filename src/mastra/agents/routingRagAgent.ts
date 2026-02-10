import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { PGVECTOR_PROMPT, PgVector } from "@mastra/pg";
import { createVectorQueryTool } from "@mastra/rag";

const vector = new PgVector({
  id: 'order-routing-vector-storage',
  connectionString: process.env.DATABASE_URL || '',
  schemaName: process.env.DATABASE_SCHEMA || '',
})

const vectorQueryTool = createVectorQueryTool({
  id: "routingVectorQueryTool",
  vectorStore: vector,
  vectorStoreName: "order-routing-local-vector",
  indexName: "routing_embedsV2",
  model: openai.embedding("text-embedding-3-small"),
  enableFilter: true,
});

export const routingRagAgent = new Agent({
  id: "routing-rag-agent",
  name: "Routing RAG Agent",
  model: openai("gpt-4o-mini"),
  instructions: `
  You are a helpful assistant that queries Order Routing Documents and answers questions based on the provided context. Keep your answers concise and relevant.

  Filter the context by searching the metadata.
  
  The metadata is structured as follows:

  {
    text: string,
    excerptKeywords: string,
    nested: {
      keywords: string[],
      id: number,
    },
  }

  ${PGVECTOR_PROMPT}

  Important: When asked to answer a question, please base your answer only on the context provided in the tool. 
  If the context doesn't contain enough information to fully answer the question, please state that explicitly.
  `,
  tools: { vectorQueryTool },
});