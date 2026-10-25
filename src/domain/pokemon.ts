import type { Rarity } from './encounter';

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
}

export interface PokemonEntry {
  id: number;
  name: string;
  nameFr: string;
  types: string[];
  heightCm: number;
  weightKg: number;
  rarity: Rarity;
  legendary: boolean;
  flavor: string;
  stats: BaseStats;
  sprite?: string;
}

export type TypeChart = Record<string, Record<string, number>>;
