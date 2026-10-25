<script setup lang="ts">
import { computed } from 'vue';
import type { Ball } from '../domain/encounter';
import Burst from './Burst.vue';
import { useGameStore } from './gameStore';

const BALL_NAMES: Record<Ball, string> = { poke: 'Poké Ball', great: 'Great Ball', ultra: 'Ultra Ball' };
const MAX_ATTEMPTS = 3;

const store = useGameStore();
const pokemon = computed(() => (store.play ? store.pokemonById.get(store.play.encounter.pokemonId) : undefined));
const name = computed(() => pokemon.value?.name ?? 'Pokémon');
const promptParts = computed(() => store.play?.question.prompt.split('___') ?? []);

const captureState = computed(() => {
  const feedback = store.feedback;
  if (!feedback) return 'idle';
  if (feedback.outcome.kind === 'throw' && feedback.outcome.caught) return 'caught';
  if (store.encounterOver) return 'fled';
  return feedback.outcome.kind === 'throw' ? 'escaped' : 'missed';
});
const thrownBall = computed(() => (store.feedback?.outcome.kind === 'throw' ? store.feedback.outcome.ball : undefined));

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
    <div class="scene" :class="[`capture-${captureState}`, { 'with-ball': thrownBall }]">
      <div class="meta">
        <span class="chip" :class="store.play.encounter.rarity">{{ store.play.encounter.rarity }}</span>
        <span class="attempts" :aria-label="`Throw ${Math.min(store.play.encounter.attempts + 1, MAX_ATTEMPTS)} of ${MAX_ATTEMPTS}`">
          <span v-for="index in MAX_ATTEMPTS" :key="index" class="dot" :class="{ used: index <= store.play.encounter.attempts }"></span>
        </span>
      </div>
      <div class="stage">
        <img
          v-if="pokemon?.sprite"
          :key="`${store.play.question.id}-${captureState}`"
          class="sprite"
          :class="{ fresh: store.play.encounter.attempts === 0 && captureState === 'idle' }"
          :src="pokemon.sprite"
          :alt="name"
          width="96"
          height="96"
        />
        <span v-if="thrownBall" :key="store.play.question.id" class="capture-ball" :class="thrownBall" aria-hidden="true"></span>
        <Burst v-if="captureState === 'caught'" :delay="2.1" />
      </div>
      <div class="ground" aria-hidden="true"></div>
    </div>

    <p class="dialog pixel">A wild {{ name }} appeared!</p>

    <div class="question panel" :class="{ shake: store.feedback && !store.feedback.correct }">
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

      <div v-else class="feedback" :class="[store.feedback.correct ? 'good' : 'bad', `after-${captureState}`]">
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

.stage {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: -40px;
  z-index: 1;
}

.sprite {
  width: 192px;
  height: 192px;
  image-rendering: pixelated;
}

.sprite.fresh {
  animation: appear 0.4s steps(4) both;
}

