import { masteryByChapter, masteryByRule } from './mastery';
import type { Progress } from './progressCode';
import type { Question, Rule } from './question';

export interface StudentRow {
  nickname: string;
  sharedAt: number;
  caught: number;
  badges: number;
  mastery: Record<string, number>;
}

export interface ClassTable {
  rows: StudentRow[];
  average: Record<string, number>;
}

const keyOf = (nickname: string): string => nickname.trim().toLocaleLowerCase('fr');

export const addToRoster = (roster: Progress[], incoming: Progress[]): Progress[] => {
  const byStudent = new Map(roster.map(progress => [keyOf(progress.nickname), progress]));
  for (const progress of incoming) {
    const current = byStudent.get(keyOf(progress.nickname));
    if (!current || progress.sharedAt > current.sharedAt) byStudent.set(keyOf(progress.nickname), progress);
  }
  return [...byStudent.values()].sort((a, b) => a.nickname.trim().localeCompare(b.nickname.trim(), 'fr', { sensitivity: 'base' }));
};

const cardsOf = (progress: Progress) => Object.fromEntries(Object.entries(progress.boxes).map(([id, box]) => [id, { box, dueAt: 0 }]));

const pick = <K extends string | number>(mastery: Record<K, number>, keys: K[]): Record<K, number> =>
  Object.fromEntries(keys.map(key => [key, mastery[key] ?? 0])) as Record<K, number>;

const averageOf = <K extends string | number>(rows: { mastery: Record<K, number> }[], keys: K[]): Record<K, number> =>
  (rows.length === 0
    ? {}
    : Object.fromEntries(keys.map(key => [key, Math.round(rows.reduce((sum, row) => sum + (row.mastery[key] ?? 0), 0) / rows.length)]))) as Record<K, number>;

export const classTable = (roster: Progress[], questions: Question[], rules: Rule[]): ClassTable => {
  const ruleIds = rules.map(rule => rule.id);
  const rows = roster.map(progress => ({
    nickname: progress.nickname,
    sharedAt: progress.sharedAt,
    caught: Object.keys(progress.caught).length,
    badges: progress.badges.length,
    mastery: pick(masteryByRule(questions, cardsOf(progress)), ruleIds),
  }));
  return { rows, average: averageOf(rows, ruleIds) };
};

export const chapterTable = (roster: Progress[], questions: Question[], chapters: number[]): { rows: { nickname: string; mastery: Record<number, number> }[]; average: Record<number, number> } => {
  const rows = roster.map(progress => ({ nickname: progress.nickname, mastery: pick(masteryByChapter(questions, cardsOf(progress)), chapters) }));
  return { rows, average: averageOf(rows, chapters) };
};

const csvField =(value: string | number): string => {
  const text = String(value);
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const isoDate = (epochMs: number): string => new Date(epochMs).toISOString().slice(0, 10);

export const toCsv = (table: ClassTable, rules: Rule[]): string =>
  [
    ['Student', 'Shared on', 'Pokémon caught', 'Badges', ...rules.map(rule => rule.label)],
    ...table.rows.map(row => [row.nickname, isoDate(row.sharedAt), row.caught, row.badges, ...rules.map(rule => row.mastery[rule.id] ?? 0)]),
    ['Class average', '', '', '', ...rules.map(rule => table.average[rule.id] ?? '')],
  ]
    .map(line => line.map(csvField).join(';'))
    .join('\r\n');
