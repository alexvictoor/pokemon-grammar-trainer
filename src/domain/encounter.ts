export type Rarity = 'common' | 'uncommon' | 'rare';
export type Ball = 'poke' | 'great' | 'ultra';

export interface WildPokemon {
  id: number;
  rarity: Rarity;
}

export interface Encounter {
  pokemonId: number;
  rarity: Rarity;
  attempts: number;
  status: 'active' | 'caught' | 'fled';
}

export type Outcome = { kind: 'throw'; ball: Ball; caught: boolean } | { kind: 'miss'; fled: boolean };

export interface EncounterResult {
  encounter: Encounter;
  streak: number;
  outcome: Outcome;
}

const MAX_ATTEMPTS = 3;
const BASE_CATCH: Record<Rarity, number> = { common: 0.7, uncommon: 0.45, rare: 0.25 };
const BALL_BONUS: Record<Ball, number> = { poke: 1, great: 1.5, ultra: 2 };
const FLEE_ON_MISS: Record<Rarity, number> = { common: 0, uncommon: 0.25, rare: 0.5 };
const SPAWN_THRESHOLDS: [Rarity, number][] = [
  ['common', 0.6],
  ['uncommon', 0.9],
  ['rare', 1],
];

export const rarityOf = (captureRate: number): Rarity => (captureRate >= 120 ? 'common' : captureRate > 45 ? 'uncommon' : 'rare');

export const ballFor = (streak: number): Ball => (streak >= 5 ? 'ultra' : streak >= 3 ? 'great' : 'poke');

export const catchChance = (rarity: Rarity, ball: Ball): number => Math.min(1, BASE_CATCH[rarity] * BALL_BONUS[ball]);

export const startEncounter = (pokemon: WildPokemon): Encounter => ({ pokemonId: pokemon.id, rarity: pokemon.rarity, attempts: 0, status: 'active' });

export const answerEncounter = (encounter: Encounter, correct: boolean, streak: number, random: () => number): EncounterResult => {
  if (encounter.status !== 'active') throw new Error('The encounter is over');
  const attempts = encounter.attempts + 1;
  const outOfAttempts = attempts >= MAX_ATTEMPTS;

  if (!correct) {
    const fled = random() < FLEE_ON_MISS[encounter.rarity];
    return {
      encounter: { ...encounter, attempts, status: fled || outOfAttempts ? 'fled' : 'active' },
      streak: 0,
      outcome: { kind: 'miss', fled },
    };
  }

  const ball = ballFor(streak + 1);
  const caught = random() < catchChance(encounter.rarity, ball);
  return {
    encounter: { ...encounter, attempts, status: caught ? 'caught' : outOfAttempts ? 'fled' : 'active' },
    streak: streak + 1,
    outcome: { kind: 'throw', ball, caught },
  };
};

export const wildPokemon = (table: WildPokemon[], random: () => number): WildPokemon => {
  const roll = random();
  const rarity = SPAWN_THRESHOLDS.find(([, threshold]) => roll < threshold)?.[0] ?? 'rare';
  const group = table.filter(pokemon => pokemon.rarity === rarity);
  const pool = group.length > 0 ? group : table;
  return pool[Math.floor(random() * pool.length)] as WildPokemon;
};
