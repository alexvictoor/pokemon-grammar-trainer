import { answerEncounter, startEncounter, wildPokemon, type Encounter, type Outcome, type WildPokemon } from './encounter';
import { newCard, review } from './leitner';
import { nextQuestion } from './picker';
import { isCorrect } from './answers';
import { optionsOf, type Question } from './question';
import type { GameState } from './save';

export interface PlayContext {
  questions: Question[];
  wild: WildPokemon[];
  now: number;
  random: () => number;
  recent: string[];
}

const RECENT_LIMIT = 3;

export const remember = (recent: string[], questionId: string): string[] => [...recent, questionId].slice(-RECENT_LIMIT);

export interface Play {
  encounter: Encounter;
  question: Question;
  options: string[];
}

export interface Feedback {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
  outcome: Outcome;
}

const ask = (game: GameState, encounter: Encounter, context: PlayContext, recent: string[]): Play => {
  const question = nextQuestion(context.questions, game.cards, context.now, context.random, recent);
  return { encounter, question, options: optionsOf(question, context.random) };
};

export const explore = (game: GameState, context: PlayContext): { game: GameState; play: Play } => {
  const encounter = startEncounter(wildPokemon(context.wild, context.random));
  const seen = game.seen.includes(encounter.pokemonId) ? game.seen : [...game.seen, encounter.pokemonId];
  const updated = { ...game, seen };
  return { game: updated, play: ask(updated, encounter, context, context.recent) };
};

export const answer = (
  game: GameState,
  play: Play,
  chosen: string,
  context: PlayContext,
): { game: GameState; encounter: Encounter; feedback: Feedback; next?: Play } => {
  const { question } = play;
  const correct = isCorrect(question, chosen);
  const card = review(game.cards[question.id] ?? newCard(context.now), correct, context.now);
  const result = answerEncounter(play.encounter, correct, game.streak, context.random);
  const { pokemonId } = result.encounter;

  const updated: GameState = {
    ...game,
    cards: { ...game.cards, [question.id]: card },
    streak: result.streak,
    caught: result.encounter.status === 'caught' ? { ...game.caught, [pokemonId]: (game.caught[pokemonId] ?? 0) + 1 } : game.caught,
  };
  const feedback = { correct, correctAnswer: question.answers[0] ?? '', explanation: question.explanation, outcome: result.outcome };
  const next = result.encounter.status === 'active' ? ask(updated, result.encounter, context, remember(context.recent, question.id)) : undefined;
  const answered = { game: updated, encounter: result.encounter, feedback };
  return next ? { ...answered, next } : answered;
};
