/**
 * Proposed reflective question bank.
 *
 * All 45 questions are SUGGESTED reflective guidance drawn from the developer
 * specification. They are not mandatory SETU policy questions, and the nine
 * areas are not an official SER structure. IDs are stable and must never be
 * renumbered, because saved workspaces reference them.
 */

export const QUESTION_BANK_VERSION = '1.0.0';

export interface ReviewArea {
  id: string;
  prefix: string;
  order: number;
  title: string;
  introduction: string;
  purpose: string;
  policyReferences: string[];
}

export interface Question {
  id: string;
  areaId: string;
  question: string;
  purpose: string;
  prompts: string[];
  evidenceSuggestions: string[];
  reflectionExample: string;
  policyReferences: string[];
  required: false;
  applicability: 'all' | 'where_relevant';
  version: string;
}

/** Asked alongside every question (specification §5). */
export const UNIVERSAL_PROMPTS = [
  'What works well?',
  'What is the evidence?',
  'What is less effective?',
  'Whose perspective is missing?',
  'What would we change?',
  'How will we know improvement occurred?',
] as const;

const REFLECTION_EXAMPLE =
  'State a current practice, give a concrete example and linked evidence, identify limitations or dissenting feedback, then describe a proportionate improvement.';

export const AREAS: ReviewArea[] = [
  {
    id: 'SD',
    prefix: 'SD',
    order: 1,
    title: 'Strategic Direction and Leadership',
    introduction:
      'Reflect on how the unit sets direction, takes decisions and follows through on commitments.',
    purpose:
      'The policy places strategic direction within the scope of academic unit reviews. Reflection here helps distinguish stated ambitions from demonstrated progress.',
    policyReferences: ['Policy §1.1 (p.4): scope includes strategic direction'],
  },
  {
    id: 'TLA',
    prefix: 'TLA',
    order: 2,
    title: 'Teaching, Learning and Assessment',
    introduction:
      'Reflect on how teaching and assessment are designed, evaluated and improved, including feedback, inclusion and digital change.',
    purpose:
      'Teaching, learning and assessment are named in the policy scope, and award standards and assessment are among the matters a review considers.',
    policyReferences: [
      'Policy §1.1 (p.4): scope includes teaching and assessment',
      'Policy §2.1 (p.5): NFQ/award standards and assessment',
    ],
  },
  {
    id: 'RIS',
    prefix: 'RIS',
    order: 3,
    title: 'Research, Innovation and Scholarship',
    introduction:
      'Reflect on research priorities, culture, postgraduate support, the research–teaching relationship and impact.',
    purpose: 'Research is named within the scope of academic unit reviews.',
    policyReferences: ['Policy §1.1 (p.4): scope includes research'],
  },
  {
    id: 'SES',
    prefix: 'SES',
    order: 4,
    title: 'Student Experience and Success',
    introduction:
      'Reflect on recruitment, progression, student voice, transitions, inclusion and graduate outcomes.',
    purpose:
      'Learner achievement, access, transfer and progression are among the matters the policy asks a review to consider.',
    policyReferences: ['Policy §2.1 (p.5): learner achievement, access, transfer and progression'],
  },
  {
    id: 'PPA',
    prefix: 'PPA',
    order: 5,
    title: 'Programme Portfolio and Academic Standards',
    introduction:
      'Reflect on the coherence of the programme portfolio, alignment with standards, ongoing enhancement and third-party arrangements.',
    purpose:
      'Programme provision and award standards fall within the policy scope, and reviews cover all academic activity including third-party arrangements.',
    policyReferences: [
      'Policy §1.1 (p.4): scope includes programme provision',
      'Policy §2.1 (p.5): NFQ/award standards',
      'Policy §4.1–4.2 (pp.6–7): all academic activity, third-party arrangements',
    ],
  },
  {
    id: 'EXT',
    prefix: 'EXT',
    order: 6,
    title: 'External Engagement and Third Mission',
    introduction:
      'Reflect on regional and societal needs, employer involvement, engagement outcomes, international activity and partnerships.',
    purpose: 'Third mission activity is named within the scope of academic unit reviews.',
    policyReferences: ['Policy §1.1 (p.4): scope includes third mission'],
  },
  {
    id: 'RES',
    prefix: 'RES',
    order: 7,
    title: 'Staff Development and Resources',
    introduction:
      'Reflect on staffing capacity, professional development, learning resources, workload and future resource needs.',
    purpose:
      'Reviews are broad in scope and improvement-focused; resource context helps explain what is feasible.',
    policyReferences: ['Policy §4.1–4.2 (pp.6–7): broad review of academic activity and improvement'],
  },
  {
    id: 'QAE',
    prefix: 'QAE',
    order: 8,
    title: 'Quality Assurance and Enhancement',
    introduction:
      'Reflect on local implementation of quality assurance, use of feedback, benchmarking, academic risk and follow-through on previous reviews.',
    purpose:
      'The policy describes a cycle of self-evaluation, peer review, response, quality enhancement plan and annual updates.',
    policyReferences: [
      'Policy §4.2 (p.7): improvement focus',
      'Policy §4.3–4.4 (pp.7–8): review process and annual updates',
    ],
  },
  {
    id: 'FUT',
    prefix: 'FUT',
    order: 9,
    title: 'Future Priorities and Enhancement Planning',
    introduction:
      'Draw together strengths, challenges and feasible improvements, and decide how success will be recognised.',
    purpose:
      'The review process leads to a quality enhancement plan. Provisional priorities here are proposals only and do not replace the post-review QEP.',
    policyReferences: ['Policy §4.3–4.4 (pp.7–8): response, QEP and annual updates'],
  },
];

