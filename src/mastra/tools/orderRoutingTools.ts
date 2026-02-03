
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const API_BASE_URL = process.env.ORDER_ROUTING_API_URL || '';
const API_TOKEN = process.env.ORDER_ROUTING_API_TOKEN || '';

const callApi = async ({
  endpoint,
  method = 'GET',
  body,
  params,
}: {
  endpoint: string;
  method?: string;
  body?: any;
  params?: Record<string, string | number | undefined>;
}) => {
  if (!API_TOKEN) {
    throw new Error('ORDER_ROUTING_API_TOKEN is not configured');
  }

  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API Request failed: ${response.status} ${response.statusText} - ${text}`);
  }

  try {
    return await response.json();
  } catch {
    return { success: true }; // Handle empty responses
  }
};

// --- Groups Tools ---

export const listOrderRoutingGroups = createTool({
  id: 'list-order-routing-groups',
  description: 'List all Order Routing Groups',
  inputSchema: z.object({
    pageIndex: z.number().optional(),
    pageSize: z.number().optional(),
  }),
  outputSchema: z.any(),
  execute: async ({ pageIndex, pageSize }) => {
    return await callApi({ endpoint: '/groups', params: { pageIndex, pageSize } });
  },
});

export const createOrderRoutingGroup = createTool({
  id: 'create-order-routing-group',
  description: 'Create a new Order Routing Group',
  inputSchema: z.object({
    productStoreId: z.string(),
    groupName: z.string(),
    sequenceNum: z.number().optional(),
    description: z.string().optional(),
  }),
  outputSchema: z.any(),
  execute: async (data) => {
    return await callApi({ endpoint: '/groups', method: 'POST', body: data });
  },
});

export const getOrderRoutingGroup = createTool({
  id: 'get-order-routing-group',
  description: 'Get details of a specific Order Routing Group',
  inputSchema: z.object({
    routingGroupId: z.string(),
  }),
  outputSchema: z.any(),
  execute: async ({ routingGroupId }) => {
    return await callApi({ endpoint: `/groups/${routingGroupId}` });
  },
});

export const updateOrderRoutingGroup = createTool({
  id: 'update-order-routing-group',
  description: 'Update a specific Order Routing Group',
  inputSchema: z.object({
    routingGroupId: z.string(),
    productStoreId: z.string().optional(),
    groupName: z.string().optional(),
    sequenceNum: z.number().optional(),
    description: z.string().optional(),
  }),
  outputSchema: z.any(),
  execute: async ({ routingGroupId, ...data }) => {
    return await callApi({ endpoint: `/groups/${routingGroupId}`, method: 'POST', body: data });
  },
});

export const deleteOrderRoutingGroup = createTool({
  id: 'delete-order-routing-group',
  description: 'Delete an Order Routing Group',
  inputSchema: z.object({
    routingGroupId: z.string(),
  }),
  outputSchema: z.any(),
  execute: async ({ routingGroupId }) => {
    return await callApi({ endpoint: `/groups/${routingGroupId}`, method: 'DELETE' });
  },
});

export const scheduleOrderRoutingGroupNow = createTool({
  id: 'schedule-order-routing-group-now',
  description: 'Schedule the routing process for an Order Routing Group immediately',
  inputSchema: z.object({
    routingGroupId: z.string(),
  }),
  outputSchema: z.any(),
  execute: async ({ routingGroupId }) => {
    return await callApi({ endpoint: `/groups/${routingGroupId}/runNow`, method: 'POST' });
  },
});

export const runOrderRoutingGroup = createTool({
  id: 'run-order-routing-group',
  description: 'Invoke the order routing service directly (synchronously) for testing. Does not trigger the scheduled job.',
  inputSchema: z.object({
    routingGroupId: z.string(),
    productStoreId: z.string(),
    orderRoutingId: z.string().optional(),
    routingRuleId: z.string().optional(),
    orderId: z.string().optional(),
    shipGroupSeqId: z.string().optional(),
    changeReasonEnumId: z.string().optional(),
    testDriveSessionId: z.string().optional(),
  }),
  outputSchema: z.any(),
  execute: async ({ routingGroupId, ...data }) => {
    return await callApi({ endpoint: `/groups/${routingGroupId}/run`, method: 'POST', body: data });
  },
});

export const getOrderRoutingGroupSchedule = createTool({
  id: 'get-order-routing-group-schedule',
  description: 'Get the schedule for an Order Routing Group',
  inputSchema: z.object({
    routingGroupId: z.string(),
  }),
  outputSchema: z.any(),
  execute: async ({ routingGroupId }) => {
    return await callApi({ endpoint: `/groups/${routingGroupId}/schedule` });
  },
});

export const updateOrderRoutingGroupSchedule = createTool({
  id: 'update-order-routing-group-schedule',
  description: 'Create or Update the schedule for an Order Routing Group',
  inputSchema: z.object({
    routingGroupId: z.string(),
    cronExpression: z.string().optional(),
    transactionTimeout: z.number().optional(),
    paused: z.enum(['Y', 'N']).optional(),
    // Allow other ServiceJob fields loosely if needed, but these are main ones
  }),
  outputSchema: z.any(),
  execute: async ({ routingGroupId, ...data }) => {
    return await callApi({ endpoint: `/groups/${routingGroupId}/schedule`, method: 'POST', body: data });
  },
});

export const cloneOrderRoutingGroup = createTool({
  id: 'clone-order-routing-group',
  description: 'Clone an Order Routing Group',
  inputSchema: z.object({
    routingGroupId: z.string(),
  }),
  outputSchema: z.any(),
  execute: async ({ routingGroupId }) => {
    return await callApi({ endpoint: `/groups/${routingGroupId}/clone`, method: 'POST' });
  },
});

export const listRoutingsInGroup = createTool({
  id: 'list-routings-in-group',
  description: 'List all Routings within a Group',
  inputSchema: z.object({
    routingGroupId: z.string(),
  }),
  outputSchema: z.any(),
  execute: async ({ routingGroupId }) => {
    return await callApi({ endpoint: `/groups/${routingGroupId}/routings` });
  },
});

export const listRoutingRunsInGroup = createTool({
  id: 'list-routing-runs-in-group',
  description: 'List all Routing Runs for a Group',
  inputSchema: z.object({
    routingGroupId: z.string(),
  }),
  outputSchema: z.any(),
  execute: async ({ routingGroupId }) => {
    return await callApi({ endpoint: `/groups/${routingGroupId}/routingRuns` });
  },
});

export const getOrderRoutingGroupRaw = createTool({
  id: 'get-order-routing-group-raw',
  description: 'Get the full raw details of a Group including routings, filters, rules, inventory filters, and actions',
  inputSchema: z.object({
    routingGroupId: z.string(),
  }),
  outputSchema: z.any(),
  execute: async ({ routingGroupId }) => {
    return await callApi({ endpoint: `/groups/${routingGroupId}/raw` });
  },
});

// --- Routings Tools ---

export const createOrderRouting = createTool({
  id: 'create-order-routing',
  description: 'Create a new Order Routing',
  inputSchema: z.object({
    routingGroupId: z.string(),
    routingName: z.string(),
    statusId: z.string().optional(),
    sequenceNum: z.number().optional(),
  }),
  outputSchema: z.any(),
  execute: async (data) => {
    return await callApi({ endpoint: '/routings', method: 'POST', body: data });
  },
});

export const getOrderRouting = createTool({
  id: 'get-order-routing',
  description: 'Get details of a specific Order Routing',
  inputSchema: z.object({
    orderRoutingId: z.string(),
  }),
  outputSchema: z.any(),
  execute: async ({ orderRoutingId }) => {
    return await callApi({ endpoint: `/routings/${orderRoutingId}` });
  },
});

export const updateOrderRouting = createTool({
  id: 'update-order-routing',
  description: 'Update an Order Routing',
  inputSchema: z.object({
    orderRoutingId: z.string(),
    routingName: z.string().optional(),
    statusId: z.string().optional(),
    sequenceNum: z.number().optional(),
  }),
  outputSchema: z.any(),
  execute: async ({ orderRoutingId, ...data }) => {
    return await callApi({ endpoint: `/routings/${orderRoutingId}`, method: 'POST', body: data });
  },
});

export const listRoutingRules = createTool({
  id: 'list-routing-rules',
  description: 'List rules for this routing',
  inputSchema: z.object({
    orderRoutingId: z.string(),
  }),
  outputSchema: z.any(),
  execute: async ({ orderRoutingId }) => {
    return await callApi({ endpoint: `/routings/${orderRoutingId}/rules` });
  },
});

export const listRoutingRuns = createTool({
  id: 'list-routing-runs',
  description: 'List runs for this routing',
  inputSchema: z.object({
    orderRoutingId: z.string(),
  }),
  outputSchema: z.any(),
  execute: async ({ orderRoutingId }) => {
    return await callApi({ endpoint: `/routings/${orderRoutingId}/routingRuns` });
  },
});

export const cloneOrderRouting = createTool({
  id: 'clone-order-routing',
  description: 'Clone this Order Routing',
  inputSchema: z.object({
    orderRoutingId: z.string(),
  }),
  outputSchema: z.any(),
  execute: async ({ orderRoutingId }) => {
    return await callApi({ endpoint: `/routings/${orderRoutingId}/clone`, method: 'POST' });
  },
});

export const getOrderRoutingSql = createTool({
  id: 'get-order-routing-sql',
  description: 'Get the SQL used to filter orders for this routing',
  inputSchema: z.object({
    orderRoutingId: z.string(),
  }),
  outputSchema: z.any(),
  execute: async ({ orderRoutingId }) => {
    return await callApi({ endpoint: `/routings/${orderRoutingId}/sql` });
  },
});

export const getOrderRoutingOrderCount = createTool({
  id: 'get-order-routing-order-count',
  description: 'Get the count of eligible order items for this routing',
  inputSchema: z.object({
    orderRoutingId: z.string(),
  }),
  outputSchema: z.any(),
  execute: async ({ orderRoutingId }) => {
    return await callApi({ endpoint: `/routings/${orderRoutingId}/orderCount` });
  },
});

// --- Rules Tools ---

export const createOrderRoutingRule = createTool({
  id: 'create-order-routing-rule',
  description: 'Create a new Order Routing Rule',
  inputSchema: z.object({
    orderRoutingId: z.string(),
    ruleName: z.string(),
    statusId: z.string().optional(),
    assignmentEnumId: z.string().optional(),
    sequenceNum: z.number().optional(),
  }),
  outputSchema: z.any(),
  execute: async (data) => {
    return await callApi({ endpoint: '/rules', method: 'POST', body: data });
  },
});

export const getOrderRoutingRule = createTool({
  id: 'get-order-routing-rule',
  description: 'Get details of a specific Rule',
  inputSchema: z.object({
    routingRuleId: z.string(),
  }),
  outputSchema: z.any(),
  execute: async ({ routingRuleId }) => {
    return await callApi({ endpoint: `/rules/${routingRuleId}` });
  },
});

export const updateOrderRoutingRule = createTool({
  id: 'update-order-routing-rule',
  description: 'Update a specific Rule',
  inputSchema: z.object({
    routingRuleId: z.string(),
    ruleName: z.string().optional(),
    statusId: z.string().optional(),
    assignmentEnumId: z.string().optional(),
    sequenceNum: z.number().optional(),
  }),
  outputSchema: z.any(),
  execute: async ({ routingRuleId, ...data }) => {
    return await callApi({ endpoint: `/rules/${routingRuleId}`, method: 'POST', body: data });
  },
});

export const cloneOrderRoutingRule = createTool({
  id: 'clone-order-routing-rule',
  description: 'Clone this Rule',
  inputSchema: z.object({
    routingRuleId: z.string(),
  }),
  outputSchema: z.any(),
  execute: async ({ routingRuleId }) => {
    return await callApi({ endpoint: `/rules/${routingRuleId}/clone`, method: 'POST' });
  },
});

export const getOrderRoutingRuleSql = createTool({
  id: 'get-order-routing-rule-sql',
  description: 'Get the SQL used to select inventory for this rule',
  inputSchema: z.object({
    routingRuleId: z.string(),
  }),
  outputSchema: z.any(),
  execute: async ({ routingRuleId }) => {
    return await callApi({ endpoint: `/rules/${routingRuleId}/sql` });
  },
});

// --- Orders Tools ---

export const rejectOrderItems = createTool({
  id: 'reject-order-items',
  description: 'Reject specific items in an order',
  inputSchema: z.object({
    orderId: z.string(),
    notify: z.boolean().optional(),
    items: z.array(z.object({
      facilityId: z.string().optional(),
      shipmentMethodTypeId: z.string().optional(),
      quantity: z.number().optional(),
      orderItemSeqId: z.string(),
      toFacilityId: z.string().optional(),
      recordVariance: z.boolean().optional(),
      rejectReason: z.string().optional(),
    })),
  }),
  outputSchema: z.any(),
  execute: async ({ orderId, ...data }) => {
    return await callApi({ endpoint: `/orders/${orderId}/reject`, method: 'POST', body: data });
  },
});

export const getOrderRoutingHistory = createTool({
  id: 'get-order-routing-history',
  description: 'Get the recent routing history for an order',
  inputSchema: z.object({
    orderId: z.string(),
  }),
  outputSchema: z.any(),
  execute: async ({ orderId }) => {
    return await callApi({ endpoint: `/orders/${orderId}/routing-history/recent` });
  },
});
