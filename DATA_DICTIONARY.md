# Data dictionary

Schema version **1**. The authoritative definition is `src/models/schema.ts` (Zod); this document
describes it. Timestamps are ISO-8601 UTC (`2026-10-19T13:37:14.128Z`); dates are `YYYY-MM-DD`.
New records use UUID v4 identifiers. Text limits are enforced on import.

Fields marked † are additions to the specification’s TypeScript contract, needed by the interface.

## Backup envelope (exported JSON)

| Field | Type | Notes |
|---|---|---|
| `format` | `"setu-aur-workspace"` | Identifies the file type |
| `schemaVersion` | integer | Version of `workspace`; newer versions are rejected, older ones migrated step by step |
| `appVersion` | string | Version of the tool that exported it |
| `exportedAt` | timestamp | |
| `workspace` | Workspace | See below |

## Workspace

| Field | Type | Notes |
|---|---|---|
| `schemaVersion` | `1` | |
| `id` | UUID | |
| `name` | string | Unit name |
| `unitType` | `faculty` \| `department` \| `other` | |
| `scope` | string | What the review covers |
| `reviewStart`, `reviewEnd` | date? | Review period |
| `coordinator` | string? | A role is sufficient |
| `policyVersion` | string | Source policy label, printed on exports |
| `createdAt`, `updatedAt` | timestamp | |
| `lifecycleStage` | see below | Descriptive only |
| `questions` | map questionId → Reflection | Created when first edited |
| `evidence` | Evidence[] | |
| `engagements` | Engagement[] | |
| `milestones` | Milestone[] | |
| `improvements` | Improvement[] | Provisional (pre-review) and QEP (post-review) actions |
| `peerRecommendations` | PeerRecommendation[] | |
| `approvals` | ApprovalRecord[] | Facts entered manually |
| `annualUpdates` | AnnualUpdate[] | |
| `peerReviewChecklist` † | map itemId → `{ status, notes }` | `status`: `not_started`, `in_progress`, `done`, `not_applicable`. Item IDs: `ser_version`, `evidence_index`, `stakeholder_representation`, `logistics`, `briefing_materials`, `discussion_themes`, `unresolved_issues` |
| `ser` | SerDraft | |

**Lifecycle stages:** `initiated`, `self_evaluation`, `ser_preparation`, `peer_review_preparation`,
`peer_review_completed`, `response_and_qep`, `approval_recorded`, `annual_monitoring`.

## Reflection

| Field | Type | Notes |
|---|---|---|
| `questionId` | string | Must match a question bank ID (`SD-01` … `FUT-05`) |
| `applicability` | `applicable` \| `not_applicable` \| `undecided` | |
| `notApplicableReason` | string? | |
| `response`, `strengths`, `challenges`, `improvementIdeas` | string | Free text |
| `evidenceIds` | UUID[] | Kept in step with `Evidence.questionIds` |
| `confidence` | `not_assessed` \| `strong` \| `partial` \| `gap` | The unit’s view of its evidence, not a quality rating |
| `status` | `not_started` \| `draft` \| `ready_for_review` \| `complete` | Becomes `draft` automatically on first edit |
| `owner` | string? | |
| `updatedAt` | timestamp | Empty string if never edited |

## Evidence

| Field | Type | Notes |
|---|---|---|
| `id`, `title` | | |
| `description`, `source`, `type` (category), `reference`, `owner`, `period`, `limitations` | string? | `reference` is a user-supplied URL or location; not validated |
| `evidenceDate` | date? | |
| `confidentiality` | `public` \| `internal` \| `sensitive` | |
| `status` | `available` \| `requested` \| `missing` \| `outdated` | |
| `questionIds` | string[] | |

## Engagement

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `stakeholderGroup` | `staff` \| `student` \| `graduate` \| `employer` \| `psrb` \| `third_party_provider` \| `other` | |
| `method` | string | |
| `plannedDate`, `completedDate` | date? | Not completed = unresolved |
| `themes`, `outcomes` | string | Anonymised summaries |
| `followUp` † | string? | |
| `notYetConsulted` † | boolean? | Explicit “not yet consulted” |
| `linkedQuestionIds` | string[] | |

## Milestone

`id`, `title`, `dueDate?`, `owner?`, `status` (`not_started`, `in_progress`, `completed`, `blocked`), `notes?`.

## Improvement (action)

| Field | Type | Notes |
|---|---|---|
| `id`, `title`, `rationale` | | |
| `origin` | `self_evaluation` \| `peer_review` | Pre-review provisional vs post-review QEP action |
| `relatedQuestionIds` | string[] | |
| `recommendationId` | UUID? | Link to a PeerRecommendation |
| `owner`, `targetDate`, `resourceImplications`, `measureOfSuccess` | optional | |
| `status` | `proposed` \| `not_started` \| `in_progress` \| `completed` \| `deferred` \| `withdrawn` | Specification left this as free text; constrained here |
| `updates` | `{ date, note }[]` | Progress notes |

## PeerRecommendation

`id`, `recommendation`, `reportReference?`, `unitResponse?`, `executiveResponse?`, `financialImplications?`.

## ApprovalRecord

`id`, `body`, `decisionDate?`, `decision?`, `reference?`, `enteredBy?`. A record of a decision made
elsewhere; creating one approves nothing.

## AnnualUpdate

`id`, `year`, `submittedDate?`, `summary`, `actionIds` (Improvement IDs).

## SerDraft

| Field | Type | Notes |
|---|---|---|
| `executiveSummary` | string | |
| `sectionNarratives` | map sectionId → string | Section IDs: `methodology`, `unit_overview`, `area:SD` … `area:FUT`, `cross_cutting`, `priorities` |
| `selectedEvidenceIds` | UUID[] | Evidence in the numbered appendix (E1, E2… in register order) |
| `excludedSectionIds` † | string[] | Sections left out of the draft |
| `officialTemplateConfirmed` | boolean | The unit records that it checked the structure |
| `templateVersion` | string? | |

## Integrity rules (applied on import)

- Duplicate IDs in any collection: the file is rejected.
- Evidence ↔ question links are made symmetric; links to unknown questions or evidence are removed.
- Action links to unknown recommendations, and annual-update links to unknown actions, are removed.
- Every repair is listed to the user before they confirm the import.
- Unknown fields are dropped.

## Migrations

`src/utils/exportJson.ts` holds `MIGRATIONS`, one function per version step. Version 1 is the first
schema, so there are none yet. A future change must add a step rather than reshape data silently. The
workspace being replaced is always copied into the internal `backups` store first.
