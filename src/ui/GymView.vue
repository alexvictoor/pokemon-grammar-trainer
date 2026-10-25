<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Combatant, Side } from '../domain/battle';
import { routesLabel } from '../domain/region';
import Burst from './Burst.vue';
import { useGymStore, TEAM_SIZE } from './gymStore';

const store = useGymStore();
const typed = ref('');
const placed = ref<number[]>([]);

const hpPercent = (combatant: Combatant | undefined) => (combatant ? Math.round((100 * combatant.hp) / combatant.maxHp) : 0);
const hpLevel = (combatant: Combatant | undefined) => (hpPercent(combatant) > 50 ? 'high' : hpPercent(combatant) > 20 ? 'mid' : 'low');

const attacker = computed<Side | undefined>(() => (store.phase === 'result' && store.feedback ? (store.feedback.correct ? 'player' : 'leader') : undefined));
const motionOf = (side: string) => (attacker.value === undefined ? undefined : attacker.value === side ? 'lunge' : 'hit');

const promptParts = computed(() => store.question?.prompt.split('___') ?? []);
const sentence = computed(() => placed.value.map(index => store.options[index]).join(' '));

const resetAnswer = () => {
  typed.value = '';
  placed.value = [];
};

const submit = (response: string) => {
  store.submit(response);
  resetAnswer();
};

const place = (index: number) => {
  placed.value = [...placed.value, index];
};

const unplace = (position: number) => {
  placed.value = placed.value.filter((_, other) => other !== position);
};
</script>

