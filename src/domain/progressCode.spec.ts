import { describe, expect, it } from 'vitest';
import { decodeProgress, encodeProgress, findCodes, restoreGame, type Progress } from './progressCode';
import type { GameState } from './save';

const NOW = 1_800_000_000_000;

const game: GameState = {
  version: 1,
  nickname: 'Léa',
  cards: { 'ch21-since-for-002': { box: 3, dueAt: NOW + 5 }, 'ch21-form-001': { box: 1, dueAt: NOW } },
  seen: [25, 133],
  caught: { 25: 2 },
  streak: 4,
};

const progress: Progress = {
  nickname: 'Léa',
  sharedAt: NOW,
  boxes: { 'ch21-since-for-002': 3, 'ch21-form-001': 1 },
  seen: [25, 133],
  caught: { 25: 2 },
  badges: [],
};

const flipCharacterAt = (code: string, index: number): string => code.slice(0, index) + (code[index] === 'A' ? 'B' : 'A') + code.slice(index + 1);

describe('encodeProgress / decodeProgress', () => {
  it('reads back what was shared', async () => {
    const code = await encodeProgress(game, 'Léa', NOW);

    const decoded = await decodeProgress(code);

    expect(decoded).toEqual({ ok: true, progress });
  });

  it('reads back the badges earned', async () => {
    const decoded = await decodeProgress(await encodeProgress({ ...game, badges: ['cascade'] }, 'Léa', NOW));

    expect(decoded).toEqual({ ok: true, progress: { ...progress, badges: ['cascade'] } });
  });

  it('reads back the progress of a full game of 900 questions', async () => {
    const boxes = Object.fromEntries(Array.from({ length: 900 }, (_, index) => [`ch${15 + (index % 19)}-rule-${String(index).padStart(3, '0')}`, 1 + (index % 5)]));
    const bigGame = { ...game, cards: Object.fromEntries(Object.entries(boxes).map(([id, box]) => [id, { box, dueAt: NOW }])) };

    const decoded = await decodeProgress(await encodeProgress(bigGame, 'Léa', NOW));

    expect(decoded).toEqual({ ok: true, progress: { ...progress, boxes } });
  });

  it('writes a code made of URL-safe characters after a GT1 prefix', async () => {
    const code = await encodeProgress(game, 'Léa', NOW);

    expect(code).toMatch(/^GT1-[0-9a-f]{8}-[A-Za-z0-9_-]+$/);
  });

  it('reads a code split by line breaks and spaces, as messages often do', async () => {
    const code = await encodeProgress(game, 'Léa', NOW);
    const pasted = `  ${code.slice(0, 20)}\n${code.slice(20, 40)} ${code.slice(40)}\n`;

    const decoded = await decodeProgress(pasted);

    expect(decoded).toEqual({ ok: true, progress });
  });

  it('reports a typo when a character was changed', async () => {
    const code = await encodeProgress(game, 'Léa', NOW);

    const decoded = await decodeProgress(flipCharacterAt(code, code.length - 3));

    expect(decoded).toEqual({ ok: false, error: 'typo' });
  });

  it('reports a typo when the end of the code is missing', async () => {
    const code = await encodeProgress(game, 'Léa', NOW);

    const decoded = await decodeProgress(code.slice(0, -4));

    expect(decoded).toEqual({ ok: false, error: 'typo' });
  });

  it('reports text that is not a progress code', async () => {
    const decoded = await decodeProgress('Bonjour madame, voici mon code');

    expect(decoded).toEqual({ ok: false, error: 'not-a-code' });
  });

  it('reports a code from a newer version of the game', async () => {
    const code = await encodeProgress(game, 'Léa', NOW);

    const decoded = await decodeProgress(code.replace(/^GT1-/, 'GT2-'));

    expect(decoded).toEqual({ ok: false, error: 'newer-version' });
  });
});

describe('findCodes', () => {
  it('returns each code found in pasted messages, without the text around them', () => {
    const pasted = 'Bonjour madame, voici mon code :\nGT1-0a1b2c3d-AbC_\ndE-f\nMerci !\n\nGT1-11111111-xyz';

    expect(findCodes(pasted)).toEqual(['GT1-0a1b2c3d-AbC_dE-f', 'GT1-11111111-xyz']);
  });

  it('returns nothing when the text holds no code', () => {
    expect(findCodes('Merci madame')).toEqual([]);
  });
});

describe('restoreGame', () => {
  it('rebuilds a game whose questions are all due for review', () => {
    const restored = restoreGame({ ...progress, badges: ['cascade'] }, NOW + 1000);

    expect(restored).toEqual({
      version: 1,
      nickname: 'Léa',
      cards: { 'ch21-since-for-002': { box: 3, dueAt: NOW + 1000 }, 'ch21-form-001': { box: 1, dueAt: NOW + 1000 } },
      seen: [25, 133],
      caught: { 25: 2 },
      badges: ['cascade'],
      streak: 0,
    });
  });
});
