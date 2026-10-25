import { defineStore } from 'pinia';
import { computed, inject, ref } from 'vue';
import { newCard, review } from '../domain/leitner';
import { masteryByChapter, masteryByRule } from '../domain/mastery';
import { encounterTable, openChapters } from '../domain/region';
import { answer, explore as exploreRoute, remember, type Feedback, type Play, type PlayContext } from '../domain/play';
import { restoreGame, type Progress } from '../domain/progressCode';
import { loadGame, saveGame } from '../domain/save';
import { GAME_DEPS } from './deps';

export const useGameStore = defineStore('game', () => {
  const deps = inject(GAME_DEPS);
  if (!deps) throw new Error('GAME_DEPS is not provided');

  const loaded = loadGame(deps.storage);
  const game = ref(loaded.game);
  const saveFailed = ref(loaded.status === 'unavailable');
  const play = ref<Play>();
  const feedback = ref<Feedback>();
  const next = ref<Play>();

  const pokemonById = new Map(deps.pokemon.map(pokemon => [pokemon.id, pokemon]));
  const routeQuestions = deps.questions.filter(question => question.kind === 'choice');
  const route = ref<number>();
  const recent = ref<string[]>([]);
  const context = (chapter: number): PlayContext => ({
    questions: routeQuestions.filter(question => question.chapter === chapter),
    wild: encounterTable(deps.pokemon, deps.gyms, chapter),
    now: deps.now(),
    random: deps.random,
    recent: recent.value,
  });
  const show = (shown: Play | undefined) => {
    if (shown) recent.value = remember(recent.value, shown.question.id);
  };

  const persist = () => {
    if (!saveGame(deps.storage, game.value)) saveFailed.value = true;
  };

  const openRoute = (chapter: number | undefined) => {
    route.value = chapter;
  };

  const explore = () => {
    if (route.value === undefined) return;
    const started = exploreRoute(game.value, context(route.value));
    game.value = started.game;
    play.value = started.play;
    show(started.play);
    feedback.value = undefined;
    persist();
  };

  const choose = (option: string) => {
    if (!play.value || feedback.value) return;
    const result = answer(game.value, play.value, option, context(play.value.question.chapter));
    game.value = result.game;
    play.value = { ...play.value, encounter: result.encounter };
    feedback.value = result.feedback;
    next.value = result.next;
    show(result.next);
    persist();
  };

  const proceed = () => {
    play.value = next.value;
    feedback.value = undefined;
    next.value = undefined;
  };

  const leave = () => {
    play.value = undefined;
    feedback.value = undefined;
    next.value = undefined;
  };

  const setNickname = (nickname: string) => {
    game.value = { ...game.value, nickname };
    persist();
  };

  const restore = (progress: Progress) => {
    game.value = restoreGame(progress, deps.now());
    leave();
    persist();
  };

  const recordReview = (questionId: string, correct: boolean) => {
    const now = deps.now();
    game.value = { ...game.value, cards: { ...game.value.cards, [questionId]: review(game.value.cards[questionId] ?? newCard(now), correct, now) } };
    persist();
  };

  const receive = (pokemonId: number) => {
    const { seen, caught } = game.value;
    game.value = {
      ...game.value,
      seen: seen.includes(pokemonId) ? seen : [...seen, pokemonId],
      caught: { ...caught, [pokemonId]: (caught[pokemonId] ?? 0) + 1 },
    };
    persist();
  };

  const awardBadge = (badge: string) => {
    const badges = game.value.badges ?? [];
    if (badges.includes(badge)) return;
    game.value = { ...game.value, badges: [...badges, badge] };
    persist();
  };

  const caughtCount = computed(() => Object.keys(game.value.caught).length);
  const ruleMastery = computed(() => masteryByRule(routeQuestions, game.value.cards));
  const chapterMastery = computed(() => masteryByChapter(routeQuestions, game.value.cards));
  const openChapterList = computed(() => openChapters(deps.gyms, game.value.badges ?? []));
  const encounterOver = computed(() => feedback.value !== undefined && next.value === undefined);

  return {
    game,
    saveFailed,
    play,
    feedback,
    encounterOver,
    caughtCount,
    ruleMastery,
    chapterMastery,
    openChapterList,
    route,
    openRoute,
    rules: deps.rules,
    pokemon: deps.pokemon,
    pokemonById,
    routeQuestions,
    now: deps.now,
    enterFullscreen: deps.enterFullscreen ?? (() => undefined),
    recordReview,
    receive,
    awardBadge,
    explore,
    choose,
    proceed,
    leave,
    setNickname,
    restore,
  };
});
