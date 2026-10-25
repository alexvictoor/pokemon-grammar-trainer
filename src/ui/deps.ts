import type { InjectionKey } from 'vue';
import type { Gym } from '../domain/gym';
import type { PokemonEntry, TypeChart } from '../domain/pokemon';
import type { Question, Rule } from '../domain/question';
import type { SaveStorage } from '../domain/save';

export interface GameDeps {
  storage: SaveStorage;
  random: () => number;
  now: () => number;
  questions: Question[];
  rules: Rule[];
  pokemon: PokemonEntry[];
  gyms: Gym[];
  typeChart: TypeChart;
}

export const GAME_DEPS: InjectionKey<GameDeps> = Symbol('game-deps');
