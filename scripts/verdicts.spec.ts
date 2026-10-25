import { describe, expect, it } from 'vitest';
import { aQuestion } from '../src/domain/testing';
import { questionHash, recordVerdicts, verdictProblems, type VerdictFile } from './verdicts';

const question = aQuestion({ id: 'ch21-result-001' });

const verdictFile = (overrides: Partial<VerdictFile> = {}): VerdictFile => ({ gate: true, verdicts: {}, ...overrides });

describe('questionHash', () => {
  it('returns the same hash whatever the key order', () => {
    const reordered = Object.fromEntries(Object.entries(question).reverse()) as typeof question;

    expect(questionHash(reordered)).toBe(questionHash(question));
  });

  it('returns a different hash when the content changes', () => {
    const edited = { ...question, prompt: `${question.prompt} ` };

    expect(questionHash(edited)).not.toBe(questionHash(question));
  });
});

describe('verdictProblems', () => {
  it('returns no problem when every question passed for its current hash', () => {
    const file = verdictFile({ verdicts: { [question.id]: { hash: questionHash(question), verdict: 'pass' } } });

    expect(verdictProblems([question], file)).toEqual([]);
  });

  it('reports a question that was never judged', () => {
    expect(verdictProblems([question], verdictFile())).toEqual(['ch21-result-001: not judged yet']);
  });

  it('reports a question edited since it was judged', () => {
    const file = verdictFile({ verdicts: { [question.id]: { hash: 'old-hash', verdict: 'pass' } } });

    expect(verdictProblems([question], file)).toEqual(['ch21-result-001: edited since it was judged']);
  });

  it('reports a question that failed', () => {
    const file = verdictFile({ verdicts: { [question.id]: { hash: questionHash(question), verdict: 'fail', reasons: ['two options are correct'] } } });

    expect(verdictProblems([question], file)).toEqual(['ch21-result-001: failed (two options are correct)']);
  });

  it('accepts a failed question that the teacher overrode', () => {
    const file = verdictFile({
      verdicts: { [question.id]: { hash: questionHash(question), verdict: 'fail', reasons: ['too easy'], override: 'Kept on purpose as a warm-up' } },
    });

    expect(verdictProblems([question], file)).toEqual([]);
  });

  it('returns no problem while the gate is off', () => {
    expect(verdictProblems([question], verdictFile({ gate: false }))).toEqual([]);
  });
});

describe('recordVerdicts', () => {
  const failing = {
    id: question.id,
    verdict: 'fail' as const,
    criteria: {
      'one-right-answer': { pass: false, reason: 'lost is also accepted' },
      'natural-english': { pass: true, reason: 'fine' },
    },
  };

  it('stores each verdict with the hash of the question as judged', () => {
    const file = recordVerdicts(verdictFile({ gate: false }), [{ id: question.id, verdict: 'pass', criteria: {} }], [question]);

    expect(file).toEqual({ gate: false, verdicts: { [question.id]: { hash: questionHash(question), verdict: 'pass' } } });
  });

  it('keeps the reasons of the failed criteria', () => {
    const file = recordVerdicts(verdictFile(), [failing], [question]);

    expect(file.verdicts[question.id]).toEqual({ hash: questionHash(question), verdict: 'fail', reasons: ['one-right-answer: lost is also accepted'] });
  });

  it('keeps the verdicts of questions that were not judged again', () => {
    const other = { hash: 'abc', verdict: 'pass' as const };

    const file = recordVerdicts(verdictFile({ verdicts: { other } }), [failing], [question]);

    expect(file.verdicts.other).toEqual(other);
  });

  it('rejects a verdict for an unknown question', () => {
    const record = () => recordVerdicts(verdictFile(), [{ ...failing, id: 'ch21-unknown' }], [question]);

    expect(record).toThrow('No question with id ch21-unknown');
  });
});
