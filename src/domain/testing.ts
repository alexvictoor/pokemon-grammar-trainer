import type { ChoiceQuestion, ReorderQuestion, TypedQuestion } from './question';

export const aTypedQuestion = (overrides: Partial<TypedQuestion> = {}): TypedQuestion => ({
  id: 't-1',
  chapter: 21,
  rule: 'present-perfect.since-for',
  difficulty: 3,
  kind: 'typed',
  prompt: 'Ash ___ (know) Pikachu for a long time.',
  answers: ['has known'],
  explanation: 'Depuis + durée : present perfect.',
  ...overrides,
});

export const aReorderQuestion = (overrides: Partial<ReorderQuestion> = {}): ReorderQuestion => ({
  id: 'r-1',
  chapter: 21,
  rule: 'present-perfect.since-for',
  difficulty: 3,
  kind: 'reorder',
  prompt: 'Je connais Ash depuis dix ans.',
  tiles: ['I', 'have', 'known', 'Ash', 'for', 'ten', 'years.'],
  decoys: ['know', 'since'],
  answers: ['I have known Ash for ten years.'],
  explanation: '« Depuis » + durée : have known … for.',
  ...overrides,
});

export const aQuestion = (overrides: Partial<ChoiceQuestion> = {}): ChoiceQuestion => ({
  id: 'q-1',
  chapter: 21,
  rule: 'present-perfect.result',
  difficulty: 1,
  kind: 'choice',
  prompt: 'Oh no, I ___ my Poké Balls!',
  answers: ['have lost'],
  distractors: ['lost', 'lose'],
  explanation: 'Résultat présent : have + participe passé.',
  ...overrides,
});

export const sequence = (...values: number[]): (() => number) => {
  let index = 0;
  return () => {
    const value = values[index % values.length] ?? 0;
    index++;
    return value;
  };
};

export const MINUTE = 60 * 1000;
export const DAY = 24 * 60 * MINUTE;
