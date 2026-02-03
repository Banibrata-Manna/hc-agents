# Entity-Relationship Diagram: OrderRoutingEntities

Based on `runtime/component/OrderRouting/entity/OrderRoutingEntities.xml`.

```mermaid
erDiagram
    OrderRoutingGroup {
        id routingGroupId PK
        id productStoreId
        text-medium groupName
        number-integer sequenceNum
        text-medium jobName
        text-long description
        id createdByUserId
        id-long createdByUser
        date-time createdDate
        date-time lastModifiedDate
    }

    OrderRouting {
        id orderRoutingId PK
        id routingGroupId FK
        id statusId
        text-medium routingName
        number-integer sequenceNum
        text-long description
        id-long createdByUser
        id createdByUserId
        date-time createdDate
    }

    OrderFilterCondition {
        id orderRoutingId PK, FK
        id conditionSeqId PK
        id conditionTypeEnumId
        text-medium fieldName
        text-medium operator
        text-long fieldValue
        number-integer sequenceNum
        date-time createdDate
    }

    OrderRoutingRule {
        id routingRuleId PK
        id orderRoutingId FK
        text-medium ruleName
        id statusId
        number-integer sequenceNum
        id assignmentEnumId
        date-time createdDate
        id-long createdByUser
        id createdByUserId
    }

    OrderRoutingRuleInvCond {
        id routingRuleId PK, FK
        id conditionSeqId PK
        id conditionTypeEnumId
        text-medium fieldName
        text-medium operator
        text-long fieldValue
        number-integer sequenceNum
        date-time createdDate
    }

    OrderRoutingRuleAction {
        id routingRuleId PK, FK
        id actionSeqId PK
        id actionTypeEnumId
        text-long actionValue
        date-time createdDate
    }

    OrderRoutingRun {
        id routingRunId PK
        id orderRoutingId
        id routingGroupId FK
        id routingBatchId FK
        id productStoreId
        id-long createdByUser
        id createdByUserId
        text-indicator hasError
        date-time startDate
        date-time endDate
        text-long routingResult
        number-integer orderItemCount
        number-integer brokeredItemCount
    }

    OrderRoutingBatch {
        id routingBatchId PK
        id routingGroupId FK
        id-long createdByUser
        id createdByUserId
        date-time startDate
        date-time endDate
        number-integer orderItemCount
        number-integer brokeredItemCount
    }

    UserSession {
        id userSessionId PK
        id userId
        id sessionTypeEnumId
        id productStoreId
        date-time fromDate
        date-time thruDate
        text-long comments
    }

    %% Relationships
    OrderRoutingGroup ||--|{ OrderRouting : "has many routings"
    OrderRoutingGroup ||--|{ OrderRoutingRun : "has many runs"
    OrderRoutingGroup ||--|{ OrderRoutingBatch : "has many batches"

    OrderRouting ||--|{ OrderFilterCondition : "has many filters"
    OrderRouting ||--|{ OrderRoutingRule : "has many rules"
    OrderRouting ||--|{ OrderRoutingRun : "has many runs"

    OrderRoutingRule ||--|{ OrderRoutingRuleInvCond : "has inventory filters"
    OrderRoutingRule ||--|{ OrderRoutingRuleAction : "has actions"

    OrderRoutingBatch ||--|{ OrderRoutingRun : "contains runs"

```

## External Dependencies (Not visualised above for clarity)
- **moqui.service.job.ServiceJob**: Referenced by `OrderRoutingGroup.jobName`.
- **moqui.security.UserAccount**: Referenced by `createdByUserId` in multiple entities.
- **moqui.basic.StatusItem**: Referenced by `statusId` fields.
- **moqui.basic.Enumeration**: Referenced by EnumId fields (conditionType, assignment, actionType, sessionType).
