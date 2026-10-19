import { AREAS, questionsForArea } from '../../data/questionBank';
import type { Workspace } from '../../models/schema';
import { CONFIDENCE_LABELS, EVIDENCE_STATUS_LABELS, LIFECYCLE_LABELS, STAKEHOLDER_LABELS, UNIT_TYPE_LABELS } from '../../models/labels';
import { getReflection } from '../../models/workspace';
import { formatDate, sortByDate } from '../../utils/dates';

export const DRAFT_LABEL = 'Draft — structure pending confirmation against official SETU SER template';
export const MISSING = '[Not yet written]';

export type Block =
  | { type: 'heading'; level: 3 | 4; text: string }
  | { type: 'paragraph'; text: string; missing?: boolean; note?: boolean }
  | { type: 'field'; label: string; text: string; missing?: boolean }
  | { type: 'bullets'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] };

export interface Chapter {
  id: string;
  number: number;
  title: string;
  blocks: Block[];
}

export interface SerDocument {
  title: string;
  unitName: string;
  unitType: string;
  scope: string;
  period: string;
  statusLabel: string;
  policyVersion: string;
  lifecycleStage: string;
  exportDate: string;
  executiveSummary: Block[];
  chapters: Chapter[];
  appendices: Chapter[];
}

export interface SerSectionDef {
  id: string;
  title: string;
  hint: string;
}

/** Proposed draft sections. Not the official SETU SER structure. */
export const SER_SECTIONS: SerSectionDef[] = [
  {
    id: 'methodology',
    title: 'Methodology and stakeholder engagement',
    hint: 'How the self-evaluation was organised and who contributed. A factual list of recorded engagement is added automatically.',
  },
  { id: 'unit_overview', title: 'Unit overview', hint: 'Context: the unit, its scope, provision and staffing at aggregate level.' },
  ...AREAS.map((a) => ({
    id: `area:${a.id}`,
    title: a.title,
    hint: 'Optional contextual narrative for this area. Question-by-question reflections are included beneath it.',
  })),
  { id: 'cross_cutting', title: 'Cross-cutting findings', hint: 'Themes that run across several areas. Write this yourself; the tool does not generate it.' },
  { id: 'priorities', title: 'Preliminary priorities', hint: 'Provisional priorities. Recorded provisional improvements are listed beneath.' },
];

export function statusLabel(ws: Workspace): string {
  if (ws.ser.officialTemplateConfirmed) {
    return `Draft — unit has recorded that this structure was checked against the official SER template${
      ws.ser.templateVersion ? ` (${ws.ser.templateVersion})` : ''
    }`;
  }
  return DRAFT_LABEL;
}

const text = (s: string | undefined) => (s && s.trim() ? s.trim() : '');
const para = (s: string | undefined): Block =>
  text(s) ? { type: 'paragraph', text: text(s) } : { type: 'paragraph', text: MISSING, missing: true };
const field = (label: string, s: string | undefined): Block =>
  text(s) ? { type: 'field', label, text: text(s) } : { type: 'field', label, text: MISSING, missing: true };

export function includedSections(ws: Workspace): SerSectionDef[] {
  const excluded = new Set(ws.ser.excludedSectionIds);
  return SER_SECTIONS.filter((s) => !excluded.has(s.id));
}

/** Evidence in the appendix, numbered E1… in register order. */
export function appendixEvidence(ws: Workspace) {
  const selected = new Set(ws.ser.selectedEvidenceIds);
  return ws.evidence.filter((e) => selected.has(e.id)).map((e, i) => ({ ...e, ref: `E${i + 1}` }));
}

function sectionHasContent(ws: Workspace, id: string): boolean {
  if (text(ws.ser.sectionNarratives[id])) return true;
  if (id.startsWith('area:')) {
    return questionsForArea(id.slice(5)).some((q) => text(getReflection(ws, q.id).response));
  }
  if (id === 'methodology') return ws.engagements.length > 0;
  return false;
}

export function serReadiness(ws: Workspace) {
  const inc = includedSections(ws);
  return {
    included: inc.length,
    withContent: inc.filter((s) => sectionHasContent(ws, s.id)).length,
    hasExecutiveSummary: !!text(ws.ser.executiveSummary),
    appendixItems: ws.ser.selectedEvidenceIds.length,
  };
}

