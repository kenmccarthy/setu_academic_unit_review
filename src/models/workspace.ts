import { QUESTION_IDS } from '../data/questionBank';
import { POLICY_SOURCE } from '../data/policyMapping';
import { newId } from '../utils/ids';
import { nowIso } from '../utils/dates';
import {
  SCHEMA_VERSION,
  type Engagement,
  type Evidence,
  type Improvement,
  type Milestone,
  type Reflection,
  type Workspace,
} from './schema';

export function createWorkspace(name = 'Untitled academic unit'): Workspace {
  const now = nowIso();
  return {
    schemaVersion: SCHEMA_VERSION,
    id: newId(),
    name,
    unitType: 'department',
    scope: '',
    policyVersion: POLICY_SOURCE.label,
    createdAt: now,
    updatedAt: now,
    lifecycleStage: 'initiated',
    questions: {},
    evidence: [],
    engagements: [],
    milestones: [],
    improvements: [],
    peerRecommendations: [],
    approvals: [],
    annualUpdates: [],
    peerReviewChecklist: {},
    ser: {
      executiveSummary: '',
      sectionNarratives: {},
      selectedEvidenceIds: [],
      excludedSectionIds: [],
      officialTemplateConfirmed: false,
    },
  };
}

export function emptyReflection(questionId: string): Reflection {
  return {
    questionId,
    applicability: 'undecided',
    response: '',
    strengths: '',
    challenges: '',
    improvementIdeas: '',
    evidenceIds: [],
    confidence: 'not_assessed',
    status: 'not_started',
    updatedAt: '',
  };
}

/** Reflections are created lazily; this returns a blank one if none is stored. */
export function getReflection(ws: Workspace, questionId: string): Reflection {
  return ws.questions[questionId] ?? emptyReflection(questionId);
}

export function newEvidence(partial: Partial<Evidence> = {}): Evidence {
  return {
    id: newId(),
    title: '',
    confidentiality: 'internal',
    status: 'requested',
    questionIds: [],
    ...partial,
  };
}

export function newEngagement(partial: Partial<Engagement> = {}): Engagement {
  return {
    id: newId(),
    stakeholderGroup: 'staff',
    method: '',
    themes: '',
    outcomes: '',
    linkedQuestionIds: [],
    ...partial,
  };
}

export function newMilestone(partial: Partial<Milestone> = {}): Milestone {
  return { id: newId(), title: '', status: 'not_started', ...partial };
}

export function newImprovement(origin: Improvement['origin'], partial: Partial<Improvement> = {}): Improvement {
  return {
    id: newId(),
    origin,
    title: '',
    rationale: '',
    relatedQuestionIds: [],
    status: origin === 'self_evaluation' ? 'proposed' : 'not_started',
    updates: [],
    ...partial,
  };
}

const uniq = (xs: string[]) => Array.from(new Set(xs));

/** Link evidence to a question, keeping both sides of the relationship in step. */
export function linkEvidence(ws: Workspace, questionId: string, evidenceId: string): Workspace {
  if (!ws.evidence.some((e) => e.id === evidenceId)) return ws;
  const r = getReflection(ws, questionId);
  return {
    ...ws,
    questions: {
      ...ws.questions,
      [questionId]: { ...r, evidenceIds: uniq([...r.evidenceIds, evidenceId]), updatedAt: nowIso() },
    },
    evidence: ws.evidence.map((e) =>
      e.id === evidenceId ? { ...e, questionIds: uniq([...e.questionIds, questionId]) } : e,
    ),
  };
}

export function unlinkEvidence(ws: Workspace, questionId: string, evidenceId: string): Workspace {
  const r = ws.questions[questionId];
  return {
    ...ws,
    questions: r
      ? {
          ...ws.questions,
          [questionId]: { ...r, evidenceIds: r.evidenceIds.filter((x) => x !== evidenceId), updatedAt: nowIso() },
        }
      : ws.questions,
    evidence: ws.evidence.map((e) =>
      e.id === evidenceId ? { ...e, questionIds: e.questionIds.filter((q) => q !== questionId) } : e,
    ),
  };
}

/** Replace the set of questions an evidence item supports, updating reflections to match. */
export function setEvidenceQuestions(ws: Workspace, evidenceId: string, questionIds: string[]): Workspace {
  const target = new Set(questionIds);
  const ev = ws.evidence.find((e) => e.id === evidenceId);
  if (!ev) return ws;
  let next = ws;
  for (const q of ev.questionIds) if (!target.has(q)) next = unlinkEvidence(next, q, evidenceId);
  for (const q of target) next = linkEvidence(next, q, evidenceId);
  return next;
}

export function deleteEvidence(ws: Workspace, evidenceId: string): Workspace {
  const questions: Workspace['questions'] = {};
  for (const [qid, r] of Object.entries(ws.questions)) {
    questions[qid] = r.evidenceIds.includes(evidenceId)
      ? { ...r, evidenceIds: r.evidenceIds.filter((x) => x !== evidenceId) }
      : r;
  }
  return {
    ...ws,
    questions,
    evidence: ws.evidence.filter((e) => e.id !== evidenceId),
    ser: { ...ws.ser, selectedEvidenceIds: ws.ser.selectedEvidenceIds.filter((x) => x !== evidenceId) },
  };
}

