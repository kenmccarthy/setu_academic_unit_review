import { AREAS, QUESTIONS, questionsForArea } from '../data/questionBank';
import type { Reflection, Workspace } from '../models/schema';
import { getReflection } from '../models/workspace';
import { sortByDate, todayDate } from './dates';

/**
 * Workflow measures only. None of these numbers rates academic quality; they
 * describe how much preparation work has been recorded.
 */

export function hasResponse(r: Reflection): boolean {
  return r.response.trim().length > 0;
}

export function isNotApplicable(r: Reflection): boolean {
  return r.applicability === 'not_applicable';
}

export interface AreaProgress {
  areaId: string;
  total: number;
  notApplicable: number;
  withResponse: number;
  byStatus: Record<Reflection['status'], number>;
  evidenceGaps: number;
}

/** A question has an evidence gap if marked "gap", or it has a response but no linked evidence. */
export function hasEvidenceGap(r: Reflection): boolean {
  if (isNotApplicable(r)) return false;
  return r.confidence === 'gap' || (hasResponse(r) && r.evidenceIds.length === 0);
}

export function areaProgress(ws: Workspace, areaId: string): AreaProgress {
  const qs = questionsForArea(areaId);
  const byStatus = { not_started: 0, draft: 0, ready_for_review: 0, complete: 0 };
  let notApplicable = 0;
  let withResponse = 0;
  let evidenceGaps = 0;
  for (const q of qs) {
    const r = getReflection(ws, q.id);
    byStatus[r.status]++;
    if (isNotApplicable(r)) notApplicable++;
    if (hasResponse(r)) withResponse++;
    if (hasEvidenceGap(r)) evidenceGaps++;
  }
  return { areaId, total: qs.length, notApplicable, withResponse, byStatus, evidenceGaps };
}

export function overallProgress(ws: Workspace) {
  const areas = AREAS.map((a) => areaProgress(ws, a.id));
  const sum = (f: (a: AreaProgress) => number) => areas.reduce((n, a) => n + f(a), 0);
  return {
    areas,
    total: QUESTIONS.length,
    withResponse: sum((a) => a.withResponse),
    notApplicable: sum((a) => a.notApplicable),
    complete: sum((a) => a.byStatus.complete),
    readyForReview: sum((a) => a.byStatus.ready_for_review),
    draft: sum((a) => a.byStatus.draft),
    notStarted: sum((a) => a.byStatus.not_started),
    questionEvidenceGaps: sum((a) => a.evidenceGaps),
  };
}

export function evidenceNeedingAttention(ws: Workspace) {
  return ws.evidence.filter((e) => e.status !== 'available');
}

export function unresolvedConsultations(ws: Workspace) {
  return ws.engagements.filter((g) => !g.completedDate);
}

export function outstandingActions(ws: Workspace) {
  return ws.improvements.filter((i) => !['completed', 'withdrawn'].includes(i.status));
}

export function upcomingMilestones(ws: Workspace, today = todayDate()) {
  const open = ws.milestones.filter((m) => m.status !== 'completed');
  return sortByDate(open, (m) => m.dueDate).map((m) => ({
    ...m,
    overdue: !!m.dueDate && m.dueDate < today,
  }));
}

export function nextMilestone(ws: Workspace, today = todayDate()) {
  return upcomingMilestones(ws, today)[0];
}

/** Questions without a response that have not been marked not applicable. */
export function missingResponses(ws: Workspace) {
  return QUESTIONS.filter((q) => {
    const r = getReflection(ws, q.id);
    return !isNotApplicable(r) && !hasResponse(r);
  });
}

/** Stakeholder groups with no recorded engagement at all. */
export function groupsNotEngaged(ws: Workspace, groups: readonly string[]) {
  const present = new Set(ws.engagements.filter((g) => !g.notYetConsulted).map((g) => g.stakeholderGroup));
  return groups.filter((g) => !present.has(g as never));
}
