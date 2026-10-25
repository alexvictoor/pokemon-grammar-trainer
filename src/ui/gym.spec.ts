import { beforeEach, describe, expect, it } from 'vitest';
import { emptyGame, SAVE_KEY, type GameState } from '../domain/save';
import type { GameDeps } from './deps';
import { clickButton, fillIn, gymQuestions, gyarados, magikarp, memoryStorage, mountApp, NOW, pikachu, questions, rules, testGym, typeChart } from './testing';

let storage: ReturnType<typeof memoryStorage>;

const deps = (overrides: Partial<GameDeps> = {}): GameDeps => ({
  storage,
  random: () => 0,
  now: () => NOW,
  questions: [...questions, ...gymQuestions],
  rules,
  pokemon: [pikachu, magikarp, gyarados],
  gyms: [testGym],
  typeChart,
  ...overrides,
});

const masteredRoute: Partial<GameState> = {
  cards: { q1: { box: 3, dueAt: NOW + 1 }, q2: { box: 3, dueAt: NOW + 1 } },
  seen: [25],
  caught: { 25: 1 },
};

const saveGame = (game: Partial<GameState>) => storage.items.set(SAVE_KEY, JSON.stringify({ ...emptyGame(), ...game }));
const savedGame = (): GameState => JSON.parse(storage.items.get(SAVE_KEY) ?? '{}') as GameState;

const enterBattle = async () => {
  const wrapper = mountApp(deps());
  await clickButton(wrapper, 'Challenge Misty');
  await clickButton(wrapper, 'Pikachu');
  await clickButton(wrapper, 'Start the battle');
  return wrapper;
};

beforeEach(() => {
  storage = memoryStorage();
  document.body.innerHTML = '';
  window.location.hash = '';
});

describe('the gym on the route screen', () => {
  it('stays locked until the route is mastered', () => {
    saveGame({ cards: { q1: { box: 3, dueAt: NOW } } });

    const wrapper = mountApp(deps());

    expect(wrapper.text()).toContain('Reach 70% on Route 21 to challenge Misty. Now: 50%.');
    expect(wrapper.findAll('button').some(button => button.text().includes('Challenge Misty'))).toBe(false);
  });

  it('counts only the route questions towards the unlock', () => {
    saveGame(masteredRoute);

    const wrapper = mountApp(deps());

    expect(wrapper.find('#challenge-cascade').text()).toBe('Challenge Misty');
  });

  it('shows the badge once earned', () => {
    saveGame({ ...masteredRoute, badges: ['cascade'] });

    const wrapper = mountApp(deps());

    expect(wrapper.text()).toContain('Cascade Badge earned');
  });
});

