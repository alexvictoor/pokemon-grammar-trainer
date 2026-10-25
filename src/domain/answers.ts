import type { Question } from './question';

const CONTRACTIONS: [RegExp, string][] = [
  [/\bwon't\b/g, 'will not'],
  [/\bcan't\b/g, 'cannot'],
  [/\bshan't\b/g, 'shall not'],
  [/\bcan\s+not\b/g, 'cannot'],
  [/n't\b/g, ' not'],
  [/'ve\b/g, ' have'],
  [/'m\b/g, ' am'],
  [/'re\b/g, ' are'],
  [/'ll\b/g, ' will'],
];

export const normalizeAnswer = (text: string): string =>
  CONTRACTIONS.reduce((normalized, [pattern, expanded]) => normalized.replace(pattern, expanded), text.toLowerCase().replace(/[’‘]/g, "'"))
    .replace(/[.!?]+\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();

// 's stands for has or is: the response matches when either reading does.
const readingsOf = (response: string): string[] => {
  const normalized = normalizeAnswer(response);
  if (!normalized.includes("'s")) return [normalized];
  return ['has', 'is'].map(verb => normalizeAnswer(normalized.replace(/(^|\s|\w)'s\b/g, (_, before: string) => `${before}${before.trim() ? ' ' : ''}${verb}`)));
};

export const isCorrect = (question: Question, response: string): boolean => {
  if (question.kind === 'choice') return question.answers.includes(response);
  const readings = readingsOf(response);
  return question.answers.some(answer => readings.includes(normalizeAnswer(answer)));
};
