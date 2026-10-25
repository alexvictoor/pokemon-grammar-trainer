import { describe, expect, it } from 'vitest';
import { gymProgress, type Gym } from './gym';
import { aQuestion } from './testing';

const gym: Gym = { id: 'cascade', leader: 'Misty', city: 'Cerulean City', badge: 'Cascade Badge', chapters: [21], team: [120, 54, 130], unlockAt: 70, types: ['water'], reward: 245 };

const questions = [
  aQuestion({ id: 'a', chapter: 21 }),
  aQuestion({ id: 'b', chapter: 21 }),
  aQuestion({ id: 'c', chapter: 21 }),
  aQuestion({ id: 'd', chapter: 21 }),
  aQuestion({ id: 'z', chapter: 22 }),
];

describe('gymProgress', () => {
  it('stays locked below the mastery threshold of its chapters', () => {
    const cards = { a: { box: 3, dueAt: 0 }, b: { box: 3, dueAt: 0 } };

    expect(gymProgress(gym, questions, cards)).toEqual({ mastery: 50, unlocked: false });
  });

  it('unlocks once its chapters reach the threshold', () => {
    const cards = { a: { box: 3, dueAt: 0 }, b: { box: 4, dueAt: 0 }, c: { box: 5, dueAt: 0 } };

    expect(gymProgress(gym, questions, cards)).toEqual({ mastery: 75, unlocked: true });
  });

  it('ignores the chapters the gym does not test', () => {
    const cards = { a: { box: 3, dueAt: 0 }, b: { box: 3, dueAt: 0 }, c: { box: 3, dueAt: 0 }, z: { box: 1, dueAt: 0 } };

    expect(gymProgress(gym, questions, cards)).toEqual({ mastery: 75, unlocked: true });
  });
});
