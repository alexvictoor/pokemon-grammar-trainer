export interface Card {
  box: number;
  dueAt: number;
}

const DAY = 24 * 60 * 60 * 1000;
const TOP_BOX = 5;
const DELAY_AFTER_REACHING_BOX: Record<number, number> = {
  2: 1 * DAY,
  3: 3 * DAY,
  4: 7 * DAY,
  5: 21 * DAY,
};

export const newCard = (now: number): Card => ({ box: 1, dueAt: now });

export const review = (card: Card, correct: boolean, now: number): Card => {
  if (!correct) return newCard(now);
  const box = Math.min(card.box + 1, TOP_BOX);
  return { box, dueAt: now + (DELAY_AFTER_REACHING_BOX[box] ?? 0) };
};

export const isDue = (card: Card, now: number): boolean => card.dueAt <= now;
