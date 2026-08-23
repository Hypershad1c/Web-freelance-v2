# Domify platform-improvement audit

## Existing foundation

Domify already has the principal CRM and owner-workflow models required for the approved improvement set. The implementation should expose and refine these capabilities rather than introduce parallel records.

| Requested improvement | Existing foundation | Recommended extension |
|---|---|---|
| Listing quality | `Property`, `Media`, approval workflow, multilingual content fields | Compute a transparent score from required listing information and display actionable missing-item guidance. |
| Lead SLA and assignment | `CrmContact.firstRespondedAt`, `slaDueAt`, `CrmAssignmentRule`, `CrmActivity` | Surface SLA status, workload-aware assignment visibility, and escalation actions in the existing lead workspace. |
| Buyer alerts | `CrmSavedSearch`, alert channel, `lastNotifiedAt`, `Notification` | Add frequency and price-change preferences, then reuse the existing automation runner. |
| Document verification | `CrmDocument` already stores type, status, requested/verified timestamps, rejection reason, notes, storage key, and links to properties and CRM contacts | Add reviewer visibility, expiry awareness, and a concise verification work queue rather than a new document store. |
| Owner reporting | `OwnerReport` already stores period, delivery status, summary JSON, property, contact, and seller-case links | Expand report composition with views, saves, leads, actions, and listing-quality recommendations. |
| Neighborhood intelligence | `Neighborhood`, `City`, property relations and analytics event metadata | Add curated context and related discovery metrics using current location and property data. |
| Operational monitoring | `AnalyticsEvent`, `AuditLog`, notification records, existing production route audit | Add a read-only administrative health centre that synthesizes existing observability data. |

## Automation assessment

The requested SLA, buyer alerts, and report preparation are deterministic, operational workflows. Domify already contains an automation endpoint and CRM action layer, so the implementation should extend that existing background workflow instead of creating a separate continuous process or external service.

The existing automation runner already processes active saved searches, fetches up to five newly published matching properties, delivers email or in-app alerts, updates `lastNotifiedAt`, and dispatches queued CRM follow-ups. The improvement work should preserve this behavior and add preference-aware selection and SLA escalation logic to the same authorized workflow.

The buyer account already contains saved-search creation, channel selection, activity notifications, recommendations, and a comparison route. The comparison route already renders a financing projection, amenities, property type, neighborhood, verification state, and price-to-surface signal. The launch-control page already computes portfolio quality gaps, stale leads, subscriptions, analytics activity, email/Pusher/cron/anti-bot configuration, backup evidence, and Sentry presence. The implementation should therefore enhance detailed guidance and drill-down actions rather than create a competing dashboard.

## Additive implementation design

The release will add a reusable quality evaluator and a consolidated ADMIN operations view. It will compute listing readiness, response SLA, document-verification queues, owner-report readiness, saved-search delivery coverage, localization gaps, neighborhood context coverage, and operational signals directly from the existing data model. This avoids a migration-dependent parallel feature system and gives staff actionable routes into the existing CRM, approvals, property, account, seller, analytics, and launch-control workflows.

Saved-search controls will continue to use the existing delivery channel model and current authorized automation job. A later schema change is required before claiming precise historical price-drop alerts because the live `Property` model does not yet store price-change history; the implementation will therefore expose the current matching-notification preference rather than fabricate price-drop events.