<template>
  <section v-if="store.gym" class="gym" aria-live="polite">
    <header class="gym-header">
      <p class="eyebrow">{{ store.gym.city }} Gym</p>
      <h2 class="pixel">Leader {{ store.gym.leader }}</h2>
    </header>

    <div v-if="store.phase === 'team'" class="panel stack">
      <p class="leader-team">
        {{ store.gym.leader }} will use
        <span v-for="(pokemon, index) in store.leaderEntries" :key="pokemon.id">
          <img v-if="pokemon.sprite" :src="pokemon.sprite" alt="" width="48" height="48" />{{ pokemon.name }}{{ index < store.leaderEntries.length - 1 ? ', ' : '.' }}
        </span>
      </p>
      <p v-if="store.caughtEntries.length === 0">Catch at least one Pokémon on the route first.</p>
      <template v-else>
        <p>Choose up to {{ TEAM_SIZE }} Pokémon.</p>
        <ul class="team-grid">
          <li v-for="pokemon in store.caughtEntries" :key="pokemon.id">
            <button :id="`team-${pokemon.id}`" type="button" class="team-choice" :aria-pressed="store.selected.includes(pokemon.id)" @click="store.toggle(pokemon.id)">
              <img v-if="pokemon.sprite" :src="pokemon.sprite" alt="" width="72" height="72" />
              <span>{{ pokemon.name }}</span>
            </button>
          </li>
        </ul>
        <button id="start-battle" type="button" class="primary" :disabled="store.selected.length === 0" @click="store.start()">Start the battle</button>
      </template>
      <button id="leave-gym" type="button" class="secondary" @click="store.close()">Back to the route</button>
    </div>

    <template v-else>
      <div class="arena">
        <div v-for="side in [{ key: 'leader', combatant: store.leaderActive }, { key: 'player', combatant: store.playerActive }]" :key="side.key" class="fighter" :class="[side.key, motionOf(side.key)]">
          <div class="status">
            <span class="name">{{ side.key === 'leader' ? `${store.gym.leader}'s ` : '' }}{{ side.combatant?.entry.name }}</span>
            <span class="hp-bar" role="meter" :aria-valuenow="side.combatant?.hp" aria-valuemin="0" :aria-valuemax="side.combatant?.maxHp" :aria-label="`${side.combatant?.entry.name} HP`">
              <span :class="hpLevel(side.combatant)" :style="{ width: `${hpPercent(side.combatant)}%` }"></span>
            </span>
            <span class="hp-text">{{ side.combatant?.hp }} / {{ side.combatant?.maxHp }} HP</span>
          </div>
          <img
            v-if="side.combatant?.entry.sprite"
            :key="side.combatant.entry.id"
            class="sprite"
            :src="side.combatant.entry.sprite"
            :alt="side.combatant.entry.name"
            width="96"
            height="96"
          />
        </div>
      </div>

      <div v-if="store.phase === 'move'" class="panel stack">
        <p class="pixel">What will {{ store.playerActive?.entry.name }} do?</p>
        <div class="moves">
          <button v-for="move in store.moves" :id="`move-${move.risk}`" :key="move.name" type="button" class="move" :class="move.risk" @click="store.chooseMove(move)">
            <span class="move-name">{{ move.name }}</span>
            <span class="move-hint">{{ move.risk === 'safe' ? 'Safe · pick an answer' : 'Strong · write the answer' }}</span>
          </button>
        </div>
      </div>

      <div v-else-if="store.phase === 'question' && store.question" class="panel stack">
        <template v-if="store.question.kind === 'reorder'">
          <p class="hint">Put the words in order:</p>
          <p class="prompt" lang="fr">{{ store.question.prompt }}</p>
          <p class="sentence" aria-label="Your sentence">
            <button v-for="(index, position) in placed" :key="position" type="button" class="placed" @click="unplace(position)">{{ store.options[index] }}</button>
            <span v-if="placed.length === 0" class="hint">Tap the words below.</span>
          </p>
          <div class="tiles">
            <button
              v-for="(word, index) in store.options"
              v-show="!placed.includes(index)"
              :id="`tile-${index}`"
              :key="index"
              type="button"
              class="tile"
              @click="place(index)"
            >
              {{ word }}
            </button>
          </div>
          <button id="attack" type="button" class="primary" :disabled="placed.length === 0" @click="submit(sentence)">Attack!</button>
        </template>

        <template v-else>
          <p class="prompt">
            <template v-for="(part, index) in promptParts" :key="index">
              {{ part }}<span v-if="index < promptParts.length - 1" class="blank">___</span>
            </template>
          </p>
          <div v-if="store.question.kind === 'choice'" class="options">
            <button v-for="(option, index) in store.options" :id="`option-${index}`" :key="option" type="button" class="option" @click="submit(option)">{{ option }}</button>
          </div>
          <form v-else class="typed" @submit.prevent="submit(typed)">
            <label for="typed-answer">Your answer</label>
            <input id="typed-answer" v-model="typed" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" />
            <button id="attack" type="submit" class="primary" :disabled="typed.trim() === ''">Attack!</button>
          </form>
        </template>
      </div>

      <div v-else-if="store.phase === 'result' || store.phase === 'over'" class="panel stack">
        <template v-if="store.phase === 'result' && store.feedback">
          <p class="verdict" :class="store.feedback.correct ? 'good' : 'bad'">
            {{ store.feedback.correct ? 'Correct!' : `The answer was “${store.feedback.correctAnswer}”.` }}
          </p>
          <div v-if="!store.feedback.correct" class="explanation">
            <span class="label">Explication</span>
            <p lang="fr">{{ store.feedback.explanation }}</p>
          </div>
        </template>
        <p v-for="(line, index) in store.lines" :key="index" class="dialog-line pixel">{{ line }}</p>

        <button v-if="store.phase === 'result'" id="continue" type="button" class="primary" @click="store.proceed()">Continue</button>
        <template v-else>
          <template v-if="store.battle?.status === 'won'">
            <div class="badge-reveal" aria-hidden="true">
              <span class="badge-gem"></span>
              <Burst :delay="0.5" :colors="['#f4c542', '#ffffff', '#6d9bff']" />
            </div>
            <p class="outcome good">You received the {{ store.gym.badge }}!</p>
            <p v-if="store.reward" class="reward">
              <span class="reward-sprite">
                <img v-if="store.reward.sprite" :src="store.reward.sprite" alt="" width="96" height="96" />
                <Burst :delay="1.3" :colors="['#ffffff', '#c7f0ff', '#f4c542']" />
              </span>
              {{ store.gym.leader }} gives you {{ store.reward.name }}!
            </p>
            <p v-if="store.nextGym" class="unlock-banner">New area open: {{ store.nextGym.city }} · {{ routesLabel(store.nextGym.chapters) }}!</p>
            <button id="back-to-route" type="button" class="primary" @click="store.close()">Back to the route</button>
          </template>
          <template v-else>
            <p class="outcome">You lose nothing. Train on the route and try again!</p>
            <button id="retry" type="button" class="primary" @click="store.open(store.gym)">Try again</button>
            <button id="back-to-route" type="button" class="secondary" @click="store.close()">Back to the route</button>
          </template>
        </template>
      </div>
    </template>
  </section>
</template>

