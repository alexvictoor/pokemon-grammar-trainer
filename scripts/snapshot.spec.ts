import { describe, expect, it } from 'vitest';
import { toSnapshotEntry, toTypeChart, type ApiPokemon, type ApiSpecies } from './snapshot';

const pokemon: ApiPokemon = {
  id: 25,
  height: 4,
  weight: 60,
  types: [
    { slot: 1, type: { name: 'electric' } },
  ],
  stats: [
    { base_stat: 35, stat: { name: 'hp' } },
    { base_stat: 55, stat: { name: 'attack' } },
    { base_stat: 40, stat: { name: 'defense' } },
    { base_stat: 50, stat: { name: 'special-attack' } },
    { base_stat: 50, stat: { name: 'special-defense' } },
    { base_stat: 90, stat: { name: 'speed' } },
  ],
};

const species: ApiSpecies = {
  capture_rate: 190,
  is_legendary: false,
  is_mythical: false,
  names: [
    { name: 'Pikachu', language: { name: 'en' } },
    { name: 'Pikachu', language: { name: 'fr' } },
    { name: 'ピカチュウ', language: { name: 'ja' } },
  ],
  flavor_text_entries: [
    { flavor_text: 'Old\fentry.', language: { name: 'en' } },
    { flavor_text: 'Entrée française.', language: { name: 'fr' } },
    { flavor_text: 'When several of\nthese POKéMON gather,\ftheir electricity could\nbuild and cause lightning storms.', language: { name: 'en' } },
  ],
};

describe('toSnapshotEntry', () => {
  it('keeps the names, types, size, rarity, latest English Pokédex entry and sprite', () => {
    const entry = toSnapshotEntry(pokemon, species, 'data:image/png;base64,AAAA');

    expect(entry).toEqual({
      id: 25,
      name: 'Pikachu',
      nameFr: 'Pikachu',
      types: ['electric'],
      heightCm: 40,
      weightKg: 6,
      rarity: 'common',
      legendary: false,
      flavor: 'When several of these POKéMON gather, their electricity could build and cause lightning storms.',
      stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50 },
      sprite: 'data:image/png;base64,AAAA',
    });
  });

  it('orders the types by slot', () => {
    const dual = { ...pokemon, types: [{ slot: 2, type: { name: 'flying' } }, { slot: 1, type: { name: 'normal' } }] };

    const entry = toSnapshotEntry(dual, species, undefined);

    expect(entry.types).toEqual(['normal', 'flying']);
  });

  it.each([
    { flags: { is_legendary: true, is_mythical: false }, legendary: true },
    { flags: { is_legendary: false, is_mythical: true }, legendary: true },
    { flags: { is_legendary: false, is_mythical: false }, legendary: false },
  ])('marks a legendary or mythical Pokémon: $flags', ({ flags, legendary }) => {
    const entry = toSnapshotEntry(pokemon, { ...species, ...flags }, undefined);

    expect(entry.legendary).toBe(legendary);
  });

  it('leaves the sprite out when PokéAPI has none', () => {
    const entry = toSnapshotEntry(pokemon, species, undefined);

    expect(entry.sprite).toBeUndefined();
  });
});

describe('toTypeChart', () => {
  it('keeps only the multipliers that differ from 1', () => {
    const chart = toTypeChart([
      {
        name: 'electric',
        damage_relations: {
          double_damage_to: [{ name: 'water' }, { name: 'flying' }],
          half_damage_to: [{ name: 'grass' }],
          no_damage_to: [{ name: 'ground' }],
        },
      },
      { name: 'normal', damage_relations: { double_damage_to: [], half_damage_to: [], no_damage_to: [] } },
    ]);

    expect(chart).toEqual({ electric: { water: 2, flying: 2, grass: 0.5, ground: 0 }, normal: {} });
  });
});
