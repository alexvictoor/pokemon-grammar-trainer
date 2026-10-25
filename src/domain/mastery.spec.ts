import { describe, expect, it } from 'vitest';
import { aQuestion } from './testing';
import { masteryByChapter, masteryByRule } from './mastery';

const questions = [
  aQuestion({ id: 'a1', rule: 'pp.since-for' }),
  aQuestion({ id: 'a2', rule: 'pp.since-for' }),
  aQuestion({ id: 'a3', rule: 'pp.since-for' }),
  aQuestion({ id: 'a4', rule: 'pp.since-for' }),
  aQuestion({ id: 'b1', rule: 'pp.experience' }),
  aQuestion({ id: 'c1', chapter: 22, rule: 'past-or-pp.dated-past' }),
];

describe('masteryByRule', () => {
  it('returns the share of a rule’s questions that reached box 3', () => {
    const cards = { a1: { box: 3, dueAt: 0 }, a2: { box: 5, dueAt: 0 }, a3: { box: 2, dueAt: 0 } };

    const mastery = masteryByRule(questions, cards);

    expect(mastery['pp.since-for']).toBe(50);
  });

  it('returns 0 for a rule whose questions were never answered', () => {
    const mastery = masteryByRule(questions, {});

    expect(mastery).toEqual({ 'pp.since-for': 0, 'pp.experience': 0, 'past-or-pp.dated-past': 0 });
  });

  it('rounds to a whole percentage', () => {
    const cards = { a1: { box: 3, dueAt: 0 } };
    const threeQuestions = questions.slice(0, 3);

    const mastery = masteryByRule(threeQuestions, cards);

    expect(mastery['pp.since-for']).toBe(33);
  });
});

describe('masteryByChapter', () => {
  it('returns the share of a chapter’s questions that reached box 3', () => {
    const cards = { a1: { box: 3, dueAt: 0 }, b1: { box: 4, dueAt: 0 }, c1: { box: 3, dueAt: 0 } };

    const mastery = masteryByChapter(questions, cards);

    expect(mastery).toEqual({ 21: 40, 22: 100 });
  });
});