export function deleteImprovement(ws: Workspace, improvementId: string): Workspace {
  return {
    ...ws,
    improvements: ws.improvements.filter((i) => i.id !== improvementId),
    annualUpdates: ws.annualUpdates.map((u) => ({ ...u, actionIds: u.actionIds.filter((a) => a !== improvementId) })),
  };
}

export function deletePeerRecommendation(ws: Workspace, recId: string): Workspace {
  return {
    ...ws,
    peerRecommendations: ws.peerRecommendations.filter((r) => r.id !== recId),
    improvements: ws.improvements.map((i) =>
      i.recommendationId === recId ? { ...i, recommendationId: undefined } : i,
    ),
  };
}

export interface IntegrityReport {
  workspace: Workspace;
  warnings: string[];
}

/**
 * Enforce referential integrity: drop links to unknown questions, evidence,
 * recommendations or actions, and make evidence↔question links symmetric.
 * Returns human-readable warnings for anything that was repaired.
 */
export function enforceIntegrity(input: Workspace): IntegrityReport {
  const warnings: string[] = [];
  const evidenceIds = new Set(input.evidence.map((e) => e.id));
  const recIds = new Set(input.peerRecommendations.map((r) => r.id));
  const actionIds = new Set(input.improvements.map((i) => i.id));

  const dupCheck = (label: string, list: { id: string }[]) => {
    const seen = new Set<string>();
    for (const item of list) {
      if (seen.has(item.id)) throw new Error(`Duplicate ${label} ID "${item.id}".`);
      seen.add(item.id);
    }
  };
  dupCheck('evidence', input.evidence);
  dupCheck('engagement', input.engagements);
  dupCheck('milestone', input.milestones);
  dupCheck('action', input.improvements);
  dupCheck('peer recommendation', input.peerRecommendations);
  dupCheck('approval record', input.approvals);
  dupCheck('annual update', input.annualUpdates);

  const knownQ = (qid: string, where: string) => {
    if (QUESTION_IDS.has(qid)) return true;
    warnings.push(`Removed link to unknown question "${qid}" from ${where}.`);
    return false;
  };

  // Union of both link directions, restricted to known questions/evidence.
  const pairs = new Set<string>();
  const questions: Workspace['questions'] = {};
  for (const [key, r] of Object.entries(input.questions)) {
    if (!QUESTION_IDS.has(key) || r.questionId !== key) {
      warnings.push(`Dropped reflection for unknown question "${key}".`);
      continue;
    }
    for (const eid of r.evidenceIds) {
      if (evidenceIds.has(eid)) pairs.add(`${key}|${eid}`);
      else warnings.push(`Removed missing evidence link "${eid}" from ${key}.`);
    }
    questions[key] = r;
  }
  for (const e of input.evidence) {
    for (const qid of e.questionIds) if (knownQ(qid, `evidence "${e.title}"`)) pairs.add(`${qid}|${e.id}`);
  }
  const byQ = new Map<string, string[]>();
  const byE = new Map<string, string[]>();
  for (const p of pairs) {
    const [q, e] = p.split('|');
    byQ.set(q, [...(byQ.get(q) ?? []), e]);
    byE.set(e, [...(byE.get(e) ?? []), q]);
  }
  for (const [q, es] of byQ) {
    const r = questions[q] ?? { ...emptyReflection(q), status: 'draft' as const };
    questions[q] = { ...r, evidenceIds: uniq([...r.evidenceIds.filter((x) => es.includes(x)), ...es]) };
  }
  for (const [q, r] of Object.entries(questions)) {
    if (!byQ.has(q) && r.evidenceIds.length) questions[q] = { ...r, evidenceIds: [] };
  }

  const ws: Workspace = {
    ...input,
    questions,
    evidence: input.evidence.map((e) => ({ ...e, questionIds: byE.get(e.id) ?? [] })),
    engagements: input.engagements.map((g) => ({
      ...g,
      linkedQuestionIds: g.linkedQuestionIds.filter((q) => knownQ(q, `engagement "${g.method}"`)),
    })),
    improvements: input.improvements.map((i) => {
      let recommendationId = i.recommendationId;
      if (recommendationId && !recIds.has(recommendationId)) {
        warnings.push(`Removed missing recommendation link from action "${i.title}".`);
        recommendationId = undefined;
      }
      return {
        ...i,
        recommendationId,
        relatedQuestionIds: i.relatedQuestionIds.filter((q) => knownQ(q, `action "${i.title}"`)),
      };
    }),
    annualUpdates: input.annualUpdates.map((u) => {
      const kept = u.actionIds.filter((a) => actionIds.has(a));
      if (kept.length !== u.actionIds.length) warnings.push(`Removed missing action links from annual update ${u.year}.`);
      return { ...u, actionIds: kept };
    }),
    ser: {
      ...input.ser,
      selectedEvidenceIds: input.ser.selectedEvidenceIds.filter((e) => evidenceIds.has(e)),
    },
  };
  return { workspace: ws, warnings };
}
