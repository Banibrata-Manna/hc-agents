# Order Routing REST API Documentation

This document describes the REST API for the Order Routing component. It allows managing order routing groups, routings, rules, and executing routing logic.

**Base URL:** `/rest/s1/order-routing` (Example, depends on deployment)

## Resources

### 1. Groups (`/groups`)

Manage Order Routing Groups.

#### **GET /groups**
**Description:** List all Order Routing Groups.
*   **In Params:** Standard list pagination parameters (pageIndex, pageSize, etc. - inferred).
*   **Out Params:** List of `OrderRoutingGroup` entities.
    *   `routingGroupId` (ID)
    *   `productStoreId` (ID)
    *   `groupName` (String)
    *   `sequenceNum` (Integer)
    *   `description` (String)
    *   `schedule` (Object - ServiceJob)

#### **POST /groups**
**Description:** Create or Update an Order Routing Group.
*   **In Params:** `OrderRoutingGroup` entity fields.
    *   `productStoreId` (ID)
    *   `groupName` (String)
    *   `sequenceNum` (Integer)
    *   `description` (String)
*   **Out Params:** `routingGroupId` (ID)

---

### 1.1 Specific Group (`/groups/{routingGroupId}`)

#### **GET /groups/{routingGroupId}**
**Description:** Get details of a specific Order Routing Group.
*   **In Params:** `routingGroupId` (Path Param)
*   **Out Params:** `OrderRoutingGroup` entity (default view). Includes `routings` list.

#### **POST /groups/{routingGroupId}**
**Description:** Create or Update a specific Order Routing Group.
*   **In Params:** `OrderRoutingGroup` fields to update.
*   **Out Params:** `routingGroupId` (ID)

#### **DELETE /groups/{routingGroupId}**
**Description:** Delete an Order Routing Group.
*   **Action:** Calls `co.hotwax.order.routing.CommonServices.delete#OrderRoutingGroup`.

#### **POST /groups/{routingGroupId}/runNow**
**Description:** Schedules the routing process for an Order Routing Group immediately.
*   **Action:** Calls `co.hotwax.order.routing.OrderRoutingServices.scheduleNow#OrderRoutingGroup`.
*   **In Params:**
    *   `routingGroupId` (Path Param)
*   **Out Params:**
    *   `jobRunId` (String): The ID of the scheduled job run.

#### **POST /groups/{routingGroupId}/run**
**Description:** Invoke the order routing service directly (synchronously) for testing. Does not trigger the scheduled job.
*   **Action:** Calls `co.hotwax.order.routing.OrderRoutingServices.run#OrderRoutingGroup`.
*   **In Params:**
    *   `routingGroupId` (Path Param)
    *   `orderRoutingId` (String, Optional)
    *   `routingRuleId` (String, Optional)
    *   `productStoreId` (String, Required)
    *   `orderId` (String, Optional)
    *   `shipGroupSeqId` (String, Optional)
    *   `changeReasonEnumId` (String, Optional)
    *   `testDriveSessionId` (String, Optional): For test drive mode.
*   **Out Params:**
    *   `attemptedItemCount` (Long)
    *   `brokeredItemCount` (Long)

#### **GET /groups/{routingGroupId}/schedule**
**Description:** Get the schedule for an Order Routing Group.
*   **Action:** Calls `co.hotwax.order.routing.OrderRoutingServices.get#OrderRoutingGroupSchedule`.
*   **In Params:**
    *   `routingGroupId` (Path Param)
*   **Out Params:**
    *   `schedule` (Map): Details of the `moqui.service.job.ServiceJob` (cronExpression, etc.).

#### **POST /groups/{routingGroupId}/schedule**
**Description:** Create or Update the schedule for an Order Routing Group.
*   **Action:** Calls `co.hotwax.order.routing.OrderRoutingServices.store#OrderRoutingGroupSchedule`.
*   **In Params:**
    *   `routingGroupId` (Path Param)
    *   `cronExpression` (String, Optional)
    *   `transactionTimeout` (Integer, Optional)
    *   `paused` (String "Y" or "N", Optional)
    *   Other `moqui.service.job.ServiceJob` non-pk fields.
*   **Out Params:**
    *   `jobName` (String)

#### **POST /groups/{routingGroupId}/clone**
**Description:** Clone an Order Routing Group.
*   **Action:** Calls `co.hotwax.order.routing.CommonServices.clone#OrderRoutingGroup`.

#### **GET /groups/{routingGroupId}/routings**
**Description:** List all Routings within a Group.
*   **Out Params:** List of `OrderRouting` entities.

#### **GET /groups/{routingGroupId}/routingRuns**
**Description:** List all Routing Runs for a Group.
*   **Out Params:** List of `OrderRoutingRun` entities.

#### **GET /groups/{routingGroupId}/raw**
**Description:** Get the full raw details of a Group including routings, filters, rules, inventory filters, and actions.
*   **Out Params:** Deeply nested `OrderRoutingGroup` object.

---

### 2. Routings (`/routings`)

Manage Order Routings.

