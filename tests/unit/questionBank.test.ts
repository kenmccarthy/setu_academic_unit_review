import { AREAS, QUESTIONS, UNIVERSAL_PROMPTS, getQuestion, questionsForArea } from '../../src/data/questionBank';

describe('question bank', () => {
  it('has 45 questions with unique, stable IDs', () => {
    expect(QUESTIONS).toHaveLength(45);
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(45);
    for (const q of QUESTIONS) expect(q.id).toMatch(/^(SD|TLA|RIS|SES|PPA|EXT|RES|QAE|FUT)-0[1-5]$/);
  });

  it('has nine areas with five questions each, in order', () => {
    expect(AREAS).toHaveLength(9);
    expect(AREAS.map((a) => a.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const a of AREAS) {
      const qs = questionsForArea(a.id);
      expect(qs.map((q) => q.id)).toEqual([1, 2, 3, 4, 5].map((n) => `${a.prefix}-0${n}`));
    }
  });

  it('marks every question as suggested, never required', () => {
    for (const q of QUESTIONS) {
      expect(q.required).toBe(false);
      expect(q.evidenceSuggestions.length).toBeGreaterThan(0);
      expect(q.policyReferences.length).toBeGreaterThan(0);
      expect(q.prompts).toEqual(expect.arrayContaining([...UNIVERSAL_PROMPTS]));
    }
  });

  it('keeps known question wording', () => {
    expect(getQuestion('SD-01')?.question).toBe('How clearly is the unit’s purpose articulated and aligned with SETU strategy?');
    expect(getQuestion('PPA-05')?.applicability).toBe('where_relevant');
    expect(getQuestion('FUT-05')?.question).toBe('How will success be recognised and reviewed?');
  });
});
