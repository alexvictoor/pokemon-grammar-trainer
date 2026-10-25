<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Combatant } from '../domain/battle';
import { useGymStore, TEAM_SIZE } from './gymStore';

const store = useGymStore();
const typed = ref('');
const placed = ref<number[]>([]);

const hpPercent = (combatant: Combatant | undefined) => (combatant ? Math.round((100 * combatant.hp) / combatant.maxHp) : 0);
const hpLevel = (combatant: Combatant | undefined) => (hpPercent(combatant) > 50 ? 'high' : hpPercent(combatant) > 20 ? 'mid' : 'low');

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
        <div v-for="side in [{ key: 'leader', combatant: store.leaderActive }, { key: 'player', combatant: store.playerActive }]" :key="side.key" class="fighter" :class="side.key">
          <div class="status">
            <span class="name">{{ side.key === 'leader' ? `${store.gym.leader}'s ` : '' }}{{ side.combatant?.entry.name }}</span>
            <span class="hp-bar" role="meter" :aria-valuenow="side.combatant?.hp" aria-valuemin="0" :aria-valuemax="side.combatant?.maxHp" :aria-label="`${side.combatant?.entry.name} HP`">
              <span :class="hpLevel(side.combatant)" :style="{ width: `${hpPercent(side.combatant)}%` }"></span>
            </span>
            <span class="hp-text">{{ side.combatant?.hp }} / {{ side.combatant?.maxHp }} HP</span>
          </div>
          <img v-if="side.combatant?.entry.sprite" class="sprite" :src="side.combatant.entry.sprite" :alt="side.combatant.entry.name" width="96" height="96" />
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
          <p v-if="store.battle?.status === 'won'" class="outcome good">You received the {{ store.gym.badge }}!</p>
          <p v-if="store.reward" class="reward">
            <img v-if="store.reward.sprite" :src="store.reward.sprite" alt="" width="96" height="96" />
            {{ store.gym.leader }} gives you {{ store.reward.name }}!
          </p>
          <p v-else class="outcome">You lose nothing. Train on the route and try again!</p>
          <button id="retry" type="button" class="primary" @click="store.open(store.gym)">Try again</button>
          <button id="back-to-route" type="button" class="secondary" @click="store.close()">Back to the route</button>
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

.reward img {
  image-rendering: pixelated;
}

button:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
