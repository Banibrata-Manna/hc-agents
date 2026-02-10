
import { Agent } from '@mastra/core/agent';
import * as orderRoutingTools from '../tools/orderRoutingTools';
import { Memory } from '@mastra/memory';
import { fastembed } from '@mastra/fastembed';
import { openai } from '@ai-sdk/openai-v5';
import { PgVector } from '@mastra/pg';
import { orderRoutingAgent } from './orderRoutingAgent';
import { updateOrderRoutingGroupWorkflow} from '../workflows/orderRoutingWorkflows'

const vector = new PgVector({
  id: 'order-routing-vector-storage',
  connectionString: process.env.DATABASE_URL || '',
  schemaName: process.env.DATABASE_SCHEMA || '',
})

export const networkingAgent = new Agent({
  id: 'networking-agent',
  name: 'Networking Assistant',
  description: 'An expert on managing the order routing network. You help users configure groups, routings, and rules to optimize order flow.',
  instructions: `
    You are the Networking Assistant. Your goal is to help users manage and optimize their order routing network.
    The "network" consists of Order Routing Groups, Routings within those groups, and Rules within those routings.

    Your capabilities include:
    - Listing and inspecting the current configuration of Groups, Routings, and Rules.
    - Creating and updating these resources to build or modify the network.

    Guidelines:
    - **PREFERRED:** Always check if a workflow is available for the requested action (e.g., updateOrderRoutingGroupWorkflow) and use it instead of manually combining tools. Workflows ensure business logic and validation steps are followed correctly.
    - When a user asks to "optimize" or "fix" the network, first inspect the current state using list* tools.
    - If you need to make changes, confirm the necessary IDs and parameters.
    - Use the provided tools to execute changes only when explicitly requested or if no workflow fits the task.
    - If you are unsure about a strategy, you can refer to general knowledge, but rely on the tools for the actual state.
    
    Respond concisely and focus on the structural configuration of the order routing network.
  `,
  model: openai("gpt-4o-mini"),
  agents: {
    orderRoutingAgent
  },
  tools: {
    ...orderRoutingTools
  },
  workflows: {
    updateOrderRoutingGroupWorkflow
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
