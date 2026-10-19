import {
  createWorkspace,
  deleteEvidence,
  deletePeerRecommendation,
  enforceIntegrity,
  getReflection,
  linkEvidence,
  newEvidence,
  newImprovement,
  setEvidenceQuestions,
  unlinkEvidence,
} from '../../src/models/workspace';
import { WorkspaceSchema } from '../../src/models/schema';

function withEvidence() {
  const ws = createWorkspace('Test unit');
  const a = newEvidence({ title: 'A' });
  const b = newEvidence({ title: 'B' });
  return { ws: { ...ws, evidence: [a, b] }, a, b };
}

describe('evidence cross-references', () => {
  it('links both directions and ignores duplicates', () => {
    const { ws, a } = withEvidence();
    let next = linkEvidence(ws, 'SD-01', a.id);
    next = linkEvidence(next, 'SD-01', a.id);
    expect(getReflection(next, 'SD-01').evidenceIds).toEqual([a.id]);
    expect(next.evidence[0].questionIds).toEqual(['SD-01']);
  });

  it('shares one evidence item between two questions, and edits are seen by both', () => {
    const { ws, a } = withEvidence();
    let next = linkEvidence(linkEvidence(ws, 'SD-01', a.id), 'TLA-02', a.id);
    next = { ...next, evidence: next.evidence.map((e) => (e.id === a.id ? { ...e, title: 'A renamed' } : e)) };
    for (const qid of ['SD-01', 'TLA-02']) {
      const ids = getReflection(next, qid).evidenceIds;
      expect(next.evidence.filter((e) => ids.includes(e.id)).map((e) => e.title)).toEqual(['A renamed']);
    }
    expect(next.evidence.find((e) => e.id === a.id)?.questionIds.sort()).toEqual(['SD-01', 'TLA-02']);
  });

  it('unlinks one question without affecting the other', () => {
    const { ws, a } = withEvidence();
    let next = linkEvidence(linkEvidence(ws, 'SD-01', a.id), 'TLA-02', a.id);
    next = unlinkEvidence(next, 'SD-01', a.id);
    expect(getReflection(next, 'SD-01').evidenceIds).toEqual([]);
    expect(getReflection(next, 'TLA-02').evidenceIds).toEqual([a.id]);
    expect(next.evidence[0].questionIds).toEqual(['TLA-02']);
  });

  it('replaces the question set from the evidence side', () => {
    const { ws, a } = withEvidence();
    let next = linkEvidence(ws, 'SD-01', a.id);
    next = setEvidenceQuestions(next, a.id, ['RIS-01', 'QAE-02']);
    expect(getReflection(next, 'SD-01').evidenceIds).toEqual([]);
    expect(getReflection(next, 'RIS-01').evidenceIds).toEqual([a.id]);
    expect(next.evidence[0].questionIds.sort()).toEqual(['QAE-02', 'RIS-01']);
  });

  it('removes all references when evidence is deleted', () => {
    const { ws, a, b } = withEvidence();
    let next = linkEvidence(linkEvidence(ws, 'SD-01', a.id), 'SD-01', b.id);
    next = { ...next, ser: { ...next.ser, selectedEvidenceIds: [a.id, b.id] } };
    next = deleteEvidence(next, a.id);
    expect(next.evidence.map((e) => e.id)).toEqual([b.id]);
    expect(getReflection(next, 'SD-01').evidenceIds).toEqual([b.id]);
    expect(next.ser.selectedEvidenceIds).toEqual([b.id]);
  });

  it('does not link unknown evidence', () => {
    const { ws } = withEvidence();
    expect(linkEvidence(ws, 'SD-01', 'nope')).toBe(ws);
  });
});

describe('referential integrity', () => {
  it('repairs one-sided and dangling links with warnings', () => {
    const { ws, a } = withEvidence();
    const broken = {
      ...ws,
      evidence: ws.evidence.map((e) => (e.id === a.id ? { ...e, questionIds: ['SD-02', 'ZZ-99'] } : e)),
      questions: {
        'SD-01': { ...getReflection(ws, 'SD-01'), evidenceIds: [a.id, 'missing-evidence'] },
      },
    };
    const { workspace, warnings } = enforceIntegrity(broken);
    expect(getReflection(workspace, 'SD-01').evidenceIds).toEqual([a.id]);
    expect(getReflection(workspace, 'SD-02').evidenceIds).toEqual([a.id]);
    expect(workspace.evidence.find((e) => e.id === a.id)?.questionIds.sort()).toEqual(['SD-01', 'SD-02']);
    expect(warnings.some((w) => w.includes('ZZ-99'))).toBe(true);
    expect(warnings.some((w) => w.includes('missing-evidence'))).toBe(true);
    expect(WorkspaceSchema.safeParse(workspace).success).toBe(true);
  });

  it('rejects duplicate IDs', () => {
    const { ws, a } = withEvidence();
    expect(() => enforceIntegrity({ ...ws, evidence: [a, a] })).toThrow(/Duplicate evidence/);
  });

  it('clears action links to deleted recommendations', () => {
    const ws = createWorkspace();
    const rec = { id: 'r1', recommendation: 'Do X' };
    const act = newImprovement('peer_review', { recommendationId: 'r1' });
    const next = deletePeerRecommendation({ ...ws, peerRecommendations: [rec], improvements: [act] }, 'r1');
    expect(next.improvements[0].recommendationId).toBeUndefined();
  });
});