#### **POST /routings**
**Description:** Create or Update an Order Routing.
*   **In Params:** `OrderRouting` entity fields.
    *   `routingGroupId` (ID)
    *   `routingName` (String)
    *   `statusId` (ID)
    *   `sequenceNum` (Integer)
*   **Out Params:** `orderRoutingId` (ID)

---

### 2.1 Specific Routing (`/routings/{orderRoutingId}`)

#### **GET /routings/{orderRoutingId}**
**Description:** Get details of a specific Order Routing.
*   **Out Params:** `OrderRouting` entity (default view). Includes `rules`.

#### **POST /routings/{orderRoutingId}**
**Description:** Create or Update an Order Routing.

#### **GET /routings/{orderRoutingId}/rules**
**Description:** List rules for this routing.
*   **Out Params:** List of `OrderRoutingRule` entities.

#### **GET /routings/{orderRoutingId}/orderFilters**
**Description:** List order filters (Deprecated).
#### **POST /routings/{orderRoutingId}/orderFilters**
**Description:** Create or Update order filter (Deprecated).
#### **DELETE /routings/{orderRoutingId}/orderFilters**
**Description:** Delete order filter (Deprecated).

#### **GET /routings/{orderRoutingId}/routingRuns**
**Description:** List runs for this routing.

#### **POST /routings/{orderRoutingId}/clone**
**Description:** Clone this Order Routing.
*   **Action:** Calls `co.hotwax.order.routing.CommonServices.clone#OrderRouting`.

#### **GET /routings/{orderRoutingId}/sql**
**Description:** Get the SQL used to filter orders for this routing.
*   **Action:** Calls `co.hotwax.order.routing.OrderRoutingServices.get#OrderFilterSql`.
*   **Out Params:**
    *   `statusId` (String)
    *   `sql` (String)

#### **GET /routings/{orderRoutingId}/orderCount**
**Description:** Get the count of eligible order items for this routing.
*   **Action:** Calls `co.hotwax.order.routing.OrderRoutingServices.get#RoutingOrderCount`.
*   **Out Params:**
    *   `orderItemCount` (Long)

---

### 3. Rules (`/rules`)

Manage Order Routing Rules.

#### **POST /rules**
**Description:** Create or Update an Order Routing Rule.
*   **In Params:** `OrderRoutingRule` entity fields.
    *   `orderRoutingId` (ID)
    *   `ruleName` (String)
    *   `statusId` (ID)
    *   `assignmentEnumId` (ID)
    *   `sequenceNum` (Integer)

---

### 3.1 Specific Rule (`/rules/{routingRuleId}`)

#### **GET /rules/{routingRuleId}**
**Description:** Get details of a specific Rule.

#### **POST /rules/{routingRuleId}**
**Description:** Create or Update a specific Rule.

#### **GET /rules/{routingRuleId}/inventoryFilters**
**Description:** List inventory filters (Deprecated).
#### **POST /rules/{routingRuleId}/inventoryFilters**
**Description:** Create or Update inventory filter (Deprecated).
#### **DELETE /rules/{routingRuleId}/inventoryFilters**
**Description:** Delete inventory filter (Deprecated).

#### **GET /rules/{routingRuleId}/actions**
**Description:** List rule actions (Deprecated).
#### **POST /rules/{routingRuleId}/actions**
**Description:** Create or Update rule action (Deprecated).
#### **DELETE /rules/{routingRuleId}/actions**
**Description:** Delete rule action (Deprecated).

#### **POST /rules/{routingRuleId}/clone**
**Description:** Clone this Rule.
*   **Action:** Calls `co.hotwax.order.routing.CommonServices.clone#OrderRoutingRule`.

#### **GET /rules/{routingRuleId}/sql**
**Description:** Get the SQL used to select inventory for this rule.
*   **Action:** Calls `co.hotwax.order.routing.OrderRoutingServices.get#OrderRoutingRuleSql`.
*   **Out Params:**
    *   `statusId` (String)
    *   `sql` (String)

---

### 4. Orders (`/orders`)

Manage Order specific routing actions.

#### **POST /orders/{orderId}/reject**
**Description:** Reject specific items in an order.
*   **Action:** Calls `co.hotwax.order.routing.OrderRoutingServices.reject#OrderItems`.
*   **In Params:**
    *   `orderId` (Path Param, Required)
    *   `notify` (Boolean, Default: false) - Send email notification.
    *   `items` (List<Map>, Required): List of items to reject.
        *   `facilityId` (String)
        *   `shipmentMethodTypeId` (String)
        *   `quantity` (BigDecimal, Default: 1)
        *   `orderItemSeqId` (String)
        *   `toFacilityId` (String, Optional)
        *   `recordVariance` (Boolean, Optional)
        *   `rejectReason` (String)
*   **Out Params:**
    *   `rejectedItemsList` (List<Map>)

#### **GET /orders/{orderId}/routing-history/recent**
**Description:** Get the recent routing history for an order.
*   **Action:** Calls `co.hotwax.order.routing.OrderRoutingServices.get#RecentRoutingHistory`.
*   **In Params:**
    *   `orderId` (Path Param, Required)
*   **Out Params:**
    *   `routingHistoryList` (List): List of `OrderFacilityChange` entities.
