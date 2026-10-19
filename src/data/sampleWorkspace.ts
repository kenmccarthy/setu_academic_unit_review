import type { Workspace } from '../models/schema';
import { createWorkspace, emptyReflection, linkEvidence, newEngagement, newEvidence, newImprovement, newMilestone } from '../models/workspace';

/**
 * Entirely fictional demonstration data. The unit, figures and events are
 * invented; no real people, programmes or records are described.
 */
export function createSampleWorkspace(): Workspace {
  const now = new Date().toISOString();
  let ws = createWorkspace('Department of Imaginary Applied Studies (FICTIONAL SAMPLE)');
  ws = {
    ...ws,
    unitType: 'department',
    scope:
      'Fictional example: the department’s three undergraduate programmes, one taught master’s, its research centre and a single collaborative arrangement with an invented partner college.',
    reviewStart: '2021-09-01',
    reviewEnd: '2026-08-31',
    coordinator: 'Head of Department (fictional)',
    lifecycleStage: 'self_evaluation',
  };

  const ev = {
    strategy: newEvidence({ title: 'Department strategic plan 2022–2026 (fictional)', source: 'Department office', type: 'Plan', period: '2022–2026', evidenceDate: '2022-06-15', status: 'available', confidentiality: 'internal', reference: 'Shared drive › Strategy › Plan v3' }),
    minutes: newEvidence({ title: 'Department board minutes (summary)', source: 'Department board', type: 'Minutes', period: '2021/22–2025/26', status: 'available', confidentiality: 'internal', limitations: 'Minutes before 2023 record decisions but not the discussion.' }),
    survey: newEvidence({ title: 'Module evaluation summary, aggregated', source: 'Quality office (fictional)', type: 'Survey', period: '2023/24–2024/25', status: 'available', confidentiality: 'internal', limitations: 'Response rates of 20–35%; part-time learners under-represented.' }),
    extExam: newEvidence({ title: 'External examiner reports and responses', source: 'Programme boards', type: 'Reports', period: '2021/22–2024/25', status: 'requested', confidentiality: 'internal', owner: 'Programme leaders' }),
    progression: newEvidence({ title: 'Programme-level progression data', source: 'Institutional data office (fictional)', type: 'Data report', period: '2021/22–2025/26', status: 'missing', confidentiality: 'internal', limitations: 'Not yet received; disaggregation to be checked for small numbers.' }),
    assessmentMap: newEvidence({ title: 'Assessment map, BSc Imaginary Studies', source: 'Programme team', type: 'Curriculum map', evidenceDate: '2025-02-01', status: 'outdated', confidentiality: 'internal', limitations: 'Predates the 2025 module changes.' }),
  };
  ws = { ...ws, evidence: Object.values(ev) };

  const reflect = (id: string, r: Partial<ReturnType<typeof emptyReflection>>) => {
    ws = { ...ws, questions: { ...ws.questions, [id]: { ...emptyReflection(id), applicability: 'applicable', updatedAt: now, ...r } } };
  };
  reflect('SD-01', {
    response:
      'The department’s plan sets out four priorities aligned to the institutional strategy. Progress is clearest on programme renewal; the research priority has advanced more slowly than planned. Staff consultation in 2025 suggested the plan is not widely referenced day to day.',
    strengths: 'Clear written priorities with annual review at the department board.',
    challenges: 'Limited visibility of the plan to staff outside the management group.',
    improvementIdeas: 'Short annual “plan on a page” discussed at a staff meeting each September.',
    confidence: 'partial',
    status: 'draft',
    owner: 'Head of Department',
  });
  reflect('TLA-02', {
    response:
      'Assessment is mapped to programme outcomes for the BSc, but the map predates recent module changes. External examiners have commented positively on standards and raised assessment load in year two.',
    strengths: 'External examiner comments on consistency of standards.',
    challenges: 'Year-two assessment bunching in weeks 10–12.',
    improvementIdeas: 'Update the assessment map and agree a programme-level assessment calendar.',
    confidence: 'partial',
    status: 'draft',
  });
  reflect('TLA-03', {
    response: 'Aggregated module evaluations show students value feedback timeliness, but comments suggest feedback is not always used for the next assessment.',
    challenges: 'Little evidence about whether feedback changes later work.',
    confidence: 'gap',
    status: 'draft',
  });
  reflect('SES-01', {
    response: 'Progression data has been requested but not yet received, so this section cannot yet be evidenced.',
    confidence: 'gap',
    status: 'draft',
  });
  reflect('PPA-05', {
    applicability: 'applicable',
    response: 'One collaborative arrangement with an invented partner college is overseen through an annual joint board.',
    status: 'draft',
  });
  reflect('RIS-03', { applicability: 'not_applicable', notApplicableReason: 'Fictional example: the department has no postgraduate research students in the review period.', status: 'complete' });

  ws = linkEvidence(ws, 'SD-01', ev.strategy.id);
  ws = linkEvidence(ws, 'SD-01', ev.minutes.id);
  ws = linkEvidence(ws, 'TLA-02', ev.extExam.id);
  ws = linkEvidence(ws, 'TLA-02', ev.assessmentMap.id);
  ws = linkEvidence(ws, 'TLA-03', ev.survey.id);
  ws = linkEvidence(ws, 'SES-01', ev.progression.id);
  ws = linkEvidence(ws, 'PPA-05', ev.minutes.id);

  ws = {
    ...ws,
    engagements: [
      newEngagement({ stakeholderGroup: 'staff', method: 'Two facilitated workshops', plannedDate: '2026-03-10', completedDate: '2026-03-24', themes: 'Workload; visibility of strategy; assessment timing.', outcomes: 'Broad support for an assessment calendar; requests for clearer communication of priorities.', linkedQuestionIds: ['SD-01', 'TLA-02'] }),
      newEngagement({ stakeholderGroup: 'student', method: 'Class representative focus group', plannedDate: '2026-04-08', themes: 'Feedback use; timetabling.', outcomes: '', linkedQuestionIds: ['TLA-03'] }),
      newEngagement({ stakeholderGroup: 'employer', method: 'Advisory panel meeting', notYetConsulted: true, themes: '', outcomes: '', linkedQuestionIds: ['EXT-02'] }),
    ],
    milestones: [
      newMilestone({ title: 'Agree review timeline', dueDate: '2026-01-31', status: 'completed', owner: 'Head of Department' }),
      newMilestone({ title: 'Stakeholder consultation completed', dueDate: '2026-05-15', status: 'in_progress', owner: 'Review coordinator' }),
      newMilestone({ title: 'Draft SER circulated within unit', dueDate: '2026-11-30', status: 'not_started', owner: 'Review coordinator' }),
      newMilestone({ title: 'Peer review visit (date set by institution)', status: 'not_started' }),
    ],
    improvements: [
      newImprovement('self_evaluation', {
        title: 'Programme-level assessment calendar',
        rationale: 'Staff and external examiner feedback point to assessment bunching in year two.',
        relatedQuestionIds: ['TLA-02'],
        owner: 'Programme leader (fictional)',
        measureOfSuccess: 'Fewer than three summative deadlines in any one week.',
      }),
    ],
  };
  ws.ser = { ...ws.ser, selectedEvidenceIds: ws.evidence.map((e) => e.id) };
  return ws;
}
