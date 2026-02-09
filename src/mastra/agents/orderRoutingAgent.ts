
import { Agent } from '@mastra/core/agent';
import * as orderRoutingTools from '../tools/orderRoutingTools';
import { Memory } from '@mastra/memory';
import { PgVector } from '@mastra/pg';
import { fastembed } from '@mastra/fastembed';
import { createVectorQueryTool } from '@mastra/rag';
import { bedrockModel } from '../llm/bedrock';

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
    You help users manage order routing groups, routings, and rules.

    Use vectorQueryTool for questions about "how to", "best ways", "strategies", "concepts", or "logic". The answer is in the documentation.
    Use list* and get* tools for checking the current state of groups, routings, or rules.
    Use create*, update*, delete*, and run* tools only when the user explicitly requests a change or an execution.

    Rules:
    - CLASSIFY the request first: Concept/Strategy -> Docs (vectorQueryTool); Inspection -> List/Get; Action -> Create/Update.
    - NEVER answer a conceptual strategy question by inspecting the current state. Always check the docs first.
    - NEVER guess a solution. If you don't know "how" to do something, search the docs.
    - When asking to create or update resources, always ensure you have the necessary IDs and required fields.
    - Respond with the final answer only. Do not include <thinking> or other internal reasoning.
  `,
  model: bedrockModel,
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
        scope: 'thread',
      },
    },
  })
});
