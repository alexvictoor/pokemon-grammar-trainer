import { describe, expect, it } from 'vitest';
import { emptyGame, loadGame, saveGame, SAVE_KEY, type GameState } from './save';

const aGame = (): GameState => ({
  version: 1,
  cards: { 'ch21-result-001': { box: 2, dueAt: 1_800_000_000_000 } },
  seen: [25, 133],
  caught: { 25: 2 },
  streak: 3,
});

const memoryStorage = (initial: Record<string, string> = {}) => {
  const items = new Map(Object.entries(initial));
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
};

const brokenStorage = {
  getItem: (): string | null => {
    throw new DOMException('Access denied', 'SecurityError');
  },
  setItem: (): void => {
    throw new DOMException('Quota exceeded', 'QuotaExceededError');
  },
};

describe('loadGame', () => {
  it('returns a new game when nothing was saved', () => {
    const loaded = loadGame(memoryStorage());

    expect(loaded).toEqual({ status: 'new', game: emptyGame() });
  });

  it('returns the saved game', () => {
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify(aGame()) });

    const loaded = loadGame(storage);

    expect(loaded).toEqual({ status: 'loaded', game: aGame() });
  });

  it('returns a game saved with badges', () => {
    const withBadge = { ...aGame(), badges: ['cascade'] };
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify(withBadge) });

    const loaded = loadGame(storage);

    expect(loaded).toEqual({ status: 'loaded', game: withBadge });
  });

  it('returns a game saved with a nickname', () => {
    const named = { ...aGame(), nickname: 'Léa' };
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify(named) });

    const loaded = loadGame(storage);

    expect(loaded).toEqual({ status: 'loaded', game: named });
  });

  it('returns a new game, marked corrupt, when the save does not match the format', () => {
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify({ version: 1, cards: 'oops' }) });

    const loaded = loadGame(storage);

    expect(loaded).toEqual({ status: 'corrupt', game: emptyGame() });
  });

  it('returns a new game, marked corrupt, when the save is not JSON', () => {
    const storage = memoryStorage({ [SAVE_KEY]: '{not json' });

    const loaded = loadGame(storage);

    expect(loaded).toEqual({ status: 'corrupt', game: emptyGame() });
  });

  it('returns a new game, marked unavailable, when storage throws', () => {
    const loaded = loadGame(brokenStorage);

    expect(loaded).toEqual({ status: 'unavailable', game: emptyGame() });
  });
});

describe('saveGame', () => {
  it('writes a game that loadGame reads back', () => {
    const storage = memoryStorage();

    const saved = saveGame(storage, aGame());

    expect(saved).toBe(true);
    expect(loadGame(storage)).toEqual({ status: 'loaded', game: aGame() });
  });

  it('returns false when storage throws', () => {
    const saved = saveGame(brokenStorage, aGame());

    expect(saved).toBe(false);
  });
});