type Row = [id: string, question: string, guidance: string, evidence: string, applicability?: 'where_relevant'];

const ROWS: Record<string, Row[]> = {
  SD: [
    ['SD-01', 'How clearly is the unit’s purpose articulated and aligned with SETU strategy?', 'Distinguish stated ambitions from demonstrated progress.', 'Strategy statements; operational plans; minutes; performance indicators'],
    ['SD-02', 'How are priorities decided, communicated and reviewed?', 'Consider whose voices influence decisions.', 'Governance records; planning cycles; staff feedback'],
    ['SD-03', 'How effective are leadership, governance and decision-making arrangements?', 'Identify duplicated, missing or unclear accountability.', 'Committee terms; decision logs; staff consultation'],
    ['SD-04', 'What changes in the external environment affect the unit’s future?', 'Evaluate risks, opportunities and responses.', 'Sector trends; regional data; PSRB expectations'],
    ['SD-05', 'What progress has been made against previous commitments?', 'Explain incomplete actions without defensiveness.', 'Prior action plans; annual reports; outcome measures'],
  ],
  TLA: [
    ['TLA-01', 'How are teaching approaches selected, evaluated and improved?', 'Give concrete examples of changed practice.', 'Module evaluations; peer observations; CPD; learner outcomes'],
    ['TLA-02', 'How do assessment strategies support learning outcomes and academic standards?', 'Consider validity, authenticity and appropriate assessment load.', 'Assessment maps; rubrics; external examiner reports'],
    ['TLA-03', 'How effective are feedback practices for learners?', 'Examine whether feedback is used by students.', 'Student surveys; feedback samples; turnaround information'],
    ['TLA-04', 'How is inclusive and accessible learning designed and evaluated?', 'Identify barriers and the effects of adjustments.', 'Accessibility reviews; UDL examples; student consultation'],
    ['TLA-05', 'How is the unit responding to digital education and generative AI?', 'Avoid equating tool adoption with learning enhancement.', 'Assessment redesign examples; staff development; student guidance'],
  ],
  RIS: [
    ['RIS-01', 'What are the unit’s research priorities and how are they pursued?', 'Reflect on fit between ambition and capacity.', 'Research strategy; outputs; funded projects'],
    ['RIS-02', 'How does the unit support research culture and staff development?', 'Include early-career and teaching-focused staff.', 'Mentoring; workload policies; research events'],
    ['RIS-03', 'How are postgraduate researchers supported?', 'Address supervision quality and research integrity.', 'Supervision arrangements; progression; student feedback'],
    ['RIS-04', 'What is the relationship between research and teaching?', 'Describe student learning benefits.', 'Curriculum examples; research-led projects'],
    ['RIS-05', 'What evidence demonstrates research impact and collaboration?', 'Separate activity counts from demonstrable impact.', 'Partnership records; outputs; impact cases'],
  ],
  SES: [
    ['SES-01', 'What patterns appear in recruitment, retention, progression and completion?', 'Disaggregate appropriately without identifying individuals.', 'Multi-year programme-level data; contextual benchmarks'],
    ['SES-02', 'How do students influence decisions and improvements?', 'Show how feedback led to action.', 'Representation records; consultation summaries; you-said-we-did'],
    ['SES-03', 'How effectively are students supported at key transitions?', 'Consider diverse entry routes and learner needs.', 'Induction; advising; access and progression processes'],
    ['SES-04', 'How inclusive is the student experience?', 'Avoid assuming averages describe all groups.', 'Accessibility data; student voices; participation review'],
    ['SES-05', 'What is known about graduate outcomes and student aspirations?', 'Acknowledge missing or weak outcome data.', 'Graduate surveys; alumni feedback; placement data'],
  ],
  PPA: [
    ['PPA-01', 'How coherent, current and sustainable is the programme portfolio?', 'Balance disciplinary purpose, demand and capacity.', 'Programme maps; enrolment trends; review records'],
    ['PPA-02', 'How is alignment with NFQ levels and award standards assured?', 'Identify documentary and practical evidence.', 'Approved programme documents; learning outcomes; assessment maps'],
    ['PPA-03', 'How are programmes reviewed and enhanced between periodic reviews?', 'Show the improvement cycle in action.', 'Annual monitoring; programme boards; change logs'],
    ['PPA-04', 'How are external examiner and PSRB findings addressed?', 'Track closure of recommendations.', 'Reports; responses; accreditation outcomes'],
    ['PPA-05', 'How are third-party delivery arrangements overseen where applicable?', 'Record not applicable with a reason where relevant.', 'Agreements; monitoring; student support arrangements', 'where_relevant'],
  ],
  EXT: [
    ['EXT-01', 'What regional and societal needs does the unit seek to address?', 'Connect activities to identifiable needs.', 'Regional strategies; civic partnership plans'],
    ['EXT-02', 'How are employers and professional stakeholders involved?', 'Show influence on provision rather than attendance alone.', 'Advisory boards; placement feedback; consultations'],
    ['EXT-03', 'What outcomes arise from civic, industry and community engagement?', 'Distinguish outputs from outcomes.', 'Impact cases; partnership outcomes'],
    ['EXT-04', 'How is international engagement aligned with academic priorities?', 'Assess benefit and sustainability.', 'Mobility data; collaborative activity; partnership reviews'],
    ['EXT-05', 'How are external partnerships evaluated and governed?', 'Address accountability and quality assurance.', 'Partnership agreements; review records; risk registers'],
  ],
  RES: [
    ['RES-01', 'Does staffing capacity match current and planned provision?', 'Explore sustainability without identifying individuals.', 'Staffing profiles; workload data; portfolio projections'],
    ['RES-02', 'How are professional development needs identified and supported?', 'Consider access and evidence of changed practice.', 'CPD plans; participation records; evaluation'],
    ['RES-03', 'Are physical and digital learning resources fit for purpose?', 'Connect resource constraints to learning and research impact.', 'Facilities reviews; accessibility audits; user feedback'],
    ['RES-04', 'How are workload, wellbeing and collegial culture considered?', 'Handle sensitive data carefully and avoid individual-level claims.', 'Aggregated consultation; workload arrangements'],
    ['RES-05', 'What resource decisions are needed for future priorities?', 'Separate unit-controlled actions from institutional dependencies.', 'Budget scenarios; business cases; capacity plans'],
  ],
  QAE: [
    ['QAE-01', 'How are institutional quality assurance policies implemented locally?', 'Identify differences between documented and actual practice.', 'Committee minutes; monitoring records; policy mappings'],
    ['QAE-02', 'What evidence shows that feedback produces improvements?', 'Trace feedback to decisions and outcomes.', 'Action logs; evaluation results; follow-up communications'],
    ['QAE-03', 'How does the unit use benchmarking?', 'Avoid inappropriate comparisons.', 'Peer comparisons; external references; discipline norms'],
    ['QAE-04', 'How are academic risks identified, escalated and managed?', 'Clarify escalation and ownership.', 'Risk registers; governance minutes'],
    ['QAE-05', 'How are previous reviews and recommendations followed through?', 'Identify unresolved issues and reasons.', 'Review reports; completed action records'],
  ],
  FUT: [
    ['FUT-01', 'What are the unit’s most significant evidenced strengths?', 'Prioritise meaningful strengths over long inventories.', 'Cross-referenced reflections and evidence'],
    ['FUT-02', 'What challenges most affect quality and sustainability?', 'Distinguish root causes from symptoms.', 'Gap register; trend data; stakeholder themes'],
    ['FUT-03', 'Which improvement opportunities would have the greatest benefit?', 'Explain choices and trade-offs.', 'Impact/effort assessments; consultation'],
    ['FUT-04', 'What actions are feasible within unit authority and resources?', 'Identify dependencies on institutional decisions.', 'Draft action plans; ownership and budgets'],
    ['FUT-05', 'How will success be recognised and reviewed?', 'Use proportionate qualitative and quantitative measures.', 'Baseline indicators; milestones; evaluation plans'],
  ],
};

export const QUESTIONS: Question[] = AREAS.flatMap((area) =>
  ROWS[area.id].map(([id, question, guidance, evidence, applicability]) => ({
    id,
    areaId: area.id,
    question,
    purpose: guidance,
    prompts: [guidance, ...UNIVERSAL_PROMPTS],
    evidenceSuggestions: evidence.split(';').map((s) => s.trim()),
    reflectionExample: REFLECTION_EXAMPLE,
    policyReferences: area.policyReferences,
    required: false as const,
    applicability: applicability ?? 'all',
    version: QUESTION_BANK_VERSION,
  })),
);

const QUESTION_INDEX = new Map(QUESTIONS.map((q) => [q.id, q]));
const AREA_INDEX = new Map(AREAS.map((a) => [a.id, a]));

export function getQuestion(id: string): Question | undefined {
  return QUESTION_INDEX.get(id);
}

export function getArea(id: string): ReviewArea | undefined {
  return AREA_INDEX.get(id);
}

export function questionsForArea(areaId: string): Question[] {
  return QUESTIONS.filter((q) => q.areaId === areaId);
}

export const QUESTION_IDS: ReadonlySet<string> = new Set(QUESTIONS.map((q) => q.id));
