
import { Agent } from '@mastra/core/agent';
import { bedrock } from '@ai-sdk/amazon-bedrock';
import * as orderRoutingTools from '../tools/orderRoutingTools';
import { Memory } from '@mastra/memory';
import { PgVector } from '@mastra/pg';
import { fastembed } from '@mastra/fastembed';
import { createVectorQueryTool } from '@mastra/rag';

const vector = new PgVector({
  id: 'order-routing-vector-storage',
  connectionString: process.env.DATABASE_URL || '',
  schemaName: process.env.DATABASE_SCHEMA || '',
})

const vectorQueryTool = createVectorQueryTool({
  vectorStoreName: 'order-routing-local-vector',
  vectorStore: vector,
  indexName: 'routing_embeds',
  model: fastembed,
});

export const orderRoutingAgent = new Agent({
  id: 'order-routing-agent',
  name: 'Order Routing Assistant',
  description: 'An expert on order routing configuration. You help users manage order routing groups, routings, and rules.',
  instructions: `
    You are an expert on order routing configuration. You help users manage order routing groups, routings, and rules.
    You have access to a set of APIs to manage these configurations AND a vector search tool for documentation.

    Usage Rules:
    1. STRICTLY use the 'vectorQueryTool' for questions about "how to" configure something, routing concepts, logic, or best practices.
    2. Use the classification tools (list/get) to check the current state of groups, routings, or rules.
    3. Use the modification tools (create/update) only when the user explicitly requests a change.
    
    When asking to create or update resources, always ensure you have the necessary IDs and required fields.
    If a user asks for "groups", "routings" or "rules", use the corresponding list tools to show them what exists.
    
    Be helpful and guide the user through the configuration process.
  `,
  model: bedrock('amazon.nova-pro-v1:0'),
  tools: {
    ...orderRoutingTools,
    vectorQueryTool
  },
  memory: new Memory({
    vector,
    embedder: fastembed,
    options: {
      lastMessages: 2,
      workingMemory: { enabled: true, scope: "resource" },
      semanticRecall: {
        topK: 3,
        messageRange: 2,
        scope: 'resource',
      },
    },
  })
});
