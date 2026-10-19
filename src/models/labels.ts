import type { LifecycleStage } from './schema';

export const LIFECYCLE_LABELS: Record<LifecycleStage, string> = {
  initiated: 'Review initiated',
  self_evaluation: 'Self-evaluation',
  ser_preparation: 'SER preparation',
  peer_review_preparation: 'Peer review preparation',
  peer_review_completed: 'Peer review completed',
  response_and_qep: 'Response and quality enhancement plan',
  approval_recorded: 'Approval recorded',
  annual_monitoring: 'Annual monitoring',
};

export const CONFIDENCE_LABELS = {
  not_assessed: 'Not assessed',
  strong: 'Strong evidence',
  partial: 'Partial evidence',
  gap: 'Evidence gap',
} as const;

export const WORKFLOW_LABELS = {
  not_started: 'Not started',
  draft: 'Draft',
  ready_for_review: 'Ready for review',
  complete: 'Complete',
} as const;

export const APPLICABILITY_LABELS = {
  applicable: 'Applicable',
  not_applicable: 'Not applicable',
  undecided: 'Undecided',
} as const;

export const EVIDENCE_STATUS_LABELS = {
  available: 'Available',
  requested: 'Requested',
  missing: 'Missing',
  outdated: 'Outdated',
} as const;

export const CONFIDENTIALITY_LABELS = {
  public: 'Public',
  internal: 'Internal',
  sensitive: 'Sensitive (do not store detail here)',
} as const;

export const MILESTONE_STATUS_LABELS = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
  blocked: 'Blocked',
} as const;

export const IMPROVEMENT_STATUS_LABELS = {
  proposed: 'Proposed',
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
  deferred: 'Deferred',
  withdrawn: 'Withdrawn',
} as const;

export const UNIT_TYPE_LABELS = {
  faculty: 'Faculty',
  department: 'Department',
  other: 'Other / sub-unit',
} as const;

export const STAKEHOLDER_LABELS = {
  staff: 'Staff',
  student: 'Students',
  graduate: 'Graduates',
  employer: 'Employers',
  psrb: 'PSRB',
  third_party_provider: 'Third-party provider',
  other: 'Other',
} as const;

export const CHECK_STATUS_LABELS = {
  not_started: 'Not started',
  in_progress: 'In progress',
  done: 'Done',
  not_applicable: 'Not applicable',
} as const;
