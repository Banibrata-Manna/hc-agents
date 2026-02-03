
import { Agent } from '@mastra/core/agent';
import { bedrock } from '@ai-sdk/amazon-bedrock';
import * as orderRoutingTools from '../tools/orderRoutingTools';
import { Memory } from '@mastra/memory';
import { PostgresStore } from '@mastra/pg';
import { PgVector } from '@mastra/pg';
import { fastembed } from '@mastra/fastembed';

export const orderRoutingAgent = new Agent({
  id: 'order-routing-agent',
  name: 'Order Routing Assistant',
  description: 'An expert on order routing configuration. You help users manage order routing groups, routings, and rules.',
  instructions: `
    You are an expert on order routing configuration. You help users manage order routing groups, routings, and rules.
    You have access to a set of APIs to manage these configurations.
    
    When asking to create or update resources, always ensure you have the necessary IDs and required fields.
    If a user asks for "groups", "routings" or "rules", use the corresponding list tools to show them what exists.
    
    Be helpful and guide the user through the configuration process.
  `,
  model: bedrock('amazon.nova-pro-v1:0'),
  tools: {
    ...orderRoutingTools
  },
  memory: new Memory({
    storage: new PostgresStore({
      id: 'order-routing-storage',
      connectionString: process.env.DATABASE_URL || '',
      schemaName: 'orderrouting',
    }),
    vector: new PgVector({
      id: 'order-routing-vector-storage',
      connectionString: process.env.DATABASE_URL || '',
      schemaName: 'orderrouting',
    }),
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
