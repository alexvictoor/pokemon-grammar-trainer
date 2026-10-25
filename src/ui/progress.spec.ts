import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { encodeProgress, decodeProgress } from '../domain/progressCode';
import { emptyGame, SAVE_KEY } from '../domain/save';
import { aQuestion } from '../domain/testing';
import type { GameDeps } from './deps';
import { TEACHER_KEY } from './teacherStore';
import { clickButton, fillIn, memoryStorage, mimikyu, mountApp, NOW, pikachu, questions, rules } from './testing';

let storage: ReturnType<typeof memoryStorage>;

const deps = (): GameDeps => ({ storage, random: () => 0, now: () => NOW, questions, rules, pokemon: [pikachu, mimikyu], gyms: [], typeChart: {} });

const codeFor = (nickname: string, boxes: Record<string, number>, caught: Record<number, number> = {}) =>
  encodeProgress({ ...emptyGame(), cards: Object.fromEntries(Object.entries(boxes).map(([id, box]) => [id, { box, dueAt: NOW }])), caught }, nickname, NOW);

beforeEach(() => {
  storage = memoryStorage();
  document.body.innerHTML = '';
  window.location.hash = '';
});

afterEach(() => {
  window.location.hash = '';
});

describe('sharing progress', () => {
  it('creates a code that carries the nickname and the progress', async () => {
    storage.items.set(SAVE_KEY, JSON.stringify({ ...emptyGame(), cards: { q1: { box: 3, dueAt: NOW } }, caught: { 25: 1 } }));
    const wrapper = mountApp(deps());
    await clickButton(wrapper, 'Share');
    await fillIn(wrapper, '#share-nickname', '  Léa ');

    await clickButton(wrapper, 'Create my code');

    const code = (wrapper.find('#share-code').element as HTMLTextAreaElement).value;
    expect(await decodeProgress(code)).toEqual({ ok: true, progress: { nickname: 'Léa', sharedAt: NOW, boxes: { q1: 3 }, seen: [], caught: { 25: 1 }, badges: [] } });
  });

  it('asks for a nickname before creating a code', async () => {
    const wrapper = mountApp(deps());
    await clickButton(wrapper, 'Share');
    await fillIn(wrapper, '#share-nickname', '   ');

    await clickButton(wrapper, 'Create my code');

    expect(wrapper.find('#share-code').exists()).toBe(false);
    expect(wrapper.text()).toContain('Type a nickname so your teacher knows the code is yours.');
  });

  it('remembers the nickname for the next code', async () => {
    const wrapper = mountApp(deps());
    await clickButton(wrapper, 'Share');
    await fillIn(wrapper, '#share-nickname', 'Léa');
    await clickButton(wrapper, 'Create my code');

    expect(JSON.parse(storage.items.get(SAVE_KEY) ?? '{}').nickname).toBe('Léa');
  });
});

describe('restoring progress from a code', () => {
  it('replaces the progress once the student confirms', async () => {
    const code = await codeFor('Tom', { q1: 4 }, { 25: 3, 778: 1 });
    const wrapper = mountApp(deps());
    await clickButton(wrapper, 'Share');
    await fillIn(wrapper, '#restore-code', code);
    await clickButton(wrapper, 'Restore');

    await clickButton(wrapper, 'Replace my progress');

    const saved = JSON.parse(storage.items.get(SAVE_KEY) ?? '{}');
    expect(saved).toEqual({ version: 1, nickname: 'Tom', cards: { q1: { box: 4, dueAt: NOW } }, seen: [], caught: { 25: 3, 778: 1 }, badges: [], streak: 0 });
    expect(wrapper.text()).toContain('Progress restored for Tom: 2 Pokémon caught.');
  });

  it('leaves the progress unchanged when the student cancels', async () => {
    const code = await codeFor('Tom', { q1: 4 });
    const wrapper = mountApp(deps());
    await clickButton(wrapper, 'Share');
    await fillIn(wrapper, '#restore-code', code);
    await clickButton(wrapper, 'Restore');

    await clickButton(wrapper, 'Cancel');

    expect(storage.items.has(SAVE_KEY)).toBe(false);
  });

  it('explains a code with a typo', async () => {
    const code = await codeFor('Tom', { q1: 4 });
    const wrapper = mountApp(deps());
    await clickButton(wrapper, 'Share');
    await fillIn(wrapper, '#restore-code', code.slice(0, -3));

    await clickButton(wrapper, 'Restore');

    expect(wrapper.text()).toContain('This code has a typo or is incomplete. Copy it again from the message.');
  });
});

