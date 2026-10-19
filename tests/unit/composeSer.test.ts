import { DRAFT_LABEL, MISSING, SER_SECTIONS, composeSer, serReadiness } from '../../src/features/ser/composeSer';
import { composeQep } from '../../src/features/enhancement/composeQep';
import { createWorkspace, emptyReflection, linkEvidence, newEvidence, newImprovement } from '../../src/models/workspace';
import { createSampleWorkspace } from '../../src/data/sampleWorkspace';

const allText = (blocks: { type: string; text?: string; items?: string[]; rows?: string[][] }[]) =>
  blocks.map((b) => b.text ?? b.items?.join(' ') ?? b.rows?.flat().join(' ') ?? '').join('\n');

describe('SER composition', () => {
  it('labels missing content and never invents it', () => {
    const doc = composeSer(createWorkspace('Empty unit'));
    expect(doc.statusLabel).toBe(DRAFT_LABEL);
    expect(doc.executiveSummary[0]).toMatchObject({ text: MISSING, missing: true });
    expect(doc.chapters).toHaveLength(SER_SECTIONS.length);
    const area = doc.chapters.find((c) => c.id === 'area:SD')!;
    const fields = area.blocks.filter((b) => b.type === 'field');
    expect(fields.length).toBeGreaterThan(0);
    expect(fields.every((b) => b.type === 'field' && b.missing)).toBe(true);
    expect(allText(doc.appendices[0].blocks)).toContain('No evidence selected');
  });

  it('excludes sections and renumbers chapters', () => {
    const ws = createWorkspace();
    ws.ser.excludedSectionIds = ['methodology', 'area:RIS'];
    const doc = composeSer(ws);
    expect(doc.chapters.map((c) => c.id)).not.toContain('area:RIS');
    expect(doc.chapters[0]).toMatchObject({ id: 'unit_overview', number: 1 });
    expect(doc.chapters.at(-1)!.number).toBe(SER_SECTIONS.length - 2);
  });

  it('numbers appendix evidence and references it from sections', () => {
    let ws = createWorkspace();
    const a = newEvidence({ title: 'Alpha' });
    const b = newEvidence({ title: 'Beta' });
    ws = { ...ws, evidence: [a, b] };
    ws.questions['TLA-01'] = { ...emptyReflection('TLA-01'), response: 'We do things — “carefully”.' };
    ws = linkEvidence(linkEvidence(ws, 'TLA-01', a.id), 'TLA-01', b.id);
    ws.ser.selectedEvidenceIds = [b.id];
    const doc = composeSer(ws);
    const tla = allText(doc.chapters.find((c) => c.id === 'area:TLA')!.blocks);
    expect(tla).toContain('E1 Beta');
    expect(tla).toContain('Alpha (not in appendix)');
    expect(tla).toContain('We do things — “carefully”.');
  });

  it('shows not-applicable reasons instead of empty fields', () => {
    const ws = createWorkspace();
    ws.questions['PPA-05'] = { ...emptyReflection('PPA-05'), applicability: 'not_applicable', notApplicableReason: 'No partners' };
    const text = allText(composeSer(ws).chapters.find((c) => c.id === 'area:PPA')!.blocks);
    expect(text).toContain('Recorded as not applicable: No partners.');
  });

  it('reports readiness as a workflow measure', () => {
    const r = serReadiness(createSampleWorkspace());
    expect(r.included).toBe(SER_SECTIONS.length);
    expect(r.withContent).toBeGreaterThan(0);
    expect(r.hasExecutiveSummary).toBe(false);
  });

  it('changes the status label only when the unit records a template check', () => {
    const ws = createWorkspace();
    ws.ser.officialTemplateConfirmed = true;
    ws.ser.templateVersion = 'v2';
    expect(composeSer(ws).statusLabel).toMatch(/^Draft — .*\(v2\)$/);
  });
});

describe('QEP composition', () => {
  it('keeps provisional suggestions separate from post-review actions', () => {
    const ws = createWorkspace();
    ws.peerRecommendations = [{ id: 'r1', recommendation: 'Review assessment load' }];
    ws.improvements = [
      newImprovement('self_evaluation', { title: 'Provisional idea' }),
      newImprovement('peer_review', { title: 'Formal action', recommendationId: 'r1' }),
    ];
    const parts = composeQep(ws);
    expect(parts.map((p) => p.id)).toEqual(['provisional', 'recommendations', 'qep-actions', 'approvals', 'annual']);
    const prov = allText(parts[0].blocks);
    const formal = allText(parts[2].blocks);
    expect(prov).toContain('Provisional idea');
    expect(prov).not.toContain('Formal action');
    expect(formal).toContain('Formal action');
    expect(formal).toContain('Review assessment load');
    expect(allText(parts[3].blocks)).toContain('No approval decisions recorded');
  });
});
