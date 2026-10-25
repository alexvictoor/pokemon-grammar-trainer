import { beforeEach, describe, expect, it } from 'vitest';
import type { Gym } from '../domain/gym';
import { emptyGame, SAVE_KEY, type GameState } from '../domain/save';
import type { GameDeps } from './deps';
import { clickButton, fillIn, gymQuestions, magikarp, memoryStorage, mimikyu, mountApp, NOW, pikachu, questions, rules, testGym, typeChart } from './testing';

let storage: ReturnType<typeof memoryStorage>;
let rolls: number[];

const nextGym: Gym = { ...testGym, id: 'thunder', leader: 'Lt. Surge', city: 'Vermilion City', badge: 'Thunder Badge', chapters: [19, 20] };

const deps = (overrides: Partial<GameDeps> = {}): GameDeps => ({
  storage,
  random: () => rolls.shift() ?? 0,
  now: () => NOW,
  questions: [...questions, ...gymQuestions],
  rules,
  pokemon: [pikachu, mimikyu, magikarp],
  gyms: [testGym, nextGym],
  typeChart,
  ...overrides,
});

const saveGame = (game: Partial<GameState>) => storage.items.set(SAVE_KEY, JSON.stringify({ ...emptyGame(), ...game }));

const startEncounter = async (overrides: Partial<GameDeps> = {}) => {
  const wrapper = mountApp(deps(overrides));
  await clickButton(wrapper, 'Route 21');
  await clickButton(wrapper, 'Walk in the tall grass');
  return wrapper;
};

beforeEach(() => {
  storage = memoryStorage();
  rolls = [];
  document.body.innerHTML = '';
  window.location.hash = '';
});

describe('encounter animations', () => {
  it('plays the capture when the throw succeeds', async () => {
    rolls = [0, 0, 0, 0, 0, 0];
    const wrapper = await startEncounter();

    await clickButton(wrapper, 'has known');

    expect(wrapper.find('.scene').classes()).toContain('capture-caught');
    expect(wrapper.find('.capture-ball').classes()).toContain('poke');
    expect(wrapper.find('.burst').exists()).toBe(true);
  });

  it('throws a Great Ball once the streak reaches 3', async () => {
    saveGame({ streak: 2 });
    rolls = [0, 0, 0, 0, 0, 0];
    const wrapper = await startEncounter();

    await clickButton(wrapper, 'has known');

    expect(wrapper.find('.capture-ball').classes()).toContain('great');
  });

  it('plays the escape when the Pokémon breaks free', async () => {
    rolls = [0, 0, 0, 0, 0, 0.99];
    const wrapper = await startEncounter();

    await clickButton(wrapper, 'has known');

    expect(wrapper.find('.scene').classes()).toContain('capture-escaped');
    expect(wrapper.find('.burst').exists()).toBe(false);
  });

  it('shakes the question and makes the Pokémon taunt on a wrong answer', async () => {
    rolls = [0, 0, 0, 0, 0, 0.99];
    const wrapper = await startEncounter();

    await clickButton(wrapper, 'knows');

    expect(wrapper.find('.question').classes()).toContain('shake');
    expect(wrapper.find('.scene').classes()).toContain('capture-missed');
    expect(wrapper.find('.capture-ball').exists()).toBe(false);
  });

  it('makes the Pokémon run away when it flees', async () => {
    rolls = [0, 0, 0, 0, 0, 0];
    const wrapper = await startEncounter({ pokemon: [mimikyu] });

    await clickButton(wrapper, 'knows');

    expect(wrapper.find('.scene').classes()).toContain('capture-fled');
  });
});

describe('route animations', () => {
  it('announces a new chapter on a route never practised', async () => {
    const wrapper = mountApp(deps());

    await clickButton(wrapper, 'Route 21');

    expect(wrapper.find('.location-sign').text()).toContain('Route 21');
    expect(wrapper.find('.new-chapter').text()).toBe('New chapter!');
  });

  it('drops the new chapter label once the route was practised', async () => {
    saveGame({ cards: { q1: { box: 2, dueAt: NOW } } });
    const wrapper = mountApp(deps());

    await clickButton(wrapper, 'Route 21');

    expect(wrapper.find('.new-chapter').exists()).toBe(false);
  });
});

describe('gym animations', () => {
  const masteredRoute: Partial<GameState> = { cards: { q1: { box: 3, dueAt: NOW + 1 }, q2: { box: 3, dueAt: NOW + 1 } }, seen: [25], caught: { 25: 1 } };

  const enterBattle = async () => {
    saveGame(masteredRoute);
    const wrapper = mountApp(deps({ questions: [...questions, gymQuestions[0]!] }));
    await clickButton(wrapper, 'Challenge Misty');
    await clickButton(wrapper, 'Pikachu');
    await clickButton(wrapper, 'Start the battle');
    await clickButton(wrapper, 'Thunderbolt');
    return wrapper;
  };

  it('makes the leader’s Pokémon take the hit on a correct answer', async () => {
    const wrapper = await enterBattle();
    await fillIn(wrapper, '#typed-answer', 'has known');

    await clickButton(wrapper, 'Attack');

    expect(wrapper.find('.fighter.leader').classes()).toContain('hit');
    expect(wrapper.find('.fighter.player').classes()).toContain('lunge');
  });

  it('makes the player’s Pokémon take the hit on a wrong answer', async () => {
    const wrapper = await enterBattle();
    await fillIn(wrapper, '#typed-answer', 'knows');

    await clickButton(wrapper, 'Attack');

    expect(wrapper.find('.fighter.player').classes()).toContain('hit');
    expect(wrapper.find('.fighter.leader').classes()).toContain('lunge');
  });

  it('reveals the badge and announces the next area after a win', async () => {
    const wrapper = await enterBattle();
    await fillIn(wrapper, '#typed-answer', 'has known');
    await clickButton(wrapper, 'Attack');

    await clickButton(wrapper, 'Continue');

    expect(wrapper.find('.badge-reveal').exists()).toBe(true);
    expect(wrapper.find('.unlock-banner').text()).toBe('New area open: Vermilion City · Routes 19 and 20!');
  });
});