/* The ball: the top colour tells a Poké Ball, a Great Ball and an Ultra Ball apart. */
.capture-ball {
  --ball-top: linear-gradient(#d0372c, #d0372c);
  position: absolute;
  left: 50%;
  top: 58%;
  width: 46px;
  height: 46px;
  margin: -23px 0 0 -23px;
  border-radius: 50%;
  border: 4px solid #222222;
  background:
    linear-gradient(transparent 0 44%, #222222 44% 56%, #ffffff 56%),
    var(--ball-top);
  z-index: 2;
}

.capture-ball::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 10px;
  height: 10px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 3px solid #222222;
  background: #ffffff;
}

.capture-ball.great {
  --ball-top: linear-gradient(90deg, #3b6fd8 0 22%, #e2463b 22% 32%, #3b6fd8 32% 68%, #e2463b 68% 78%, #3b6fd8 78%);
}

.capture-ball.ultra {
  --ball-top: linear-gradient(90deg, #2b2b2b 0 30%, #f4c542 30% 40%, #2b2b2b 40% 60%, #f4c542 60% 70%, #2b2b2b 70%);
}

.capture-caught .capture-ball {
  animation:
    throw 0.45s ease-out both,
    shake-three 1.2s ease-in-out 0.9s both,
    click 0.4s ease-out 2.1s both;
}

.capture-caught .sprite {
  animation: absorb 0.35s ease-in 0.4s forwards;
}

.capture-escaped .capture-ball,
.capture-fled.with-ball .capture-ball {
  animation:
    throw 0.45s ease-out both,
    shake-one 0.5s ease-in-out 0.9s both,
    pop 0.3s ease-out 1.4s forwards;
}

.capture-escaped .sprite {
  animation: absorb-return 1.75s ease-in-out both;
}

.capture-missed .sprite {
  animation: taunt 0.7s steps(4) both;
}

.capture-fled .sprite {
  animation: flee 0.6s ease-in 0.3s forwards;
}

.capture-fled.with-ball .sprite {
  animation:
    absorb-return 1.75s ease-in-out both,
    flee 0.6s ease-in 1.9s forwards;
}

@keyframes throw {
  from {
    transform: translate(-150px, 170px) rotate(-540deg) scale(0.6);
  }
}

@keyframes absorb {
  0% {
    filter: brightness(1);
  }
  40% {
    filter: brightness(8);
    transform: scale(1);
  }
  100% {
    filter: brightness(8);
    transform: scale(0);
    opacity: 0;
  }
}

@keyframes absorb-return {
  0%,
  22% {
    filter: brightness(1);
    transform: scale(1);
  }
  28% {
    filter: brightness(8);
    transform: scale(0);
    opacity: 0;
  }
  80% {
    filter: brightness(8);
    transform: scale(0);
    opacity: 0;
  }
  88% {
    filter: brightness(4);
    transform: scale(1.15);
    opacity: 1;
  }
  100% {
    filter: brightness(1);
    transform: scale(1);
  }
}

@keyframes shake-three {
  0%,
  33%,
  66%,
  100% {
    transform: rotate(0);
  }
  10%,
  43%,
  76% {
    transform: rotate(-22deg);
  }
  20%,
  53%,
  86% {
    transform: rotate(18deg);
  }
}

@keyframes shake-one {
  0%,
  100% {
    transform: rotate(0);
  }
  30% {
    transform: rotate(-24deg);
  }
  65% {
    transform: rotate(20deg);
  }
}

@keyframes click {
  0% {
    filter: brightness(1);
  }
  40% {
    filter: brightness(1.8) drop-shadow(0 0 10px #f4c542);
  }
  100% {
    filter: brightness(1);
  }
}

@keyframes pop {
  to {
    transform: scale(1.7);
    opacity: 0;
  }
}

@keyframes taunt {
  0%,
  100% {
    transform: translateY(0);
  }
  25%,
  75% {
    transform: translateY(-16px);
  }
  50% {
    transform: translateY(0) scaleX(-1);
  }
}

@keyframes flee {
  20% {
    transform: translateX(-12px);
  }
  to {
    transform: translateX(170%);
    opacity: 0;
  }
}

.question.shake {
  animation: shake-card 0.45s ease-in-out both;
}

@keyframes shake-card {
  0%,
  100% {
    transform: translateX(0);
    border-color: var(--frame);
  }
  15%,
  55% {
    transform: translateX(-10px);
    border-color: var(--bad);
  }
  35%,
  75% {
    transform: translateX(10px);
    border-color: var(--bad);
  }
}

/* The result shows once the ball has settled; visibility keeps the buttons untouchable until then. */
.feedback.after-caught {
  animation: reveal 0.35s ease-out 2.4s both;
}

.feedback.after-escaped,
.feedback.after-fled {
  animation: reveal 0.35s ease-out 1.6s both;
}

@keyframes reveal {
  from {
    opacity: 0;
    visibility: hidden;
  }
  to {
    opacity: 1;
    visibility: visible;
  }
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
