<script setup lang="ts">
import { computed } from 'vue';
import type { Ball } from '../domain/encounter';
import { useGameStore } from './gameStore';

const BALL_NAMES: Record<Ball, string> = { poke: 'Poké Ball', great: 'Great Ball', ultra: 'Ultra Ball' };
const MAX_ATTEMPTS = 3;

const store = useGameStore();
const pokemon = computed(() => (store.play ? store.pokemonById.get(store.play.encounter.pokemonId) : undefined));
const name = computed(() => pokemon.value?.name ?? 'Pokémon');
const promptParts = computed(() => store.play?.question.prompt.split('___') ?? []);

const outcomeText = computed(() => {
  const feedback = store.feedback;
  if (!feedback) return '';
  if (feedback.outcome.kind === 'throw') {
    const thrown = `Correct! You threw a ${BALL_NAMES[feedback.outcome.ball]}…`;
    if (feedback.outcome.caught) return `${thrown} Gotcha! ${name.value} was caught!`;
    return store.encounterOver ? `${thrown} ${name.value} broke free and ran away!` : `${thrown} Oh no! ${name.value} broke free!`;
  }
  if (feedback.outcome.fled) return `${name.value} fled!`;
  return store.encounterOver ? `${name.value} ran away!` : `${name.value} is still here. Try again!`;
});
</script>

<template>
  <section v-if="store.play" class="encounter" aria-live="polite">
    <div class="scene">
      <div class="meta">
        <span class="chip" :class="store.play.encounter.rarity">{{ store.play.encounter.rarity }}</span>
        <span class="attempts" :aria-label="`Throw ${Math.min(store.play.encounter.attempts + 1, MAX_ATTEMPTS)} of ${MAX_ATTEMPTS}`">
          <span v-for="index in MAX_ATTEMPTS" :key="index" class="dot" :class="{ used: index <= store.play.encounter.attempts }"></span>
        </span>
      </div>
      <img v-if="pokemon?.sprite" class="sprite" :src="pokemon.sprite" :alt="name" width="96" height="96" />
      <div class="ground" aria-hidden="true"></div>
    </div>

    <p class="dialog pixel">A wild {{ name }} appeared!</p>

    <div class="question panel">
      <p class="prompt">
        <template v-for="(part, index) in promptParts" :key="index">
          {{ part }}<span v-if="index < promptParts.length - 1" class="blank">___</span>
        </template>
      </p>

      <div v-if="!store.feedback" class="options">
        <button v-for="(option, index) in store.play.options" :id="`option-${index}`" :key="option" type="button" class="option" @click="store.choose(option)">
          {{ option }}
        </button>
      </div>

      <div v-else class="feedback" :class="store.feedback.correct ? 'good' : 'bad'">
        <p v-if="!store.feedback.correct" class="verdict">The answer was “{{ store.feedback.correctAnswer }}”.</p>
        <div v-if="!store.feedback.correct" class="explanation">
          <span class="label">Explication</span>
          <p lang="fr">{{ store.feedback.explanation }}</p>
        </div>
        <p class="outcome">{{ outcomeText }}</p>

        <button v-if="!store.encounterOver" id="next-question" type="button" class="primary" @click="store.proceed()">Next question</button>
        <template v-else>
          <button id="explore-again" type="button" class="primary" @click="store.explore()">Walk in the tall grass</button>
          <button id="back-to-route" type="button" class="secondary" @click="store.leave()">Back to the route</button>
        </template>
      </div>
    </div>

    <p class="streak">Streak {{ store.game.streak }}</p>
    <button v-if="!store.feedback" id="run-away" type="button" class="secondary" @click="store.leave()">Run away</button>
  </section>
</template>

<style scoped>
.encounter {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scene {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 8px;
}

.meta {
  align-self: stretch;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chip {
  padding: 2px 10px;
  border-radius: 999px;
  border: 2px solid var(--frame);
  background: var(--surface);
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.chip.rare {
  background: #f4c542;
  color: #1b1f2a;
}

.attempts {
  display: flex;
  gap: 6px;
}

.dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid var(--frame);
  background: linear-gradient(var(--shell) 50%, var(--surface) 50%);
}

.dot.used {
  opacity: 0.25;
}

.sprite {
  width: 192px;
  height: 192px;
  image-rendering: pixelated;
  position: relative;
  z-index: 1;
  margin-bottom: -40px;
  animation: appear 0.4s steps(4) both;
}

.ground {
  width: 220px;
  max-width: 100%;
  height: 48px;
  border-radius: 50%;
  background: var(--grass);
  border: 3px solid var(--frame);
}

@keyframes appear {
  from {
    transform: translateX(40px);
    opacity: 0;
  }
}

.dialog {
  margin: 0;
  padding: 14px 16px;
  background: var(--surface);
  border: 3px solid var(--frame);
  border-radius: 10px;
  box-shadow: inset 0 0 0 3px var(--surface), inset 0 0 0 5px var(--line);
}

.question {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prompt {
  margin: 0;
  font-size: 18px;
}

.blank {
  display: inline-block;
  min-width: 3em;
  color: transparent;
  border-bottom: 3px solid var(--accent);
}

.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option {
  padding: 12px 14px;
  border: 2px solid var(--line);
  border-radius: 8px;
  background: var(--bg);
  text-align: left;
  font-size: 17px;
  cursor: pointer;
}

.option:hover {
  border-color: var(--accent);
}

.feedback {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.verdict,
.outcome {
  margin: 0;
  font-weight: 600;
}

.feedback.good .outcome {
  color: var(--good);
}

.feedback.bad .verdict {
  color: var(--bad);
}

.explanation {
  padding: 10px 12px;
  border-left: 4px solid var(--bad);
  background: var(--bg);
  border-radius: 0 8px 8px 0;
}

.explanation .label {
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}

.explanation p {
  margin: 4px 0 0;
}

.streak {
  margin: 0;
  text-align: center;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
</style>
