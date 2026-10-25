import { describe, expect, it } from 'vitest';
import { isCorrect, normalizeAnswer } from './answers';
import { aQuestion, aReorderQuestion, aTypedQuestion } from './testing';

describe('normalizeAnswer', () => {
  it.each([
    { typed: '  Has   KNOWN ', normalized: 'has known' },
    { typed: 'haven’t seen', normalized: 'have not seen' },
    { typed: "haven't seen", normalized: 'have not seen' },
    { typed: "I've lost it.", normalized: 'i have lost it' },
    { typed: "won't", normalized: 'will not' },
    { typed: "can't", normalized: 'cannot' },
    { typed: "I'll catch it", normalized: 'i will catch it' },
    { typed: "shan't be", normalized: 'shall not be' },
    { typed: 'can not have cooked', normalized: 'cannot have cooked' },
    { typed: 'Have you seen it?!', normalized: 'have you seen it' },
  ])('turns "$typed" into "$normalized"', ({ typed, normalized }) => {
    expect(normalizeAnswer(typed)).toBe(normalized);
  });
});

describe('isCorrect', () => {
  it('accepts a choice that is an answer', () => {
    expect(isCorrect(aQuestion({ answers: ['has lived'] }), 'has lived')).toBe(true);
  });

  it('rejects a choice that differs only in case, since options are shown as written', () => {
    expect(isCorrect(aQuestion({ answers: ['has lived'] }), 'Has lived')).toBe(false);
  });

  it('accepts a typed answer written with a contraction', () => {
    expect(isCorrect(aTypedQuestion({ answers: ['have not seen'] }), "haven't seen")).toBe(true);
  });

  it('accepts a typed answer with extra spaces and capitals', () => {
    expect(isCorrect(aTypedQuestion({ answers: ['has known'] }), ' Has  known ')).toBe(true);
  });

  it('accepts a typed answer written with ’s for has', () => {
    expect(isCorrect(aTypedQuestion({ answers: ['has been'] }), "'s been")).toBe(true);
  });

  it('accepts a typed answer written with ’s for is', () => {
    expect(isCorrect(aTypedQuestion({ answers: ['is coming'] }), "'s coming")).toBe(true);
  });

  it('rejects a typed answer with the wrong participle', () => {
    expect(isCorrect(aTypedQuestion({ answers: ['has eaten'] }), 'has ate')).toBe(false);
  });

  it('accepts words put back in the right order', () => {
    const question = aReorderQuestion({ answers: ['I have known Ash for ten years.'] });

    expect(isCorrect(question, 'I have known Ash for ten years.')).toBe(true);
  });

  it('rejects words in the wrong order', () => {
    const question = aReorderQuestion({ answers: ['I have known Ash for ten years.'] });

    expect(isCorrect(question, 'I know Ash for ten years.')).toBe(false);
  });
});