export function composeSer(ws: Workspace, exportDate = new Date().toISOString().slice(0, 10)): SerDocument {
  const appendix = appendixEvidence(ws);
  const refById = new Map(appendix.map((e) => [e.id, e.ref]));
  const evidenceById = new Map(ws.evidence.map((e) => [e.id, e]));

  const chapters: Chapter[] = includedSections(ws).map((s, idx) => {
    const blocks: Block[] = [];
    const narrative = ws.ser.sectionNarratives[s.id];

    if (s.id === 'methodology') {
      blocks.push(para(narrative));
      const rows = sortByDate(ws.engagements, (g) => g.completedDate ?? g.plannedDate).map((g) => [
        STAKEHOLDER_LABELS[g.stakeholderGroup],
        g.method || MISSING,
        g.notYetConsulted ? 'Not yet consulted' : g.completedDate ? `Completed ${formatDate(g.completedDate)}` : g.plannedDate ? `Planned ${formatDate(g.plannedDate)}` : 'Not scheduled',
      ]);
      blocks.push({ type: 'heading', level: 3, text: 'Recorded engagement activity' });
      blocks.push(
        rows.length
          ? { type: 'table', headers: ['Group', 'Method', 'Status'], rows }
          : { type: 'paragraph', text: '[No engagement activity recorded]', missing: true },
      );
    } else if (s.id === 'unit_overview') {
      blocks.push(field('Unit type', UNIT_TYPE_LABELS[ws.unitType]));
      blocks.push(field('Scope', ws.scope));
      blocks.push(para(narrative));
    } else if (s.id.startsWith('area:')) {
      if (text(narrative)) blocks.push({ type: 'paragraph', text: text(narrative) });
      for (const q of questionsForArea(s.id.slice(5))) {
        const r = getReflection(ws, q.id);
        blocks.push({ type: 'heading', level: 3, text: `${q.id} ${q.question}` });
        if (r.applicability === 'not_applicable') {
          blocks.push({
            type: 'paragraph',
            text: `Recorded as not applicable${text(r.notApplicableReason) ? `: ${text(r.notApplicableReason)}` : ' (no reason recorded)'}.`,
          });
          continue;
        }
        blocks.push(field('Contextual narrative', r.response));
        blocks.push(field('Strengths', r.strengths));
        blocks.push(field('Challenges', r.challenges));
        const refs = r.evidenceIds.map((id) => {
          const ev = evidenceById.get(id);
          const ref = refById.get(id);
          return ref ? `${ref} ${ev?.title ?? ''}`.trim() : `${ev?.title ?? 'Unknown evidence'} (not in appendix)`;
        });
        blocks.push(
          refs.length
            ? { type: 'field', label: 'Evidence references', text: refs.join('; ') }
            : { type: 'field', label: 'Evidence references', text: '[No evidence linked]', missing: true },
        );
        blocks.push(field('Potential enhancements', r.improvementIdeas));
        if (r.confidence !== 'not_assessed') {
          blocks.push({ type: 'paragraph', text: `Unit’s evidence confidence: ${CONFIDENCE_LABELS[r.confidence]}.`, note: true });
        }
      }
    } else if (s.id === 'priorities') {
      blocks.push(para(narrative));
      const prov = ws.improvements.filter((i) => i.origin === 'self_evaluation');
      blocks.push({ type: 'heading', level: 3, text: 'Provisional improvements recorded during self-evaluation' });
      blocks.push(
        prov.length
          ? { type: 'bullets', items: prov.map((i) => i.title || 'Untitled improvement') }
          : { type: 'paragraph', text: '[No provisional improvements recorded]', missing: true },
      );
    } else {
      blocks.push(para(narrative));
    }
    return { id: s.id, number: idx + 1, title: s.title, blocks };
  });

  const appendices: Chapter[] = [
    {
      id: 'appendix-evidence',
      number: 1,
      title: 'Evidence index',
      blocks: appendix.length
        ? [
            {
              type: 'table',
              headers: ['Ref', 'Title', 'Source', 'Date', 'Status', 'Supports'],
              rows: appendix.map((e) => [
                e.ref,
                e.title || MISSING,
                e.source ?? '',
                e.evidenceDate ?? '',
                EVIDENCE_STATUS_LABELS[e.status],
                e.questionIds.join(', '),
              ]),
            },
          ]
        : [{ type: 'paragraph', text: '[No evidence selected for the appendix]', missing: true }],
    },
    {
      id: 'appendix-consultation',
      number: 2,
      title: 'Consultation summary',
      blocks: ws.engagements.length
        ? ws.engagements.flatMap((g): Block[] => [
            { type: 'heading', level: 3, text: `${STAKEHOLDER_LABELS[g.stakeholderGroup]}: ${g.method || 'Method not recorded'}` },
            field('Themes', g.themes),
            field('Findings', g.outcomes),
          ])
        : [{ type: 'paragraph', text: '[No consultation recorded]', missing: true }],
    },
  ];

  const period = ws.reviewStart || ws.reviewEnd ? `${formatDate(ws.reviewStart)} to ${formatDate(ws.reviewEnd)}` : 'Review period not recorded';

  return {
    title: 'Self-Evaluation Report (draft)',
    unitName: ws.name,
    unitType: UNIT_TYPE_LABELS[ws.unitType],
    scope: ws.scope,
    period,
    statusLabel: statusLabel(ws),
    policyVersion: ws.policyVersion,
    lifecycleStage: LIFECYCLE_LABELS[ws.lifecycleStage],
    exportDate,
    executiveSummary: [para(ws.ser.executiveSummary)],
    chapters,
    appendices,
  };
}
