import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { GameDeps } from './deps';
import { clickButton, memoryStorage, mountApp, NOW, pikachu, questions, rules, testGym, typeChart } from './testing';

let fullscreenRequests: number;

const deps = (): GameDeps => ({
  storage: memoryStorage(),
  random: () => 0,
  now: () => NOW,
  questions,
  rules,
  pokemon: [pikachu],
  gyms: [testGym],
  typeChart,
  enterFullscreen: () => {
    fullscreenRequests++;
  },
});

beforeEach(() => {
  fullscreenRequests = 0;
  document.body.innerHTML = '';
  window.location.hash = '';
});

afterEach(() => {
  window.location.hash = '';
});

describe('the intro', () => {
  it('opens on the intro with the title and a start prompt', () => {
    const wrapper = mountApp(deps());

    expect(wrapper.find('.intro').exists()).toBe(true);
    expect(wrapper.find('.intro').text()).toContain('Grammar Trainer');
    expect(wrapper.find('.intro').text()).toContain('Tap to start');
  });

  it('closes on a tap and asks for full screen', async () => {
    const wrapper = mountApp(deps());

    await clickButton(wrapper, 'Tap to start');

    expect(wrapper.find('.intro').exists()).toBe(false);
    expect(fullscreenRequests).toBe(1);
  });

  it('is skipped on the teacher page', () => {
    window.location.hash = '#teacher';

    const wrapper = mountApp(deps());

    expect(wrapper.find('.intro').exists()).toBe(false);
  });
});
