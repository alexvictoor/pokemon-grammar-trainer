import { beforeEach, describe, expect, it } from 'vitest';
import type { Gym } from '../domain/gym';
import { emptyGame, SAVE_KEY } from '../domain/save';
import { aQuestion } from '../domain/testing';
import type { GameDeps } from './deps';
import { clickButton, memoryStorage, mountApp, NOW, pikachu, questions, rules, testGym, typeChart } from './testing';

let storage: ReturnType<typeof memoryStorage>;

const secondGym: Gym = { ...testGym, id: 'rainbow', leader: 'Erika', city: 'Celadon City', badge: 'Rainbow Badge', chapters: [22] };
const chapter22 = aQuestion({ id: 'q22', chapter: 22, rule: 'past-or-pp.dated-past', prompt: 'I ___ Misty yesterday.', answers: ['saw'], distractors: ['have seen', 'see'] });

const deps = (): GameDeps => ({
  storage,
  random: () => 0,
  now: () => NOW,
  questions: [...questions, chapter22],
  rules: [...rules, { id: 'past-or-pp.dated-past', chapter: 22, label: 'A dated past event' }],
  pokemon: [pikachu],
  gyms: [testGym, secondGym],
  typeChart,
});

beforeEach(() => {
  storage = memoryStorage();
  document.body.innerHTML = '';
  window.location.hash = '';
});

describe('the map', () => {
  it('keeps the next gym’s routes closed until the previous badge is earned', () => {
    const wrapper = mountApp(deps());

    expect(wrapper.text()).toContain('Earn the Cascade Badge to open Route 22 and the Celadon City Gym.');
    expect(wrapper.find('#route-22').exists()).toBe(false);
  });

  it('opens the next gym’s routes once the badge is earned', () => {
    storage.items.set(SAVE_KEY, JSON.stringify({ ...emptyGame(), badges: ['cascade'] }));

    const wrapper = mountApp(deps());

    expect(wrapper.find('#route-22').text()).toContain('Simple past or present perfect');
  });

  it('shows only the rules of the chosen route', async () => {
    storage.items.set(SAVE_KEY, JSON.stringify({ ...emptyGame(), badges: ['cascade'] }));
    const wrapper = mountApp(deps());

    await clickButton(wrapper, 'Route 22');

    expect(wrapper.findAll('.rule-label').map(label => label.text())).toEqual(['A dated past event']);
  });

  it('asks only the questions of the chosen route', async () => {
    storage.items.set(SAVE_KEY, JSON.stringify({ ...emptyGame(), badges: ['cascade'] }));
    const wrapper = mountApp(deps());
    await clickButton(wrapper, 'Route 22');

    await clickButton(wrapper, 'Walk in the tall grass');

    expect(wrapper.text()).toContain('I ___ Misty yesterday.');
  });
});
