import { rarityOf } from '../src/domain/encounter';
import type { PokemonEntry, TypeChart } from '../src/domain/pokemon';

interface Named {
  language: { name: string };
}

export interface ApiPokemon {
  id: number;
  height: number;
  weight: number;
  types: { slot: number; type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
}

export interface ApiType {
  name: string;
  damage_relations: Record<'double_damage_to' | 'half_damage_to' | 'no_damage_to', { name: string }[]>;
}

const MULTIPLIERS = { double_damage_to: 2, half_damage_to: 0.5, no_damage_to: 0 } as const;

export const toTypeChart = (types: ApiType[]): TypeChart =>
  Object.fromEntries(
    types.map(type => [
      type.name,
      Object.fromEntries(
        (Object.keys(MULTIPLIERS) as (keyof typeof MULTIPLIERS)[]).flatMap(relation =>
          type.damage_relations[relation].map(target => [target.name, MULTIPLIERS[relation]]),
        ),
      ),
    ]),
  );

const statOf = (pokemon: ApiPokemon, name: string): number => pokemon.stats.find(entry => entry.stat.name === name)?.base_stat ?? 0;

export interface ApiSpecies {
  capture_rate: number;
  is_legendary: boolean;
  is_mythical: boolean;
  names: (Named & { name: string })[];
  flavor_text_entries: (Named & { flavor_text: string })[];
}

const inLanguage = <T extends Named>(entries: T[], language: string): T[] => entries.filter(entry => entry.language.name === language);

export const toSnapshotEntry = (pokemon: ApiPokemon, species: ApiSpecies, sprite: string | undefined): PokemonEntry => {
  const name = inLanguage(species.names, 'en')[0]?.name ?? String(pokemon.id);
  const flavor = inLanguage(species.flavor_text_entries, 'en').at(-1)?.flavor_text ?? '';
  return {
    id: pokemon.id,
    name,
    nameFr: inLanguage(species.names, 'fr')[0]?.name ?? name,
    types: [...pokemon.types].sort((a, b) => a.slot - b.slot).map(entry => entry.type.name),
    heightCm: pokemon.height * 10,
    weightKg: pokemon.weight / 10,
    rarity: rarityOf(species.capture_rate),
    legendary: species.is_legendary || species.is_mythical,
    flavor: flavor.replace(/\s+/g, ' ').trim(),
    stats: {
      hp: statOf(pokemon, 'hp'),
      attack: statOf(pokemon, 'attack'),
      defense: statOf(pokemon, 'defense'),
      specialAttack: statOf(pokemon, 'special-attack'),
      specialDefense: statOf(pokemon, 'special-defense'),
    },
    sprite,
  };
};
