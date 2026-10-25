import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createPinia } from 'pinia';
import type { Gym } from '../domain/gym';
import type { PokemonEntry, TypeChart } from '../domain/pokemon';
import type { SaveStorage } from '../domain/save';
import { aQuestion, aReorderQuestion, aTypedQuestion } from '../domain/testing';
import App from './App.vue';
import { GAME_DEPS, type GameDeps } from './deps';

export const NOW = 1_800_000_000_000;

export const pikachu: PokemonEntry = {
  id: 25,
  name: 'Pikachu',
  nameFr: 'Pikachu',
  types: ['electric'],
  heightCm: 40,
  weightKg: 6,
  rarity: 'common',
  legendary: false,
  flavor: 'It stores electricity in its cheeks.',
  stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50 },
  sprite: 'data:image/png;base64,AAAA',
};
export const mimikyu: PokemonEntry = { ...pikachu, id: 778, name: 'Mimikyu', nameFr: 'Mimiqui', types: ['ghost', 'fairy'], rarity: 'rare' };
export const magikarp: PokemonEntry = {
  ...pikachu,
  id: 129,
  name: 'Magikarp',
  nameFr: 'Magicarpe',
  types: ['water'],
  stats: { hp: 1, attack: 10, defense: 10, specialAttack: 10, specialDefense: 10 },
};
export const gyarados: PokemonEntry = {
  ...pikachu,
  id: 130,
  name: 'Gyarados',
  nameFr: 'Léviator',
  types: ['water', 'flying'],
  stats: { hp: 95, attack: 125, defense: 79, specialAttack: 60, specialDefense: 100 },
};

export const questions = [
  aQuestion({ id: 'q1', prompt: 'Ash ___ Pikachu for years.', answers: ['has known'], distractors: ['knows', 'is knowing'], explanation: 'Depuis + durée : present perfect.' }),
  aQuestion({ id: 'q2', prompt: 'Brock has been a leader ___ 2019.', answers: ['since'], distractors: ['for', 'during'], explanation: 'Since + point de départ.' }),
];
export const gymQuestions = [
  aTypedQuestion({ id: 't1', prompt: 'Ash ___ (know) Pikachu for a long time.', answers: ['has known'], explanation: 'Depuis + durée : present perfect.' }),
  aReorderQuestion({ id: 'r1' }),
];
export const rules = [{ id: 'present-perfect.result', chapter: 21, label: 'A past action with a result now' }];

export const testGym: Gym = { id: 'cascade', leader: 'Misty', city: 'Cerulean City', badge: 'Cascade Badge', chapters: [21], team: [129], unlockAt: 70, types: ['electric'], reward: 130 };
export const typeChart: TypeChart = { electric: { water: 2, flying: 2, ground: 0 }, water: { fire: 2, water: 0.5 }, normal: {} };

export const memoryStorage = (): SaveStorage & { items: Map<string, string> } => {
  const items = new Map<string, string>();
  return { items, getItem: key => items.get(key) ?? null, setItem: (key, value) => void items.set(key, value) };
};

export const blockedStorage: SaveStorage = {
  getItem: () => {
    throw new DOMException('denied', 'SecurityError');
  },
  setItem: () => {
    throw new DOMException('denied', 'SecurityError');
  },
};

export const mountApp = (deps: GameDeps): VueWrapper =>
  mount(App, { global: { plugins: [createPinia()], provide: { [GAME_DEPS as symbol]: deps } }, attachTo: document.body });

// The progress codec compresses through streams, which settle over several event-loop turns.
const settle = async (): Promise<void> => {
  for (let turn = 0; turn < 10; turn++) {
    await flushPromises();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
};

export const clickButton = async (wrapper: VueWrapper, label: string): Promise<void> => {
  const button = wrapper.findAll('button').find(candidate => candidate.text().includes(label));
  if (!button) throw new Error(`No button "${label}" in:\n${wrapper.text()}`);
  await button.trigger('click');
  await settle();
};

export const fillIn = async (wrapper: VueWrapper, selector: string, value: string): Promise<void> => {
  await wrapper.find(selector).setValue(value);
  await flushPromises();
};
