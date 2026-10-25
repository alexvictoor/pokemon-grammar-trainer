import type { Card } from './leitner';
import type { Question } from './question';

export type Cards = Partial<Record<string, Card>>;

const MASTERED_FROM_BOX = 3;

export const masteryOf = (questions: Question[], cards: Cards): number => {
  if (questions.length === 0) return 0;
  const mastered = questions.filter(question => (cards[question.id]?.box ?? 0) >= MASTERED_FROM_BOX).length;
  return Math.round((100 * mastered) / questions.length);
};

const masteryBy = <K extends string | number>(questions: Question[], cards: Cards, keyOf: (question: Question) => K): Record<K, number> => {
  const groups = new Map<K, Question[]>();
  for (const question of questions) groups.set(keyOf(question), [...(groups.get(keyOf(question)) ?? []), question]);
  return Object.fromEntries([...groups].map(([key, group]) => [key, masteryOf(group, cards)])) as Record<K, number>;
};

export const masteryByRule = (questions: Question[], cards: Cards): Record<string, number> => masteryBy(questions, cards, question => question.rule);

export const masteryByChapter = (questions: Question[], cards: Cards): Record<number, number> => masteryBy(questions, cards, question => question.chapter);