<style scoped>
.gym {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gym-header h2,
.eyebrow {
  margin: 0;
}

.eyebrow {
  color: var(--muted);
  font-size: 13px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stack p {
  margin: 0;
}

.leader-team img {
  vertical-align: middle;
  image-rendering: pixelated;
}

.team-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
}

.team-choice {
  width: 100%;
  padding: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  cursor: pointer;
}

.team-choice[aria-pressed='true'] {
  border-color: var(--accent);
  box-shadow: inset 0 0 0 2px var(--accent);
}

.team-choice img,
.sprite {
  image-rendering: pixelated;
}

.arena {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border: 3px solid var(--frame);
  border-radius: 10px;
  background: linear-gradient(var(--surface) 60%, var(--grass) 60%);
}

.fighter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.fighter.player {
  flex-direction: row-reverse;
}

.status {
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  border: 2px solid var(--frame);
  border-radius: 8px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name {
  font-weight: 700;
}

.hp-bar {
  height: 8px;
  border-radius: 4px;
  background: var(--line);
  overflow: hidden;
}

.hp-bar span {
  display: block;
  height: 100%;
  transition: width 0.4s steps(8);
}

.hp-bar .high {
  background: var(--good);
}

.hp-bar .mid {
  background: #e0a526;
}

.hp-bar .low {
  background: var(--bad);
}

.hp-text {
  font-size: 13px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.sprite {
  width: 112px;
  height: 112px;
  animation: sent-out 0.45s cubic-bezier(0.3, 1.5, 0.5, 1) both;
}

/* The attacker lunges towards the other side; the target shakes and blinks as it takes the hit. */
.fighter.leader.lunge .sprite {
  animation: lunge-leader 0.4s ease-in-out both;
}

.fighter.player.lunge .sprite {
  animation: lunge-player 0.4s ease-in-out both;
}

.fighter.hit .sprite {
  animation: take-hit 0.6s steps(6) 0.3s both;
}

.fighter.hit .hp-bar span {
  animation: hp-flash 0.6s steps(3) 0.3s both;
}

@keyframes sent-out {
  from {
    transform: scale(0);
    filter: brightness(6);
  }
}

@keyframes lunge-leader {
  50% {
    transform: translate(-36px, 24px);
  }
}

@keyframes lunge-player {
  50% {
    transform: translate(36px, -24px);
  }
}

@keyframes take-hit {
  0%,
  100% {
    transform: translateX(0);
    opacity: 1;
  }
  20%,
  60% {
    transform: translateX(-8px);
    opacity: 0.2;
  }
  40%,
  80% {
    transform: translateX(8px);
    opacity: 1;
  }
}

@keyframes hp-flash {
  50% {
    filter: brightness(2);
  }
}

.moves {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.move {
  padding: 12px 8px;
  border: 3px solid var(--frame);
  border-radius: 10px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
}

.move.strong {
  background: var(--accent);
  color: #ffffff;
}

.move-name {
  font-weight: 700;
  font-size: 17px;
}

.move-hint {
  font-size: 12px;
}

.prompt {
  font-size: 18px;
}

.blank {
  display: inline-block;
  min-width: 3em;
  color: transparent;
  border-bottom: 3px solid var(--accent);
}

.hint {
  color: var(--muted);
  font-size: 14px;
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

.typed {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.typed label {
  font-weight: 600;
}

.typed input {
  padding: 12px;
  border: 2px solid var(--line);
  border-radius: 8px;
  background: var(--bg);
  color: var(--ink);
  font-size: 18px;
}

.sentence {
  min-height: 48px;
  padding: 8px;
  border: 2px dashed var(--line);
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tile,
.placed {
  padding: 8px 12px;
  border: 2px solid var(--frame);
  border-radius: 8px;
  background: var(--surface);
  font-size: 16px;
  cursor: pointer;
}

.placed {
  background: var(--accent);
  color: #ffffff;
}

.verdict {
  font-weight: 700;
}

.verdict.good,
.outcome.good {
  color: var(--good);
}

.verdict.bad {
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

.dialog-line {
  padding: 8px 12px;
  border: 2px solid var(--frame);
  border-radius: 8px;
  background: var(--surface);
}

.outcome {
  font-weight: 700;
}

.reward {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}

.reward-sprite {
  position: relative;
  display: inline-flex;
}

.reward img {
  image-rendering: pixelated;
  animation: reward-rise 0.8s cubic-bezier(0.3, 1.4, 0.5, 1) 1.1s both;
}

@keyframes reward-rise {
  from {
    transform: translateY(30px) scale(0.3);
    filter: brightness(8);
    opacity: 0;
  }
}

/* The badge spins in, a light sweeps across it, then the stars burst. */
.badge-reveal {
  position: relative;
  display: flex;
  justify-content: center;
  padding: 12px 0;
}

.badge-gem {
  position: relative;
  width: 84px;
  height: 84px;
  clip-path: polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%);
  background: linear-gradient(135deg, #ffe58a, #f4c542 45%, #c8901c);
  overflow: hidden;
  animation: badge-spin 0.9s cubic-bezier(0.3, 1.3, 0.5, 1) both;
}

.badge-gem::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 35%, rgba(255, 255, 255, 0.85) 50%, transparent 65%);
  animation: shine 0.9s ease-in-out 0.8s both;
}

@keyframes badge-spin {
  from {
    transform: rotateY(720deg) scale(0.2);
    opacity: 0;
  }
}

@keyframes shine {
  from {
    transform: translateX(-120%);
  }
  to {
    transform: translateX(120%);
  }
}

.unlock-banner {
  padding: 10px 12px;
  border: 3px solid var(--frame);
  border-radius: 8px;
  background: #f4c542;
  color: #1b1f2a;
  font: 11px/1.6 var(--font-pixel);
  text-align: center;
  animation: banner-in 0.5s cubic-bezier(0.3, 1.4, 0.5, 1) 2s both;
}

@keyframes banner-in {
  from {
    transform: translateX(-110%);
    opacity: 0;
  }
}

button:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
