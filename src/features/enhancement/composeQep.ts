import type { Improvement, Workspace } from '../../models/schema';
import { IMPROVEMENT_STATUS_LABELS } from '../../models/labels';
import { formatDate, sortByDate } from '../../utils/dates';
import { MISSING, type Block, type Chapter } from '../ser/composeSer';

export const QEP_STATUS_LABEL =
  'Working document — provisional suggestions are kept separate from post-review actions. Approval records are facts entered by the unit, not approvals given by this tool.';

const t = (s?: string) => (s && s.trim() ? s.trim() : '');
const f = (label: string, s?: string): Block =>
  t(s) ? { type: 'field', label, text: t(s) } : { type: 'field', label, text: MISSING, missing: true };

function actionBlocks(i: Improvement, recText?: string): Block[] {
  const blocks: Block[] = [
    { type: 'heading', level: 3, text: i.title || 'Untitled action' },
  ];
  if (recText !== undefined) blocks.push(f('Responds to recommendation', recText));
  blocks.push(
    f('Rationale', i.rationale),
    f('Owner', i.owner),
    f('Target date', i.targetDate ? formatDate(i.targetDate) : undefined),
    f('Resource implications', i.resourceImplications),
    f('Success measure', i.measureOfSuccess),
    { type: 'field', label: 'Status', text: IMPROVEMENT_STATUS_LABELS[i.status] },
  );
  if (i.relatedQuestionIds.length) blocks.push({ type: 'field', label: 'Related questions', text: i.relatedQuestionIds.join(', ') });
  if (i.updates.length) {
    blocks.push({
      type: 'bullets',
      items: sortByDate(i.updates, (u) => u.date).map((u) => `${formatDate(u.date)}: ${u.note}`),
    });
  }
  return blocks;
}

export function composeQep(ws: Workspace): Chapter[] {
  const provisional = ws.improvements.filter((i) => i.origin === 'self_evaluation');
  const formal = ws.improvements.filter((i) => i.origin === 'peer_review');
  const recs = new Map(ws.peerRecommendations.map((r) => [r.id, r]));
  const none = (what: string): Block[] => [{ type: 'paragraph', text: `[No ${what} recorded]`, missing: true }];

  return [
    {
      id: 'provisional',
      number: 1,
      title: 'Provisional improvement suggestions (pre-review)',
      blocks: [
        {
          type: 'paragraph',
          note: true,
          text: 'Ideas identified by the unit during self-evaluation. These are not approved actions.',
        },
        ...(provisional.length ? provisional.flatMap((i) => actionBlocks(i)) : none('provisional suggestions')),
      ],
    },
    {
      id: 'recommendations',
      number: 2,
      title: 'Peer review recommendations and responses',
      blocks: ws.peerRecommendations.length
        ? ws.peerRecommendations.flatMap((r, n): Block[] => [
            { type: 'heading', level: 3, text: `Recommendation ${n + 1}${r.reportReference ? ` (${r.reportReference})` : ''}` },
            f('Recommendation', r.recommendation),
            f('Unit response', r.unitResponse),
            f('Executive response', r.executiveResponse),
            f('Financial implications', r.financialImplications),
          ])
        : none('peer review recommendations'),
    },
    {
      id: 'qep-actions',
      number: 3,
      title: 'Quality enhancement plan actions (post-review)',
      blocks: formal.length
        ? formal.flatMap((i) => actionBlocks(i, i.recommendationId ? recs.get(i.recommendationId)?.recommendation ?? '' : ''))
        : none('post-review actions'),
    },
    {
      id: 'approvals',
      number: 4,
      title: 'Approval records (entered manually)',
      blocks: ws.approvals.length
        ? [
            {
              type: 'table',
              headers: ['Body', 'Decision date', 'Decision', 'Reference'],
              rows: sortByDate(ws.approvals, (a) => a.decisionDate).map((a) => [
                a.body || MISSING,
                a.decisionDate ? formatDate(a.decisionDate) : MISSING,
                a.decision || MISSING,
                a.reference ?? '',
              ]),
            },
          ]
        : none('approval decisions'),
    },
    {
      id: 'annual',
      number: 5,
      title: 'Annual updates',
      blocks: ws.annualUpdates.length
        ? sortByDate(ws.annualUpdates, (u) => u.submittedDate).flatMap((u): Block[] => [
            { type: 'heading', level: 3, text: `Annual update ${u.year}` },
            f('Submitted', u.submittedDate ? formatDate(u.submittedDate) : undefined),
            f('Summary', u.summary),
            {
              type: 'field',
              label: 'Actions covered',
              text: u.actionIds.map((id) => ws.improvements.find((i) => i.id === id)?.title ?? id).join('; ') || 'None selected',
            },
          ])
        : none('annual updates'),
    },
  ];
}
