import { createWorkspace, emptyReflection, linkEvidence, newEngagement, newEvidence, newImprovement, newMilestone } from '../../src/models/workspace';
import {
  areaProgress,
  hasEvidenceGap,
  missingResponses,
  nextMilestone,
  outstandingActions,
  overallProgress,
  unresolvedConsultations,
} from '../../src/utils/progress';
import { sortByDate } from '../../src/utils/dates';

describe('progress (workflow measures)', () => {
  it('handles an empty workspace', () => {
    const ws = createWorkspace();
    const p = overallProgress(ws);
    expect(p.total).toBe(45);
    expect(p.withResponse).toBe(0);
    expect(p.notStarted).toBe(45);
    expect(p.questionEvidenceGaps).toBe(0);
    expect(missingResponses(ws)).toHaveLength(45);
    expect(nextMilestone(ws)).toBeUndefined();
    expect(unresolvedConsultations(ws)).toEqual([]);
    expect(outstandingActions(ws)).toEqual([]);
  });

  it('counts statuses, not-applicable and gaps per area', () => {
    let ws = createWorkspace();
    const ev = newEvidence({ title: 'E' });
    ws = { ...ws, evidence: [ev] };
    ws.questions = {
      'SD-01': { ...emptyReflection('SD-01'), response: 'Text', status: 'complete' },
      'SD-02': { ...emptyReflection('SD-02'), response: 'Text', status: 'draft' },
      'SD-03': { ...emptyReflection('SD-03'), applicability: 'not_applicable', confidence: 'gap' },
      'SD-04': { ...emptyReflection('SD-04'), confidence: 'gap', status: 'draft' },
    };
    ws = linkEvidence(ws, 'SD-01', ev.id);
    const p = areaProgress(ws, 'SD');
    expect(p.byStatus).toEqual({ not_started: 2, draft: 2, ready_for_review: 0, complete: 1 });
    expect(p.withResponse).toBe(2);
    expect(p.notApplicable).toBe(1);
    // SD-02: response without evidence; SD-04: marked gap. SD-03 is not applicable, so excluded.
    expect(p.evidenceGaps).toBe(2);
    expect(missingResponses(ws).map((q) => q.id)).not.toContain('SD-03');
  });

  it('evidence gap rule', () => {
    expect(hasEvidenceGap({ ...emptyReflection('X'), response: '  ' })).toBe(false);
    expect(hasEvidenceGap({ ...emptyReflection('X'), response: 'a' })).toBe(true);
    expect(hasEvidenceGap({ ...emptyReflection('X'), confidence: 'gap' })).toBe(true);
  });

  it('finds the next open milestone and flags overdue', () => {
    const ws = {
      ...createWorkspace(),
      milestones: [
        newMilestone({ title: 'Later', dueDate: '2027-01-01' }),
        newMilestone({ title: 'Done', dueDate: '2020-01-01', status: 'completed' as const }),
        newMilestone({ title: 'Undated' }),
        newMilestone({ title: 'Soon', dueDate: '2026-01-01' }),
      ],
    };
    const n = nextMilestone(ws, '2026-06-01');
    expect(n?.title).toBe('Soon');
    expect(n?.overdue).toBe(true);
  });

  it('counts unresolved consultations and outstanding actions', () => {
    const ws = {
      ...createWorkspace(),
      engagements: [newEngagement({ completedDate: '2026-01-01' }), newEngagement()],
      improvements: [
        newImprovement('self_evaluation'),
        newImprovement('peer_review', { status: 'completed' }),
        newImprovement('peer_review', { status: 'withdrawn' }),
      ],
    };
    expect(unresolvedConsultations(ws)).toHaveLength(1);
    expect(outstandingActions(ws)).toHaveLength(1);
  });
});

describe('date sorting', () => {
  it('sorts ascending, undated last, stable for ties', () => {
    const items = [
      { n: 'c', d: '2026-03-01' },
      { n: 'x', d: undefined },
      { n: 'a', d: '2025-01-01' },
      { n: 'b1', d: '2026-01-01' },
      { n: 'b2', d: '2026-01-01' },
      { n: 'y', d: undefined },
    ];
    expect(sortByDate(items, (i) => i.d).map((i) => i.n)).toEqual(['a', 'b1', 'b2', 'c', 'x', 'y']);
  });
});
