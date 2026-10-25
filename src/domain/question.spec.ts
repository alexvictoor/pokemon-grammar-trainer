import { describe, expect, it } from 'vitest';
import { aQuestion, aReorderQuestion, aTypedQuestion, sequence } from './testing';
import { optionsOf } from './question';

describe('optionsOf', () => {
  it('returns the first answer and every distractor once', () => {
    const question = aQuestion({ answers: ['for', 'For'], distractors: ['since', 'during'] });

    const options = optionsOf(question, sequence(0.9, 0.1, 0.5));

    expect([...options].sort()).toEqual(['during', 'for', 'since']);
  });

  it('shuffles the options with the given random source', () => {
    const question = aQuestion({ answers: ['a'], distractors: ['b', 'c'] });

    const options = optionsOf(question, sequence(0, 0));

    expect(options).toEqual(['b', 'c', 'a']);
  });

  it('returns the tiles and decoys of a word-order question', () => {
    const question = aReorderQuestion({ tiles: ['I', 'have', 'won.'], decoys: ['win'] });

    const options = optionsOf(question, sequence(0.5));

    expect([...options].sort()).toEqual(['I', 'have', 'win', 'won.']);
  });

  it('returns no option for a typed question', () => {
    expect(optionsOf(aTypedQuestion(), sequence(0))).toEqual([]);
  });
});