describe('a gym battle', () => {
  beforeEach(() => saveGame(masteredRoute));

  it('lists only the caught Pokémon for the team', async () => {
    const wrapper = mountApp(deps());

    await clickButton(wrapper, 'Challenge Misty');

    expect(wrapper.findAll('.team-choice').map(choice => choice.text())).toEqual(['Pikachu']);
  });

  it('asks a written question for a strong move', async () => {
    const wrapper = await enterBattle();

    await clickButton(wrapper, 'Thunderbolt');

    expect(wrapper.text()).toContain('Ash ___ (know) Pikachu for a long time.');
    expect(wrapper.find('#typed-answer').exists()).toBe(true);
  });

  it('asks a multiple-choice question for the safe move', async () => {
    const wrapper = await enterBattle();

    await clickButton(wrapper, 'Tackle');

    expect(wrapper.findAll('.option').map(option => option.text()).sort()).toEqual(['has known', 'is knowing', 'knows']);
  });

  it('wins the badge when the move knocks out the leader’s last Pokémon', async () => {
    const wrapper = await enterBattle();
    await clickButton(wrapper, 'Thunderbolt');
    await fillIn(wrapper, '#typed-answer', "  Has known ");

    await clickButton(wrapper, 'Attack');

    expect(wrapper.text()).toContain('Pikachu used Thunderbolt!');
    expect(wrapper.text()).toContain("It's super effective!");
    await clickButton(wrapper, 'Continue');
    expect(wrapper.text()).toContain('You received the Cascade Badge!');
    expect(savedGame().badges).toEqual(['cascade']);
    expect(wrapper.find('button.primary').text()).toBe('Back to the route');
    expect(wrapper.findAll('button').some(button => button.text() === 'Try again')).toBe(false);
  });

  it('gives the gym’s reward Pokémon on the first win', async () => {
    const wrapper = await enterBattle();
    await clickButton(wrapper, 'Thunderbolt');
    await fillIn(wrapper, '#typed-answer', 'has known');
    await clickButton(wrapper, 'Attack');

    await clickButton(wrapper, 'Continue');

    expect(wrapper.text()).toContain('Misty gives you Gyarados!');
    expect(savedGame().caught).toEqual({ 25: 1, 130: 1 });
    expect(savedGame().seen).toEqual([25, 130]);
  });

  it('gives no second reward after a rematch', async () => {
    saveGame({ ...masteredRoute, badges: ['cascade'], seen: [25, 130], caught: { 25: 1, 130: 1 } });
    const wrapper = await enterBattle();
    await clickButton(wrapper, 'Thunderbolt');
    await fillIn(wrapper, '#typed-answer', 'has known');
    await clickButton(wrapper, 'Attack');

    await clickButton(wrapper, 'Continue');

    expect(wrapper.text()).not.toContain('gives you');
    expect(wrapper.text()).toContain('You received the Cascade Badge!');
    expect(wrapper.text()).not.toContain('You lose nothing');
    expect(savedGame().caught).toEqual({ 25: 1, 130: 1 });
  });

  it('records the answer in the Leitner boxes', async () => {
    const wrapper = await enterBattle();
    await clickButton(wrapper, 'Thunderbolt');
    await fillIn(wrapper, '#typed-answer', 'has known');

    await clickButton(wrapper, 'Attack');

    expect(savedGame().cards.t1).toEqual({ box: 2, dueAt: NOW + 20 * 60 * 1000 });
  });

  it('lets the leader attack and explains the rule in French on a wrong answer', async () => {
    const wrapper = await enterBattle();
    await clickButton(wrapper, 'Thunderbolt');
    await fillIn(wrapper, '#typed-answer', 'knows');

    await clickButton(wrapper, 'Attack');

    expect(wrapper.text()).toContain('The answer was “has known”.');
    expect(wrapper.find('[lang="fr"]').text()).toBe('Depuis + durée : present perfect.');
    expect(wrapper.text()).toContain("Misty's Magikarp used Surf!");
  });

  it('builds a sentence from the tiles for a word-order question', async () => {
    const wrapper = mountApp(deps({ questions: [...questions, gymQuestions[1]!] }));
    await clickButton(wrapper, 'Challenge Misty');
    await clickButton(wrapper, 'Pikachu');
    await clickButton(wrapper, 'Start the battle');
    await clickButton(wrapper, 'Thunderbolt');

    for (const word of ['I', 'have', 'known', 'Ash', 'for', 'ten', 'years.']) {
      const tile = wrapper.findAll('.tile').find(candidate => candidate.text() === word);
      await tile?.trigger('click');
    }
    await clickButton(wrapper, 'Attack');

    expect(wrapper.text()).toContain('Pikachu used Thunderbolt!');
  });

  it('loses nothing when all the player’s Pokémon faint', async () => {
    const wrapper = mountApp(deps({ gyms: [{ ...testGym, team: [130] }], questions: [...questions, gymQuestions[0]!] }));
    await clickButton(wrapper, 'Challenge Misty');
    await clickButton(wrapper, 'Pikachu');
    await clickButton(wrapper, 'Start the battle');

    for (let turn = 0; turn < 2; turn++) {
      await clickButton(wrapper, 'Thunderbolt');
      await fillIn(wrapper, '#typed-answer', 'knows');
      await clickButton(wrapper, 'Attack');
      await clickButton(wrapper, 'Continue');
    }

    expect(wrapper.text()).toContain('All your Pokémon fainted…');
    expect(wrapper.text()).toContain('You lose nothing.');
    expect(savedGame().badges ?? []).toEqual([]);
    expect(savedGame().caught).toEqual({ 25: 1 });
  });
});
