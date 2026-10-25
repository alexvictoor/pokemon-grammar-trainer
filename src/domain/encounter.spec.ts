import { describe, expect, it } from 'vitest';
import { sequence } from './testing';
import { answerEncounter, ballFor, catchChance, rarityOf, startEncounter, wildPokemon, type Encounter } from './encounter';

const active = (overrides: Partial<Encounter> = {}): Encounter => ({ pokemonId: 25, rarity: 'common', attempts: 0, status: 'active', ...overrides });

describe('rarityOf', () => {
  it.each([
    { captureRate: 255, rarity: 'common' },
    { captureRate: 120, rarity: 'common' },
    { captureRate: 119, rarity: 'uncommon' },
    { captureRate: 46, rarity: 'uncommon' },
    { captureRate: 45, rarity: 'rare' },
    { captureRate: 3, rarity: 'rare' },
  ])('classifies a capture rate of $captureRate as $rarity', ({ captureRate, rarity }) => {
    expect(rarityOf(captureRate)).toBe(rarity);
  });
});

describe('ballFor', () => {
  it.each([
    { streak: 1, ball: 'poke' },
    { streak: 2, ball: 'poke' },
    { streak: 3, ball: 'great' },
    { streak: 4, ball: 'great' },
    { streak: 5, ball: 'ultra' },
    { streak: 12, ball: 'ultra' },
  ])('throws a $ball ball at a streak of $streak', ({ streak, ball }) => {
    expect(ballFor(streak)).toBe(ball);
  });
});

describe('catchChance', () => {
  it.each([
    { rarity: 'common', ball: 'poke', chance: 0.7 },
    { rarity: 'uncommon', ball: 'poke', chance: 0.45 },
    { rarity: 'rare', ball: 'poke', chance: 0.25 },
    { rarity: 'rare', ball: 'great', chance: 0.375 },
    { rarity: 'rare', ball: 'ultra', chance: 0.5 },
    { rarity: 'common', ball: 'ultra', chance: 1 },
  ] as const)('returns $chance for a $rarity Pokémon and a $ball ball', ({ rarity, ball, chance }) => {
    expect(catchChance(rarity, ball)).toBeCloseTo(chance);
  });
});

describe('startEncounter', () => {
  it('starts an active encounter with no attempt', () => {
    const encounter = startEncounter({ id: 133, rarity: 'uncommon' });

    expect(encounter).toEqual({ pokemonId: 133, rarity: 'uncommon', attempts: 0, status: 'active' });
  });
});

describe('answerEncounter', () => {
  it('catches the Pokémon when the throw succeeds', () => {
    const result = answerEncounter(active(), true, 0, sequence(0.69));

    expect(result).toEqual({
      encounter: active({ attempts: 1, status: 'caught' }),
      streak: 1,
      outcome: { kind: 'throw', ball: 'poke', caught: true },
    });
  });

  it('keeps the encounter going when the Pokémon breaks free', () => {
    const result = answerEncounter(active(), true, 0, sequence(0.7));

    expect(result).toEqual({
      encounter: active({ attempts: 1 }),
      streak: 1,
      outcome: { kind: 'throw', ball: 'poke', caught: false },
    });
  });

  it('throws a better ball once the streak reaches 3', () => {
    const result = answerEncounter(active({ rarity: 'rare' }), true, 2, sequence(0.3));

    expect(result.outcome).toEqual({ kind: 'throw', ball: 'great', caught: true });
  });

  it('resets the streak on a wrong answer', () => {
    const result = answerEncounter(active(), false, 4, sequence(0.99));

    expect(result.streak).toBe(0);
  });

  it('never makes a common Pokémon flee on a wrong answer', () => {
    const result = answerEncounter(active(), false, 0, sequence(0));

    expect(result).toEqual({ encounter: active({ attempts: 1 }), streak: 0, outcome: { kind: 'miss', fled: false } });
  });

  it.each([
    { rarity: 'uncommon', roll: 0.24, fled: true },
    { rarity: 'uncommon', roll: 0.25, fled: false },
    { rarity: 'rare', roll: 0.49, fled: true },
    { rarity: 'rare', roll: 0.5, fled: false },
  ] as const)('makes a $rarity Pokémon flee on a wrong answer when the roll is $roll: $fled', ({ rarity, roll, fled }) => {
    const result = answerEncounter(active({ rarity }), false, 0, sequence(roll));

    expect(result.outcome).toEqual({ kind: 'miss', fled });
    expect(result.encounter.status).toBe(fled ? 'fled' : 'active');
  });

  it('makes the Pokémon flee after the third attempt without a catch', () => {
    const result = answerEncounter(active({ attempts: 2 }), true, 0, sequence(0.99));

    expect(result.encounter).toEqual(active({ attempts: 3, status: 'fled' }));
  });

  it('rejects an answer once the encounter is over', () => {
    const answer = () => answerEncounter(active({ status: 'caught' }), true, 0, sequence(0));

    expect(answer).toThrow('The encounter is over');
  });
});

describe('wildPokemon', () => {
  const table = [
    { id: 16, rarity: 'common' },
    { id: 19, rarity: 'common' },
    { id: 133, rarity: 'uncommon' },
    { id: 147, rarity: 'rare' },
  ] as const;

  it.each([
    { rolls: [0.59, 0], id: 16 },
    { rolls: [0.59, 0.99], id: 19 },
    { rolls: [0.6, 0], id: 133 },
    { rolls: [0.9, 0], id: 147 },
  ])('picks Pokémon #$id with the rolls $rolls', ({ rolls, id }) => {
    const pokemon = wildPokemon([...table], sequence(...rolls));

    expect(pokemon.id).toBe(id);
  });

  it('falls back to another rarity when the rolled one has no Pokémon', () => {
    const pokemon = wildPokemon([{ id: 16, rarity: 'common' }], sequence(0.95, 0));

    expect(pokemon.id).toBe(16);
  });
});
