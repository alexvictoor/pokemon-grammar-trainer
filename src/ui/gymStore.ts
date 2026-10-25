import { defineStore } from 'pinia';
import { computed, inject, ref } from 'vue';
import { isCorrect } from '../domain/answers';
import { movesFor, playTurn, startBattle, type Battle, type Move } from '../domain/battle';
import { gymProgress, type Gym } from '../domain/gym';
import { nextQuestion } from '../domain/picker';
import { remember } from '../domain/play';
import type { PokemonEntry } from '../domain/pokemon';
import { optionsOf, type Question } from '../domain/question';
import { battleLines } from './battleText';
import { GAME_DEPS } from './deps';
import { useGameStore } from './gameStore';

export const TEAM_SIZE = 3;

type Phase = 'team' | 'move' | 'question' | 'result' | 'over';

export interface TurnFeedback {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
}

export const useGymStore = defineStore('gym', () => {
  const deps = inject(GAME_DEPS);
  if (!deps) throw new Error('GAME_DEPS is not provided');
  const game = useGameStore();

  const gym = ref<Gym>();
  const phase = ref<Phase>('team');
  const selected = ref<number[]>([]);
  const battle = ref<Battle>();
  const move = ref<Move>();
  const question = ref<Question>();
  const options = ref<string[]>([]);
  const feedback = ref<TurnFeedback>();
  const lines = ref<string[]>([]);
  const recent = ref<string[]>([]);
  const reward = ref<PokemonEntry>();

  const entriesOf = (ids: number[]): PokemonEntry[] => ids.flatMap(id => game.pokemonById.get(id) ?? []);
  const caughtEntries = computed(() => entriesOf(Object.keys(game.game.caught).map(Number)));
  const leaderEntries = computed(() => entriesOf(gym.value?.team ?? []));
  const playerActive = computed(() => battle.value?.player[battle.value.playerActive]);
  const leaderActive = computed(() => battle.value?.leader[battle.value.leaderActive]);
  const moves = computed(() => (playerActive.value ? movesFor(playerActive.value.entry) : []));
  const progressOf = (target: Gym) => gymProgress(target, game.routeQuestions, game.game.cards);

  const open = (target: Gym) => {
    gym.value = target;
    phase.value = 'team';
    selected.value = [];
    battle.value = undefined;
    lines.value = [];
    reward.value = undefined;
  };

  const toggle = (id: number) => {
    if (selected.value.includes(id)) selected.value = selected.value.filter(other => other !== id);
    else if (selected.value.length < TEAM_SIZE) selected.value = [...selected.value, id];
  };

  const start = () => {
    if (selected.value.length === 0) return;
    battle.value = startBattle(entriesOf(selected.value), leaderEntries.value);
    lines.value = [];
    phase.value = 'move';
  };

  const questionPool = (chosen: Move): Question[] => {
    const tested = deps.questions.filter(candidate => gym.value?.chapters.includes(candidate.chapter));
    const choice = tested.filter(candidate => candidate.kind === 'choice');
    const written = tested.filter(candidate => candidate.kind !== 'choice');
    return chosen.risk === 'strong' && written.length > 0 ? written : choice;
  };

  const chooseMove = (chosen: Move) => {
    const picked = nextQuestion(questionPool(chosen), game.game.cards, deps.now(), deps.random, recent.value);
    recent.value = remember(recent.value, picked.id);
    move.value = chosen;
    question.value = picked;
    options.value = optionsOf(picked, deps.random);
    feedback.value = undefined;
    phase.value = 'question';
  };

  const submit = (response: string) => {
    if (!battle.value || !move.value || !question.value || !gym.value) return;
    const correct = isCorrect(question.value, response);
    game.recordReview(question.value.id, correct);
    const turn = playTurn(battle.value, move.value, correct, deps.typeChart);
    battle.value = turn.battle;
    feedback.value = { correct, correctAnswer: question.value.answers[0] ?? '', explanation: question.value.explanation };
    lines.value = battleLines(turn.events, gym.value.leader);
    if (turn.battle.status === 'won' && !game.game.badges?.includes(gym.value.id)) {
      game.awardBadge(gym.value.id);
      game.receive(gym.value.reward);
      reward.value = game.pokemonById.get(gym.value.reward);
    }
    phase.value = 'result';
  };

  const proceed = () => {
    phase.value = battle.value?.status === 'ongoing' ? 'move' : 'over';
  };

  const close = () => {
    gym.value = undefined;
    battle.value = undefined;
  };

  return {
    gym,
    phase,
    selected,
    battle,
    move,
    question,
    options,
    feedback,
    lines,
    reward,
    caughtEntries,
    leaderEntries,
    playerActive,
    leaderActive,
    moves,
    gyms: deps.gyms,
    progressOf,
    open,
    toggle,
    start,
    chooseMove,
    submit,
    proceed,
    close,
  };
});
