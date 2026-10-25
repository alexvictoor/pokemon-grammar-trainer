import { describe, expect, it } from 'vitest';
import { answer, explore, remember, type PlayContext } from './play';
import { emptyGame } from './save';
import { aQuestion, MINUTE, sequence } from './testing';

const NOW = 1_800_000_000_000;
const questions = [
  aQuestion({ id: 'q1', answers: ['has lived'], distractors: ['lives', 'is living'], explanation: 'depuis → present perfect' }),
  aQuestion({ id: 'q2', answers: ['for'], distractors: ['since', 'during'] }),
];
const context = (random: () => number): PlayContext => ({ questions, wild: [{ id: 25, rarity: 'common' }], now: NOW, random, recent: [] });

describe('remember', () => {
  it('keeps the last three questions asked, oldest first', () => {
    const recent = remember(['a', 'b', 'c'], 'd');

    expect(recent).toEqual(['b', 'c', 'd']);
  });
});

describe('explore', () => {
  it('starts an encounter, marks the Pokémon as seen and asks a question', () => {
    const { game, play } = explore(emptyGame(), context(sequence(0)));

    expect(play.encounter).toEqual({ pokemonId: 25, rarity: 'common', attempts: 0, status: 'active' });
    expect(play.question.id).toBe('q1');
    expect([...play.options].sort()).toEqual(['has lived', 'is living', 'lives']);
    expect(game.seen).toEqual([25]);
  });

  it('does not open a new encounter with a question asked recently', () => {
    const missedQ1 = { ...emptyGame(), cards: { q1: { box: 1, dueAt: NOW } } };

    const { play } = explore(missedQ1, { ...context(sequence(0)), recent: ['q1'] });

    expect(play.question.id).toBe('q2');
  });

  it('does not list a Pokémon as seen twice', () => {
    const seenPikachu = { ...emptyGame(), seen: [25] };

    const { game } = explore(seenPikachu, context(sequence(0)));

    expect(game.seen).toEqual([25]);
  });
});

describe('answer', () => {
  it('records a catch, promotes the card and ends the encounter on a successful throw', () => {
    const { game, play } = explore(emptyGame(), context(sequence(0)));

    const result = answer(game, play, 'has lived', context(sequence(0)));

    expect(result.feedback).toEqual({ correct: true, correctAnswer: 'has lived', explanation: 'depuis → present perfect', outcome: { kind: 'throw', ball: 'poke', caught: true } });
    expect(result.game.caught).toEqual({ 25: 1 });
    expect(result.game.cards.q1).toEqual({ box: 2, dueAt: NOW + 20 * MINUTE });
    expect(result.game.streak).toBe(1);
    expect(result.encounter).toEqual({ pokemonId: 25, rarity: 'common', attempts: 1, status: 'caught' });
    expect(result.next).toBeUndefined();
  });

  it('asks another question when the Pokémon breaks free', () => {
    const { game, play } = explore(emptyGame(), context(sequence(0)));

    const result = answer(game, play, 'has lived', context(sequence(0.99, 0)));

    expect(result.feedback.outcome).toEqual({ kind: 'throw', ball: 'poke', caught: false });
    expect(result.next?.encounter.attempts).toBe(1);
    expect(result.next?.question.id).toBe('q2');
  });

  it('sends the card back to box 1 and keeps the encounter on a wrong answer', () => {
    const withCard = { ...emptyGame(), cards: { q1: { box: 3, dueAt: NOW } }, streak: 4 };
    const { game, play } = explore(withCard, context(sequence(0)));

    const result = answer(game, play, 'lives', context(sequence(0)));

    expect(result.feedback).toEqual({ correct: false, correctAnswer: 'has lived', explanation: 'depuis → present perfect', outcome: { kind: 'miss', fled: false } });
    expect(result.game.cards.q1).toEqual({ box: 1, dueAt: NOW });
    expect(result.game.streak).toBe(0);
    expect(result.game.caught).toEqual({});
    expect(result.next?.question.id).toBe('q2');
  });
});
