import { quoteCell, sanitizeCell, toCsv } from '../../src/utils/csv';
import { actionsCsv, evidenceCsv, milestonesCsv } from '../../src/utils/exportCsv';
import { createWorkspace, newEvidence, newImprovement, newMilestone } from '../../src/models/workspace';

describe('CSV', () => {
  it.each(['=SUM(A1:A2)', '+1', '-2+3', '@cmd', '\t=1', '\r=1'])('neutralises formula-like cell %j', (v) => {
    expect(sanitizeCell(v).startsWith("'")).toBe(true);
  });

  it('leaves ordinary text alone', () => {
    expect(sanitizeCell('Plan 2025')).toBe('Plan 2025');
    expect(sanitizeCell('a=b')).toBe('a=b');
    expect(sanitizeCell(undefined)).toBe('');
    expect(sanitizeCell(['SD-01', 'SD-02'])).toBe('SD-01; SD-02');
  });

  it('quotes commas, quotes and newlines', () => {
    expect(quoteCell('a,b')).toBe('"a,b"');
    expect(quoteCell('say "hi"')).toBe('"say ""hi"""');
    expect(quoteCell('line1\nline2')).toBe('"line1\nline2"');
    expect(quoteCell('=1,2')).toBe(`"'=1,2"`);
  });

  it('writes BOM, header and CRLF rows', () => {
    const csv = toCsv(['a', 'b'], [[1, 'x']]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1)).toBe('a,b\r\n1,x\r\n');
  });

  it('exports the specified columns', () => {
    const ws = {
      ...createWorkspace(),
      evidence: [newEvidence({ title: '=HYPERLINK("x")', questionIds: ['TLA-01', 'SD-01'] })],
      improvements: [newImprovement('peer_review', { title: 'T', owner: '@owner' })],
      milestones: [newMilestone({ title: 'M', dueDate: '2026-01-01', notes: '-note' })],
    };
    const ev = evidenceCsv(ws).slice(1).split('\r\n');
    expect(ev[0]).toBe('id,title,source,type,date,period,status,confidentiality,owner,reference,linked_question_ids,limitations');
    expect(ev[1]).toContain(`"'=HYPERLINK(""x"")"`);
    expect(ev[1]).toContain('SD-01; TLA-01');
    expect(actionsCsv(ws)).toContain("'@owner");
    expect(milestonesCsv(ws)).toContain("'-note");
  });
});
