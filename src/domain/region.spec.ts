import { describe, expect, it } from 'vitest';
import type { Gym } from './gym';
import { encounterTable, gymOfChapter, isGymOpen, openChapters, routesLabel } from './region';

const gym = (id: string, chapters: number[], types: string[]): Gym => ({
  id,
  leader: id,
  city: id,
  badge: `${id} badge`,
  chapters,
  team: [],
  unlockAt: 70,
  types,
  reward: 0,
});

const gyms = [gym('boulder', [15, 16], ['rock']), gym('cascade', [17, 18], ['water']), gym('thunder', [19], ['electric'])];

describe('isGymOpen', () => {
  it('opens the first gym from the start', () => {
    expect(isGymOpen(gyms, 0, [])).toBe(true);
  });

  it('opens a gym once the previous badge is earned', () => {
    expect(isGymOpen(gyms, 1, ['boulder'])).toBe(true);
  });

  it('keeps a gym closed while the previous badge is missing', () => {
    expect(isGymOpen(gyms, 2, ['boulder'])).toBe(false);
  });
});

describe('openChapters', () => {
  it('returns the chapters of every open gym', () => {
    expect(openChapters(gyms, ['boulder'])).toEqual([15, 16, 17, 18]);
  });
});

describe('routesLabel', () => {
  it.each([
    { chapters: [21], label: 'Route 21' },
    { chapters: [19, 20], label: 'Routes 19 and 20' },
    { chapters: [26, 27, 28, 29, 30], label: 'Routes 26 to 30' },
  ])('names the routes of chapters $chapters', ({ chapters, label }) => {
    expect(routesLabel(chapters)).toBe(label);
  });
});

describe('gymOfChapter', () => {
  it('returns the gym that tests a chapter', () => {
    expect(gymOfChapter(gyms, 18)?.id).toBe('cascade');
  });
});

describe('encounterTable', () => {
  const pokemon = [
    { id: 74, types: ['rock', 'ground'], rarity: 'common' as const },
    { id: 95, types: ['rock', 'ground'], rarity: 'uncommon' as const },
    { id: 111, types: ['ground', 'rock'], rarity: 'uncommon' as const },
    { id: 138, types: ['rock', 'water'], rarity: 'rare' as const },
    { id: 7, types: ['water'], rarity: 'rare' as const },
  ];

  it('splits the Pokémon of the gym’s types between its routes', () => {
    const first = encounterTable(pokemon, gyms, 15);
    const second = encounterTable(pokemon, gyms, 16);

    expect(first.map(entry => entry.id)).toEqual([74, 111]);
    expect(second.map(entry => entry.id)).toEqual([95, 138]);
  });

  it('keeps the rarity of each Pokémon', () => {
    expect(encounterTable(pokemon, gyms, 16)).toEqual([
      { id: 95, rarity: 'uncommon' },
      { id: 138, rarity: 'rare' },
    ]);
  });

  it('keeps legendary Pokémon out of the wild', () => {
    const withLegendary = [...pokemon, { id: 377, types: ['rock'], rarity: 'rare' as const, legendary: true }];

    const ids = [...encounterTable(withLegendary, gyms, 15), ...encounterTable(withLegendary, gyms, 16)].map(entry => entry.id);

    expect(ids).not.toContain(377);
  });

  it('falls back to every Pokémon when no type matches', () => {
    const table = encounterTable(pokemon, gyms, 19);

    expect(table).toHaveLength(5);
  });
});
