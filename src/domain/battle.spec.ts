import { describe, expect, it } from 'vitest';
import { battleHp, damage, effectiveness, movesFor, playTurn, startBattle, type Battle } from './battle';
import type { PokemonEntry, TypeChart } from './pokemon';

const chart: TypeChart = {
  electric: { water: 2, flying: 2, grass: 0.5, ground: 0 },
  water: { fire: 2, grass: 0.5, water: 0.5 },
  normal: {},
};

const fighter = (overrides: Partial<PokemonEntry>): PokemonEntry => ({
  id: 0,
  name: 'Test',
  nameFr: 'Test',
  types: ['normal'],
  heightCm: 100,
  weightKg: 10,
  rarity: 'common',
  legendary: false,
  flavor: '',
  stats: { hp: 50, attack: 50, defense: 50, specialAttack: 50, specialDefense: 50 },
  ...overrides,
});

const pikachu = fighter({ id: 25, name: 'Pikachu', types: ['electric'], stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50 } });
const staryu = fighter({ id: 120, name: 'Staryu', types: ['water'], stats: { hp: 30, attack: 45, defense: 55, specialAttack: 70, specialDefense: 55 } });
const gyarados = fighter({ id: 130, name: 'Gyarados', types: ['water', 'flying'], stats: { hp: 95, attack: 125, defense: 79, specialAttack: 60, specialDefense: 100 } });

describe('movesFor', () => {
  it('gives a safe normal move and a strong move of the Pokémon’s first type', () => {
    expect(movesFor(gyarados)).toEqual([
      { name: 'Tackle', type: 'normal', power: 40, risk: 'safe' },
      { name: 'Surf', type: 'water', power: 90, risk: 'strong' },
    ]);
  });
});

describe('effectiveness', () => {
  it.each([
    { move: 'electric', defender: ['water'], multiplier: 2 },
    { move: 'electric', defender: ['water', 'flying'], multiplier: 4 },
    { move: 'electric', defender: ['grass'], multiplier: 0.5 },
    { move: 'electric', defender: ['ground'], multiplier: 0 },
    { move: 'normal', defender: ['water'], multiplier: 1 },
    { move: 'dragon', defender: ['water'], multiplier: 1 },
  ])('multiplies $move damage on $defender by $multiplier', ({ move, defender, multiplier }) => {
    expect(effectiveness(chart, move, defender)).toBe(multiplier);
  });
});

describe('battleHp', () => {
  it('returns twice the base HP plus 60', () => {
    expect(battleHp(pikachu)).toBe(130);
  });
});

describe('damage', () => {
  it.each([
    { label: 'Thunderbolt on Staryu', attacker: pikachu, defender: staryu, power: 90, multiplier: 2, expected: 75 },
    { label: 'Thunderbolt on Gyarados', attacker: pikachu, defender: gyarados, power: 90, multiplier: 4, expected: 91 },
    { label: 'Tackle on Staryu', attacker: pikachu, defender: staryu, power: 40, multiplier: 1, expected: 19 },
    { label: 'Surf from Gyarados on Pikachu', attacker: gyarados, defender: pikachu, power: 90, multiplier: 1, expected: 103 },
  ])('deals $expected for $label', ({ attacker, defender, power, multiplier, expected }) => {
    expect(damage(attacker, defender, power, multiplier)).toBe(expected);
  });

  it('deals nothing when the defender is immune', () => {
    expect(damage(pikachu, staryu, 90, 0)).toBe(0);
  });
});

describe('playTurn', () => {
  const thunderbolt = movesFor(pikachu)[1]!;
  const started = (): Battle => startBattle([pikachu], [staryu, gyarados]);

  it('starts with full HP on both sides', () => {
    const battle = started();

    expect(battle.player).toEqual([{ entry: pikachu, hp: 130, maxHp: 130 }]);
    expect(battle.leader.map(side => side.hp)).toEqual([120, 250]);
    expect(battle.status).toBe('ongoing');
  });

  it('lands the player’s move on a correct answer', () => {
    const { battle, events } = playTurn(started(), thunderbolt, true, chart);

    expect(battle.leader[0]!.hp).toBe(45);
    expect(events).toEqual([{ kind: 'attack', by: 'player', attacker: 'Pikachu', move: 'Thunderbolt', damage: 75, multiplier: 2 }]);
  });

  it('lets the leader attack on a wrong answer', () => {
    const { battle, events } = playTurn(started(), thunderbolt, false, chart);

    expect(battle.player[0]!.hp).toBe(130 - 59);
    expect(events).toEqual([{ kind: 'attack', by: 'leader', attacker: 'Staryu', move: 'Surf', damage: 59, multiplier: 1 }]);
  });

  it('sends out the leader’s next Pokémon when the active one faints', () => {
    const once = playTurn(started(), thunderbolt, true, chart).battle;

    const { battle, events } = playTurn(once, thunderbolt, true, chart);

    expect(battle.leader[0]!.hp).toBe(0);
    expect(battle.leaderActive).toBe(1);
    expect(events.slice(1)).toEqual([
      { kind: 'fainted', side: 'leader', name: 'Staryu' },
      { kind: 'sent-out', side: 'leader', name: 'Gyarados' },
    ]);
  });

  it('wins when the leader has no Pokémon left', () => {
    let battle = startBattle([pikachu], [staryu]);
    battle = playTurn(battle, thunderbolt, true, chart).battle;

    const result = playTurn(battle, thunderbolt, true, chart);

    expect(result.battle.status).toBe('won');
    expect(result.events.at(-1)).toEqual({ kind: 'won' });
  });

  it('loses when the player has no Pokémon left', () => {
    let battle = startBattle([pikachu], [gyarados]);
    battle = playTurn(battle, thunderbolt, false, chart).battle;

    const result = playTurn(battle, thunderbolt, false, chart);

    expect(result.battle.player[0]!.hp).toBe(0);
    expect(result.battle.status).toBe('lost');
    expect(result.events.at(-1)).toEqual({ kind: 'lost' });
  });

  it('rejects a turn once the battle is over', () => {
    let battle = startBattle([pikachu], [staryu]);
    battle = playTurn(battle, thunderbolt, true, chart).battle;
    battle = playTurn(battle, thunderbolt, true, chart).battle;

    expect(() => playTurn(battle, thunderbolt, true, chart)).toThrow('The battle is over');
  });
});
