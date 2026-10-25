import { describe, expect, it } from 'vitest';
import { contentProblems } from './content';
import { aQuestion, aReorderQuestion, aTypedQuestion } from './testing';

const rules = [{ id: 'present-perfect.result', chapter: 21, label: 'Result in the present' }];

describe('contentProblems', () => {
  it('returns no problem for valid questions', () => {
    const problems = contentProblems([aQuestion({ id: 'a' }), aQuestion({ id: 'b' })], rules);

    expect(problems).toEqual([]);
  });

  it('reports a question that does not match the schema', () => {
    const problems = contentProblems([{ ...aQuestion(), difficulty: 4 }], rules);

    expect(problems).toEqual([expect.stringMatching(/^q-1: difficulty must be/)]);
  });

  it('reports an explanation made of spaces only', () => {
    const problems = contentProblems([aQuestion({ explanation: '   ' })], rules);

    expect(problems).toEqual([expect.stringMatching(/^q-1: explanation must be/)]);
  });

  it('reports a rule tag that does not exist', () => {
    const problems = contentProblems([aQuestion({ rule: 'present-perfect.unknown' })], rules);

    expect(problems).toEqual(['q-1: unknown rule "present-perfect.unknown"']);
  });

  it('reports a question whose chapter differs from its rule’s chapter', () => {
    const problems = contentProblems([aQuestion({ chapter: 22 })], rules);

    expect(problems).toEqual(['q-1: chapter 22 differs from the chapter of rule "present-perfect.result" (21)']);
  });

  it('reports a duplicated id', () => {
    const problems = contentProblems([aQuestion({ id: 'a' }), aQuestion({ id: 'a' })], rules);

    expect(problems).toEqual(['a: duplicated id']);
  });

  it('reports an answer that is also a distractor', () => {
    const problems = contentProblems([aQuestion({ answers: ['for'], distractors: ['for', 'since'] })], rules);

    expect(problems).toEqual(['q-1: "for" is both an answer and a distractor']);
  });

  it('reports a prompt without a blank', () => {
    const problems = contentProblems([aQuestion({ prompt: 'I have lost my keys.' })], rules);

    expect(problems).toEqual(['q-1: the prompt has no ___ blank']);
  });

  it('returns no problem for a valid typed question', () => {
    const problems = contentProblems([aTypedQuestion({ rule: 'present-perfect.result' })], rules);

    expect(problems).toEqual([]);
  });

  it('reports a typed question without a blank', () => {
    const problems = contentProblems([aTypedQuestion({ rule: 'present-perfect.result', prompt: 'Ash knows Pikachu.' })], rules);

    expect(problems).toEqual(['t-1: the prompt has no ___ blank']);
  });

  it('returns no problem for a valid word-order question, which needs no blank', () => {
    const problems = contentProblems([aReorderQuestion({ rule: 'present-perfect.result' })], rules);

    expect(problems).toEqual([]);
  });

  it('reports word-order tiles that do not spell the first answer', () => {
    const problems = contentProblems([aReorderQuestion({ rule: 'present-perfect.result', tiles: ['I', 'known', 'have', 'Ash'] })], rules);

    expect(problems).toEqual(['r-1: the tiles spell "I known have Ash", not the first answer']);
  });

  it('reports a decoy that is also a tile', () => {
    const problems = contentProblems([aReorderQuestion({ rule: 'present-perfect.result', decoys: ['have'] })], rules);

    expect(problems).toEqual(['r-1: "have" is both a tile and a decoy']);
  });
});
