
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { listOrderRoutingGroups, updateOrderRoutingGroup } from '../tools/orderRoutingTools';

// Define steps

const findGroupStep = createStep({
  id: 'find-group',
  description: 'Find Order Routing Group by ID or Name',
  inputSchema: z.object({
    groupId: z.string().optional(),
    groupName: z.string().optional(),
    productStoreId: z.string().optional(),
    sequenceNum: z.number().optional(),
    description: z.string().optional(),
    jobName: z.string().optional(),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    groups: z.array(z.any()),
    message: z.string(),
    updates: z.object({
        groupName: z.string().optional(),
        productStoreId: z.string().optional(),
        sequenceNum: z.number().optional(),
        description: z.string().optional(),
        jobName: z.string().optional(),
    })
  }),
  execute: async ({ inputData, mastra, requestContext }) => {
    const { groupId, ...updates } = inputData;
    // groupName could be search criteria OR update.
    // If groupId is provided, assume groupName is an update.
    // If groupId is NOT provided, use groupName as search criteria.
    
    let searchId = groupId;
    let searchName = inputData.groupName; // Potential search name

    // If we have an explicit groupId, use it for search. 
    // Any other fields are considered updates.
    
    // Use listOrderRoutingGroups tool from orderRoutingTools
    const result = await listOrderRoutingGroups.execute!({ pageNoLimit: true }, {
        mastra,
        requestContext
    } as any);

    const allGroups = result?.groups || result || [];
    
    let matches: any[] = [];
    
    if (searchId) {
      const match = allGroups.find((g: any) => g.routingGroupId === searchId || g.groupName === searchId);
      if (match) matches.push(match);
    } else if (searchName) {
      matches = allGroups.filter((g: any) => g.groupName?.toLowerCase().includes(searchName!.toLowerCase()));
      // If we used groupName for search, remove it from updates to avoid overwriting with same name (though harmless)
      // But if user meant "find group Named X and rename to Y", we have a conflict in input schema.
      // Usually "Search for X" and "Update fields" are separate.
      // For now, if groupId is missing, we use groupName to search.
    }

    if (matches.length === 0) {
      return { found: false, groups: [], message: 'No Order Routing Group found matching the criteria.', updates };
    }

    if (matches.length === 1) {
       return { found: true, groups: matches, message: `Found one group: ${matches[0].groupName} (${matches[0].routingGroupId}). Proceed to update?`, updates };
    }

    return { 
      found: true, 
      groups: matches, 
      message: `Found ${matches.length} groups. Please select one: ${matches.map((g: any) => `${g.groupName} (${g.routingGroupId})`).join(', ')}`,
      updates
    };
  }
});

const confirmUpdateStep = createStep({
  id: 'confirm-update',
  description: 'Prompt user to confirm update and provide details',
  inputSchema: z.object({
    found: z.boolean(),
    groups: z.array(z.any()),
    message: z.string(),
    updates: z.object({
        groupName: z.string().optional(),
        productStoreId: z.string().optional(),
        sequenceNum: z.number().optional(),
        description: z.string().optional(),
        jobName: z.string().optional(),
    })
  }),
  outputSchema: z.object({
    confirmed: z.boolean(),
    selectedGroupId: z.string().optional(),
    data: z.object({
        groupName: z.string().optional(),
        description: z.string().optional(),
        sequenceNum: z.number().optional(),
        productStoreId: z.string().optional(),
        jobName: z.string().optional(),
    }).optional()
  }),
  // Logic: this step takes the output of find-group.
  // It checks if we need to suspend.
  // We use resumeSchema to define what we expect back from suspension.
  resumeSchema: z.object({
    selectedGroupId: z.string(),
    data: z.object({
        groupName: z.string().optional(),
        description: z.string().optional(),
        sequenceNum: z.number().optional(),
        productStoreId: z.string().optional(),
        jobName: z.string().optional(),
    }).optional(),
    confirmed: z.boolean()
  }),
  execute: async ({ inputData, suspend, resumeData }) => {
    // If we have resumeData, means we are returning from suspension with user input
    if (resumeData) {
        return resumeData;
    }

    // Otherwise, we suspend, passing the info about found groups to the user/UI
    // We also pass the 'updates' we identified from the first step as 'proposed' values
    await suspend();
    return { confirmed: false }; // Should not be reached if suspended, but for type safety
  }
});

const updateGroupStep = createStep({
  id: 'update-group',
  description: 'Update the Order Routing Group',
  inputSchema: z.object({
    confirmed: z.boolean(),
    selectedGroupId: z.string().optional(),
    data: z.object({
        groupName: z.string().optional(),
        description: z.string().optional(),
        sequenceNum: z.number().optional(),
        productStoreId: z.string().optional(),
        jobName: z.string().optional(),
    }).optional(),
  }),
  outputSchema: z.any(),
  execute: async ({ inputData, mastra, requestContext }) => {
    if (!inputData.confirmed || !inputData.selectedGroupId) {
      return { success: false, message: 'Update cancelled or not confirmed.' };
    }

    const { selectedGroupId, data } = inputData;
    
    // Call the update tool
    return await updateOrderRoutingGroup.execute({
        routingGroupId: selectedGroupId,
        ...data
    }, { mastra, requestContext } as any);
  }
});


// Define workflow
export const updateOrderRoutingGroupWorkflow = createWorkflow({
  id: 'update-order-routing-group',
  description: 'Workflow to update an Order Routing Group. Use this when a user wants to modify details of an existing order routing group, such as its name, description, or sequence number.',
  inputSchema: z.object({
    groupId: z.string().optional(),
    groupName: z.string().optional(),
    productStoreId: z.string().optional(),
    sequenceNum: z.number().optional(),
    description: z.string().optional(),
    jobName: z.string().optional(),
  }),
  outputSchema: z.any()
})
.then(findGroupStep)
.then(confirmUpdateStep)
.then(updateGroupStep);

updateOrderRoutingGroupWorkflow.commit();
