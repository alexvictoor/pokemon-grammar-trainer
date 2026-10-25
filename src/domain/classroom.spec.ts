import { describe, expect, it } from 'vitest';
import { addToRoster, chapterTable, classTable, toCsv } from './classroom';
import type { Progress } from './progressCode';
import { aQuestion } from './testing';

const DAY = 24 * 60 * 60 * 1000;
const OCT_20 = Date.UTC(2026, 9, 20, 15);

const aProgress = (overrides: Partial<Progress> = {}): Progress => ({ nickname: 'Léa', sharedAt: OCT_20, boxes: {}, seen: [], caught: {}, badges: [], ...overrides });

const rules = [
  { id: 'pp.since-for', chapter: 21, label: 'since / for' },
  { id: 'pp.just', chapter: 21, label: 'just; recently' },
];
const questions = [
  aQuestion({ id: 's1', rule: 'pp.since-for' }),
  aQuestion({ id: 's2', rule: 'pp.since-for' }),
  aQuestion({ id: 'j1', rule: 'pp.just' }),
];

describe('addToRoster', () => {
  it('adds new students in alphabetical order', () => {
    const roster = addToRoster([aProgress({ nickname: 'Tom' })], [aProgress({ nickname: 'Émile' }), aProgress({ nickname: 'Léa' })]);

    expect(roster.map(student => student.nickname)).toEqual(['Émile', 'Léa', 'Tom']);
  });

  it('replaces a student’s code with a newer one, whatever the case and spaces of the nickname', () => {
    const newer = aProgress({ nickname: ' léa ', sharedAt: OCT_20 + DAY });

    const roster = addToRoster([aProgress()], [newer]);

    expect(roster).toEqual([newer]);
  });

  it('keeps a student’s newer code when an older one is pasted', () => {
    const current = aProgress({ sharedAt: OCT_20 + DAY });

    const roster = addToRoster([current], [aProgress()]);

    expect(roster).toEqual([current]);
  });
});

describe('classTable', () => {
  const roster = [
    aProgress({ nickname: 'Léa', boxes: { s1: 3, s2: 4, j1: 1 }, caught: { 25: 2, 133: 1 }, badges: ['cascade'] }),
    aProgress({ nickname: 'Tom', boxes: { s1: 2, j1: 5 } }),
  ];

  it('returns one row per student with the mastery of each rule, the Pokémon caught and the badges', () => {
    const table = classTable(roster, questions, rules);

    expect(table.rows).toEqual([
      { nickname: 'Léa', sharedAt: OCT_20, caught: 2, badges: 1, mastery: { 'pp.since-for': 100, 'pp.just': 0 } },
      { nickname: 'Tom', sharedAt: OCT_20, caught: 0, badges: 0, mastery: { 'pp.since-for': 0, 'pp.just': 100 } },
    ]);
  });

  it('returns the class average of each rule', () => {
    const table = classTable(roster, questions, rules);

    expect(table.average).toEqual({ 'pp.since-for': 50, 'pp.just': 50 });
  });

  it('returns no average for an empty class', () => {
    const table = classTable([], questions, rules);

    expect(table.average).toEqual({});
  });
});

describe('chapterTable', () => {
  const chapterQuestions = [
    aQuestion({ id: 'a1', chapter: 21 }),
    aQuestion({ id: 'a2', chapter: 21 }),
    aQuestion({ id: 'b1', chapter: 22 }),
  ];

  it('returns the mastery of each chapter for each student, and the class average', () => {
    const table = chapterTable([aProgress({ boxes: { a1: 3, b1: 4 } }), aProgress({ nickname: 'Tom', boxes: { a2: 5 } })], chapterQuestions, [21, 22]);

    expect(table.rows.map(row => [row.nickname, row.mastery])).toEqual([
      ['Léa', { 21: 50, 22: 100 }],
      ['Tom', { 21: 50, 22: 0 }],
    ]);
    expect(table.average).toEqual({ 21: 50, 22: 50 });
  });
});

describe('toCsv', () => {
  it('writes a semicolon-separated table with a class average row', () => {
    const table = classTable([aProgress({ nickname: 'Léa', boxes: { s1: 3, s2: 3, j1: 1 }, caught: { 25: 1 }, badges: ['cascade'] })], questions, rules);

    const csv = toCsv(table, rules);

    expect(csv).toBe(
      ['Student;Shared on;Pokémon caught;Badges;since / for;"just; recently"', 'Léa;2026-10-20;1;1;100;0', 'Class average;;;;100;0'].join('\r\n'),
    );
  });

  it('quotes a nickname holding a quote or a semicolon', () => {
    const table = classTable([aProgress({ nickname: 'Jo "the; best"' })], questions, rules);

    const csv = toCsv(table, rules);

    expect(csv.split('\r\n')[1]).toBe('"Jo ""the; best""";2026-10-20;0;0;0;0');
  });
});
