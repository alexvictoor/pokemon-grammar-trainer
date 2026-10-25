import { beforeEach, describe, expect, it } from 'vitest';
import { emptyGame, SAVE_KEY } from '../domain/save';
import type { GameDeps } from './deps';
import { blockedStorage, clickButton, memoryStorage, mimikyu, mountApp as mountWith, NOW, pikachu, questions, rules, testGym } from './testing';

let storage: ReturnType<typeof memoryStorage>;
let rolls: number[];

const deps = (overrides: Partial<GameDeps> = {}): GameDeps => ({
  storage,
  random: () => rolls.shift() ?? 0,
  now: () => NOW,
  questions,
  rules,
  pokemon: [pikachu, mimikyu],
  gyms: [testGym],
  typeChart: {},
  ...overrides,
});

const mountApp = (overrides: Partial<GameDeps> = {}) => mountWith(deps(overrides));

beforeEach(() => {
  storage = memoryStorage();
  rolls = [];
  document.body.innerHTML = '';
});

describe('the route screen', () => {
  it('shows the route chapter and the Pokédex count', () => {
    const wrapper = mountApp();

    expect(wrapper.text()).toContain('Present perfect');
    expect(wrapper.text()).toContain('Caught 0 / 2');
  });

  it('warns that progress cannot be saved when storage is unavailable', () => {
    const wrapper = mountApp({ storage: blockedStorage });

    expect(wrapper.find('[role="alert"]').text()).toContain('This browser cannot save your progress');
  });
});

describe('an encounter', () => {
  it('shows the wild Pokémon and the question', async () => {
    rolls = [0, 0, 0, 0, 0];
    const wrapper = mountApp();

    await clickButton(wrapper, 'Route 21');

    await clickButton(wrapper, 'Walk in the tall grass');

    expect(wrapper.text()).toContain('A wild Pikachu appeared!');
    expect(wrapper.text()).toContain('Ash ___ Pikachu for years.');
    expect(wrapper.findAll('.option').map(option => option.text()).sort()).toEqual(['has known', 'is knowing', 'knows']);
  });

  it('catches the Pokémon and saves the game on a correct answer', async () => {
    rolls = [0, 0, 0, 0, 0, 0];
    const wrapper = mountApp();
    await clickButton(wrapper, 'Route 21');
    await clickButton(wrapper, 'Walk in the tall grass');

    await clickButton(wrapper, 'has known');

    expect(wrapper.text()).toContain('Gotcha! Pikachu was caught!');
    const saved = JSON.parse(storage.items.get(SAVE_KEY) ?? '{}');
    expect(saved.caught).toEqual({ 25: 1 });
  });

  it('shows the right answer and the French explanation on a wrong answer', async () => {
    rolls = [0, 0, 0, 0, 0, 0.99];
    const wrapper = mountApp();
    await clickButton(wrapper, 'Route 21');
    await clickButton(wrapper, 'Walk in the tall grass');

    await clickButton(wrapper, 'knows');

    expect(wrapper.text()).toContain('The answer was “has known”.');
    expect(wrapper.find('[lang="fr"]').text()).toBe('Depuis + durée : present perfect.');
  });

  it('marks one throw as used once a question is answered', async () => {
    rolls = [0, 0, 0, 0, 0, 0.99];
    const wrapper = mountApp();
    await clickButton(wrapper, 'Route 21');
    await clickButton(wrapper, 'Walk in the tall grass');

    await clickButton(wrapper, 'knows');

    expect(wrapper.findAll('.dot.used')).toHaveLength(1);
  });

  it('asks the next question after a miss', async () => {
    rolls = [0, 0, 0, 0, 0, 0.99];
    const wrapper = mountApp();
    await clickButton(wrapper, 'Route 21');
    await clickButton(wrapper, 'Walk in the tall grass');
    await clickButton(wrapper, 'knows');

    await clickButton(wrapper, 'Next question');

    expect(wrapper.text()).toContain('Brock has been a leader ___ 2019.');
  });

  it('asks another question in the next encounter after a miss made the Pokémon flee', async () => {
    rolls = [0, 0, 0, 0, 0, 0];
    const wrapper = mountApp({ pokemon: [mimikyu] });
    await clickButton(wrapper, 'Route 21');
    await clickButton(wrapper, 'Walk in the tall grass');
    await clickButton(wrapper, 'knows');

    await clickButton(wrapper, 'Walk in the tall grass');

    expect(wrapper.text()).toContain('Brock has been a leader ___ 2019.');
  });

  it('returns to the route after the encounter ends', async () => {
    rolls = [0, 0, 0, 0, 0, 0];
    const wrapper = mountApp();
    await clickButton(wrapper, 'Route 21');
    await clickButton(wrapper, 'Walk in the tall grass');
    await clickButton(wrapper, 'has known');

    await clickButton(wrapper, 'Back to the route');

    expect(wrapper.text()).toContain('Caught 1 / 2');
  });
});

describe('the Pokédex', () => {
  it('shows a caught Pokémon with its French name and Pokédex entry', async () => {
    storage.items.set(SAVE_KEY, JSON.stringify({ ...emptyGame(), seen: [25], caught: { 25: 1 } }));
    const wrapper = mountApp();
    await clickButton(wrapper, 'Pokédex');

    await clickButton(wrapper, 'Pikachu');

    expect(wrapper.text()).toContain('Pikachu');
    expect(wrapper.find('[lang="fr"]').text()).toBe('Pikachu');
    expect(wrapper.text()).toContain('It stores electricity in its cheeks.');
  });

  it('lists only the caught Pokémon, not the ones only seen', async () => {
    storage.items.set(SAVE_KEY, JSON.stringify({ ...emptyGame(), seen: [25, 778], caught: { 25: 1 } }));
    const wrapper = mountApp();

    await clickButton(wrapper, 'Pokédex');

    expect(wrapper.findAll('.dex-slot').map(slot => slot.text())).toEqual([expect.stringContaining('Pikachu')]);
    expect(wrapper.text()).not.toContain('Mimikyu');
  });

  it('invites the student to catch a first Pokémon when none is caught', async () => {
    const wrapper = mountApp();

    await clickButton(wrapper, 'Pokédex');

    expect(wrapper.findAll('.dex-slot')).toHaveLength(0);
    expect(wrapper.text()).toContain('No Pokémon caught yet. Walk in the tall grass on a route to catch your first one!');
  });
});
