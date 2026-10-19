/**
 * Authority map from the developer specification §2. The right-hand column is
 * how this prototype responds to each anchor; it is a proposal, not something
 * the policy mandates.
 */
export const POLICY_SOURCE = {
  title: 'Academic Unit Reviews Policy',
  version: '1.0',
  approved: '2025-09-23',
  label: 'SETU Academic Unit Reviews Policy v1.0 (approved 23 September 2025)',
};

export interface PolicyAnchor {
  anchor: string;
  requirement: string;
  implementation: string;
}

export const POLICY_MAPPING: PolicyAnchor[] = [
  {
    anchor: '§1.1, p.4',
    requirement:
      'Five-year cycle; faculty/department/sub-unit reviews; strategic direction, teaching/assessment, research, programme provision and third mission.',
    implementation: 'Nine guided review areas and review-period metadata.',
  },
  {
    anchor: '§2.1, p.5',
    requirement: 'Consider NFQ/award standards, assessment, learner achievement, access, transfer and progression.',
    implementation: 'Specific reflective prompts and evidence suggestions.',
  },
  {
    anchor: '§4.1–4.2, pp.6–7',
    requirement: 'Broad review of all academic activity, third-party arrangements and improvement.',
    implementation: 'Cross-cutting thematic question bank.',
  },
  {
    anchor: '§4.3–4.4, pp.7–8',
    requirement:
      'Agreed timeline; staff/student/stakeholder self-evaluation; SER; independent peer review; report; response; QEP; approvals; publication; annual updates.',
    implementation: 'Lifecycle stages, milestone register, outputs and action tracking.',
  },
  {
    anchor: '§4.5–4.6, p.8',
    requirement:
      'OVPAA Teaching and Learning maintains guidelines and the official SER template; unit management is responsible for the SER.',
    implementation: 'Clearly provisional SER export; no claim to match the official template.',
  },
  {
    anchor: '§4.7, pp.8–9',
    requirement:
      'Peer review group appointed/approved by the Joint Quality Committee, with chair, external academic/professional representatives, external student and secretary.',
    implementation: 'Information-only peer review readiness checklist; no appointment controls.',
  },
  {
    anchor: '§5, pp.9–10',
    requirement:
      'OVPAA operational management; JQC oversight; unit self-evaluation; executive response; Academic Council/Governing Body approval and monitoring.',
    implementation: 'Responsibility guidance; app actions never constitute institutional approval.',
  },
];

export const NOT_PROVIDED_BY_POLICY = [
  'The approved AUR Procedure (listed as pending in policy §6, p.10)',
  'The official SER headings or template',
  'Fixed word counts or evidence minimums',
  'Mandated rating scales',
  'A compulsory nine-section structure',
  'Prescribed consultation methods',
  'Deadlines',
];
