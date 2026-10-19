import { z } from 'zod';

export const SCHEMA_VERSION = 1 as const;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date in YYYY-MM-DD format')
  .optional();
const text = (max = 50_000) => z.string().max(max);
const optText = (max = 2_000) => z.string().max(max).optional();
const id = z.string().min(1).max(100);
const ids = z.array(id).max(5_000);

export const LIFECYCLE_STAGES = [
  'initiated',
  'self_evaluation',
  'ser_preparation',
  'peer_review_preparation',
  'peer_review_completed',
  'response_and_qep',
  'approval_recorded',
  'annual_monitoring',
] as const;
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const CONFIDENCE = ['not_assessed', 'strong', 'partial', 'gap'] as const;
export const WORKFLOW_STATUS = ['not_started', 'draft', 'ready_for_review', 'complete'] as const;
export const APPLICABILITY = ['applicable', 'not_applicable', 'undecided'] as const;
export const EVIDENCE_STATUS = ['available', 'requested', 'missing', 'outdated'] as const;
export const CONFIDENTIALITY = ['public', 'internal', 'sensitive'] as const;
export const MILESTONE_STATUS = ['not_started', 'in_progress', 'completed', 'blocked'] as const;
export const IMPROVEMENT_STATUS = ['proposed', 'not_started', 'in_progress', 'completed', 'deferred', 'withdrawn'] as const;
export const UNIT_TYPES = ['faculty', 'department', 'other'] as const;
export const STAKEHOLDER_GROUPS = [
  'staff',
  'student',
  'graduate',
  'employer',
  'psrb',
  'third_party_provider',
  'other',
] as const;
export const CHECK_STATUS = ['not_started', 'in_progress', 'done', 'not_applicable'] as const;

export const ReflectionSchema = z.object({
  questionId: id,
  applicability: z.enum(APPLICABILITY),
  notApplicableReason: optText(),
  response: text(),
  strengths: text(),
  challenges: text(),
  improvementIdeas: text(),
  evidenceIds: ids,
  confidence: z.enum(CONFIDENCE),
  status: z.enum(WORKFLOW_STATUS),
  owner: optText(200),
  updatedAt: z.string().max(40),
});

export const EvidenceSchema = z.object({
  id,
  title: text(500),
  description: optText(5_000),
  source: optText(500),
  type: optText(200),
  reference: optText(2_000),
  owner: optText(200),
  evidenceDate: isoDate,
  period: optText(200),
  confidentiality: z.enum(CONFIDENTIALITY),
  status: z.enum(EVIDENCE_STATUS),
  limitations: optText(5_000),
  questionIds: ids,
});

export const EngagementSchema = z.object({
  id,
  stakeholderGroup: z.enum(STAKEHOLDER_GROUPS),
  method: text(500),
  plannedDate: isoDate,
  completedDate: isoDate,
  themes: text(20_000),
  outcomes: text(20_000),
  followUp: optText(10_000),
  notYetConsulted: z.boolean().optional(),
  linkedQuestionIds: ids,
});

export const MilestoneSchema = z.object({
  id,
  title: text(500),
  dueDate: isoDate,
  owner: optText(200),
  status: z.enum(MILESTONE_STATUS),
  notes: optText(5_000),
});

export const ImprovementSchema = z.object({
  id,
  origin: z.enum(['self_evaluation', 'peer_review']),
  title: text(500),
  rationale: text(20_000),
  relatedQuestionIds: ids,
  recommendationId: id.optional(),
  owner: optText(200),
  targetDate: isoDate,
  resourceImplications: optText(5_000),
  measureOfSuccess: optText(5_000),
  status: z.enum(IMPROVEMENT_STATUS),
  updates: z.array(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), note: text(10_000) })).max(500),
});

export const PeerRecommendationSchema = z.object({
  id,
  recommendation: text(10_000),
  reportReference: optText(500),
  unitResponse: optText(20_000),
  executiveResponse: optText(20_000),
  financialImplications: optText(5_000),
});

export const ApprovalRecordSchema = z.object({
  id,
  body: text(300),
  decisionDate: isoDate,
  decision: optText(5_000),
  reference: optText(500),
  enteredBy: optText(200),
});

export const AnnualUpdateSchema = z.object({
  id,
  year: text(20),
  submittedDate: isoDate,
  summary: text(20_000),
  actionIds: ids,
});

export const SerDraftSchema = z.object({
  executiveSummary: text(),
  sectionNarratives: z.record(z.string().max(100), text()),
  selectedEvidenceIds: ids,
  excludedSectionIds: z.array(z.string().max(100)).max(100),
  officialTemplateConfirmed: z.boolean(),
  templateVersion: optText(200),
});

export const PeerChecklistItemSchema = z.object({
  status: z.enum(CHECK_STATUS),
  notes: text(10_000),
});

export const WorkspaceSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id,
  name: text(300),
  unitType: z.enum(UNIT_TYPES),
  scope: text(10_000),
  reviewStart: isoDate,
  reviewEnd: isoDate,
  coordinator: optText(200),
  policyVersion: text(300),
  createdAt: z.string().max(40),
  updatedAt: z.string().max(40),
  lifecycleStage: z.enum(LIFECYCLE_STAGES),
  questions: z.record(id, ReflectionSchema),
  evidence: z.array(EvidenceSchema).max(5_000),
  engagements: z.array(EngagementSchema).max(2_000),
  milestones: z.array(MilestoneSchema).max(1_000),
  improvements: z.array(ImprovementSchema).max(2_000),
  peerRecommendations: z.array(PeerRecommendationSchema).max(1_000),
  approvals: z.array(ApprovalRecordSchema).max(500),
  annualUpdates: z.array(AnnualUpdateSchema).max(100),
  peerReviewChecklist: z.record(z.string().max(100), PeerChecklistItemSchema),
  ser: SerDraftSchema,
});

export type Workspace = z.infer<typeof WorkspaceSchema>;
export type Reflection = z.infer<typeof ReflectionSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type Engagement = z.infer<typeof EngagementSchema>;
export type Milestone = z.infer<typeof MilestoneSchema>;
export type Improvement = z.infer<typeof ImprovementSchema>;
export type PeerRecommendation = z.infer<typeof PeerRecommendationSchema>;
export type ApprovalRecord = z.infer<typeof ApprovalRecordSchema>;
export type AnnualUpdate = z.infer<typeof AnnualUpdateSchema>;
export type SerDraft = z.infer<typeof SerDraftSchema>;
export type Confidence = (typeof CONFIDENCE)[number];
export type WorkflowStatus = (typeof WORKFLOW_STATUS)[number];
export type EvidenceStatus = (typeof EVIDENCE_STATUS)[number];
export type StakeholderGroup = (typeof STAKEHOLDER_GROUPS)[number];
export type CheckStatus = (typeof CHECK_STATUS)[number];

/** Envelope written by "Download backup". */
export const ExportEnvelopeSchema = z.object({
  format: z.literal('setu-aur-workspace'),
  schemaVersion: z.number().int().positive(),
  appVersion: z.string().max(50),
  exportedAt: z.string().max(40),
  workspace: z.unknown(),
});
export type ExportEnvelope = z.infer<typeof ExportEnvelopeSchema>;
