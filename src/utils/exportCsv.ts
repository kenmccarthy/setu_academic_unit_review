import type { Workspace } from '../models/schema';
import { sortByDate } from './dates';
import { toCsv } from './csv';

export function evidenceCsv(ws: Workspace): string {
  return toCsv(
    ['id', 'title', 'source', 'type', 'date', 'period', 'status', 'confidentiality', 'owner', 'reference', 'linked_question_ids', 'limitations'],
    ws.evidence.map((e) => [
      e.id, e.title, e.source, e.type, e.evidenceDate, e.period, e.status, e.confidentiality, e.owner, e.reference,
      [...e.questionIds].sort(), e.limitations,
    ]),
  );
}

export function engagementCsv(ws: Workspace): string {
  return toCsv(
    ['id', 'stakeholder_group', 'method', 'planned_date', 'completed_date', 'not_yet_consulted', 'themes', 'outcomes', 'follow_up', 'linked_question_ids'],
    sortByDate(ws.engagements, (g) => g.plannedDate).map((g) => [
      g.id, g.stakeholderGroup, g.method, g.plannedDate, g.completedDate, g.notYetConsulted ? 'yes' : 'no',
      g.themes, g.outcomes, g.followUp, g.linkedQuestionIds,
    ]),
  );
}

export function actionsCsv(ws: Workspace): string {
  const recs = new Map(ws.peerRecommendations.map((r) => [r.id, r]));
  return toCsv(
    ['id', 'origin', 'title', 'recommendation', 'owner', 'deadline', 'resources', 'success_measure', 'status', 'related_question_ids'],
    ws.improvements.map((i) => [
      i.id, i.origin, i.title, i.recommendationId ? recs.get(i.recommendationId)?.recommendation : '', i.owner,
      i.targetDate, i.resourceImplications, i.measureOfSuccess, i.status, i.relatedQuestionIds,
    ]),
  );
}

export function milestonesCsv(ws: Workspace): string {
  return toCsv(
    ['id', 'title', 'owner', 'due_date', 'status', 'notes'],
    sortByDate(ws.milestones, (m) => m.dueDate).map((m) => [m.id, m.title, m.owner, m.dueDate, m.status, m.notes]),
  );
}