describe('the teacher page', () => {
  it('opens on the #teacher link', () => {
    window.location.hash = '#teacher';

    const wrapper = mountApp(deps());

    expect(wrapper.find('h2').text()).toBe('Class progress');
  });

  it('adds the students of pasted messages to the class table', async () => {
    window.location.hash = '#teacher';
    const pasted = `Bonjour madame\n${await codeFor('Léa', { q1: 3, q2: 3 }, { 25: 1 })}\nMerci !\n\n${await codeFor('Tom', { q1: 1 })}`;
    const wrapper = mountApp(deps());
    await fillIn(wrapper, '#teacher-codes', pasted);

    await clickButton(wrapper, 'Add to the class');

    const rows = wrapper.findAll('tbody tr').map(row => row.findAll('th, td').map(cell => cell.text()));
    expect(rows.map(row => row.slice(0, 4))).toEqual([
      ['Léa', '1', '100%', expect.stringContaining('Remove')],
      ['Tom', '0', '0%', expect.stringContaining('Remove')],
    ]);
    expect(wrapper.find('tfoot').text()).toContain('50%');
    expect(wrapper.text()).toContain('2 codes added.');
  });

  it('shows one column per chapter, then the rules of the chapter chosen', async () => {
    window.location.hash = '#teacher';
    const chapters = {
      ...deps(),
      questions: [...questions, aQuestion({ id: 'q22', chapter: 22, rule: 'past-or-pp.dated-past' })],
      rules: [...rules, { id: 'past-or-pp.dated-past', chapter: 22, label: 'A dated past event' }],
    };
    const wrapper = mountApp(chapters);
    await fillIn(wrapper, '#teacher-codes', await codeFor('Léa', { q1: 3, q2: 3 }));
    await clickButton(wrapper, 'Add to the class');

    const allChapters = wrapper.findAll('thead th').map(cell => cell.text());
    await wrapper.find('#teacher-chapter').setValue('22');
    const chapter22 = wrapper.findAll('thead th').map(cell => cell.text());

    expect(allChapters.slice(0, 4)).toEqual(['Student', 'Caught', 'Ch. 21', 'Ch. 22']);
    expect(chapter22.slice(0, 3)).toEqual(['Student', 'Caught', 'A dated past event']);
  });

  it('keeps the class in the teacher’s browser', async () => {
    window.location.hash = '#teacher';
    const first = mountApp(deps());
    await fillIn(first, '#teacher-codes', await codeFor('Léa', { q1: 3 }));
    await clickButton(first, 'Add to the class');
    first.unmount();

    const second = mountApp(deps());

    expect(second.find('tbody').text()).toContain('Léa');
  });

  it('reads a class list saved before badges existed', () => {
    window.location.hash = '#teacher';
    storage.items.set(TEACHER_KEY, JSON.stringify([{ nickname: 'Léa', sharedAt: NOW, boxes: { q1: 3 }, seen: [], caught: {} }]));

    const wrapper = mountApp(deps());

    expect(wrapper.find('tbody').text()).toContain('Léa');
  });

  it('lists the codes it could not read', async () => {
    window.location.hash = '#teacher';
    const code = await codeFor('Léa', { q1: 3 });
    const wrapper = mountApp(deps());
    await fillIn(wrapper, '#teacher-codes', code.slice(0, -3));

    await clickButton(wrapper, 'Add to the class');

    expect(wrapper.text()).toContain(`1 code has a typo or is incomplete: ${code.slice(0, 16)}…`);
  });

  it('removes a student from the class', async () => {
    window.location.hash = '#teacher';
    const wrapper = mountApp(deps());
    await fillIn(wrapper, '#teacher-codes', await codeFor('Léa', { q1: 3 }));
    await clickButton(wrapper, 'Add to the class');

    await clickButton(wrapper, 'Remove');

    expect(wrapper.find('tbody').exists()).toBe(false);
  });
});
