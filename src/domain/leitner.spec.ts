import { describe, expect, it } from 'vitest';
import { DAY } from './testing';
import { isDue, newCard, review } from './leitner';

const NOW = 1_800_000_000_000;

describe('newCard', () => {
  it('starts in box 1, due immediately', () => {
    const card = newCard(NOW);

    expect(card).toEqual({ box: 1, dueAt: NOW });
  });
});

describe('review', () => {
  it.each([
    { box: 1, nextBox: 2, delay: 1 * DAY },
    { box: 2, nextBox: 3, delay: 3 * DAY },
    { box: 3, nextBox: 4, delay: 7 * DAY },
    { box: 4, nextBox: 5, delay: 21 * DAY },
    { box: 5, nextBox: 5, delay: 21 * DAY },
  ])('moves a card from box $box to box $nextBox on a correct answer', ({ box, nextBox, delay }) => {
    const card = { box, dueAt: NOW };

    const reviewed = review(card, true, NOW);

    expect(reviewed).toEqual({ box: nextBox, dueAt: NOW + delay });
  });

  it('sends a card back to box 1, due immediately, on a wrong answer', () => {
    const card = { box: 4, dueAt: NOW };

    const reviewed = review(card, false, NOW);

    expect(reviewed).toEqual({ box: 1, dueAt: NOW });
  });
});

describe('isDue', () => {
  it('returns true once the due time is reached', () => {
    const card = { box: 2, dueAt: NOW };

    expect(isDue(card, NOW)).toBe(true);
  });

  it('returns false before the due time', () => {
    const card = { box: 2, dueAt: NOW + 1 };

    expect(isDue(card, NOW)).toBe(false);
  });
});
