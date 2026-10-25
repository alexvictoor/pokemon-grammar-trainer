import { type } from 'arktype';

export const SAVE_KEY = 'grammar-trainer.save';

const gameStateSchema = type({
  version: '1',
  'nickname?': type('string.trim').to('1 <= string <= 30'),
  cards: { '[string]': { box: '1 <= number.integer <= 5', dueAt: 'number' } },
  seen: 'number.integer[]',
  caught: { '[string]': 'number.integer >= 1' },
  'badges?': 'string[]',
  streak: 'number.integer >= 0',
});

export type GameState = typeof gameStateSchema.infer;

export interface SaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type LoadStatus = 'new' | 'loaded' | 'corrupt' | 'unavailable';

export const emptyGame = (): GameState => ({ version: 1, cards: {}, seen: [], caught: {}, streak: 0 });

const parseGame = (text: string): GameState | undefined => {
  try {
    const parsed = gameStateSchema(JSON.parse(text));
    return parsed instanceof type.errors ? undefined : parsed;
  } catch {
    return undefined;
  }
};

export const loadGame = (storage: SaveStorage): { status: LoadStatus; game: GameState } => {
  let text: string | null;
  try {
    text = storage.getItem(SAVE_KEY);
  } catch {
    return { status: 'unavailable', game: emptyGame() };
  }
  if (text === null) return { status: 'new', game: emptyGame() };
  const game = parseGame(text);
  return game ? { status: 'loaded', game } : { status: 'corrupt', game: emptyGame() };
};

export const saveGame = (storage: SaveStorage, game: GameState): boolean => {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(game));
    return true;
  } catch {
    return false;
  }
};
