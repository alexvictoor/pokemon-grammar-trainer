import { isDue } from './leitner';
import type { Cards } from './mastery';
import type { Question } from './question';

const priorityOf = (question: Question, cards: Cards, now: number): number => {
  const card = cards[question.id];
  if (!card) return 2;
  if (!isDue(card, now)) return 3;
  return card.box === 1 ? 0 : 1;
};

const lowestBoxFirst = (cards: Cards) => (a: Question, b: Question): number => {
  const cardA = cards[a.id];
  const cardB = cards[b.id];
  return (cardA?.box ?? 0) - (cardB?.box ?? 0) || (cardA?.dueAt ?? 0) - (cardB?.dueAt ?? 0);
};

const firstNonEmpty = (...lists: Question[][]): Question[] => lists.find(list => list.length > 0) ?? [];

export const nextQuestion = (questions: Question[], cards: Cards, now: number, random: () => number, recent: string[] = []): Question => {
  const candidates = firstNonEmpty(
    questions.filter(question => !recent.includes(question.id)),
    questions.filter(question => question.id !== recent.at(-1)),
    questions,
  );
  const best = Math.min(...candidates.map(question => priorityOf(question, cards, now)));
  const group = candidates.filter(question => priorityOf(question, cards, now) === best);
  if (best === 3) return [...group].sort(lowestBoxFirst(cards))[0] as Question;
  return group[Math.floor(random() * group.length)] as Question;
};
