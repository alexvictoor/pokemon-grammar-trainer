<script setup lang="ts">
import { computed } from 'vue';
import { CHAPTER_TITLES } from '../domain/region';
import { useGameStore } from './gameStore';

const store = useGameStore();
const chapter = computed(() => store.route ?? 0);
const rules = computed(() => store.rules.filter(rule => rule.chapter === chapter.value));
const newChapter = computed(() => !store.routeQuestions.some(question => question.chapter === chapter.value && store.game.cards[question.id]));
</script>

<template>
  <section :key="chapter" class="route panel" aria-labelledby="route-title">
    <div class="location-sign">
      <p class="eyebrow">Route {{ chapter }} · Chapter {{ chapter }}</p>
      <h2 id="route-title" class="pixel">{{ CHAPTER_TITLES[chapter] }}</h2>
      <span v-if="newChapter" class="new-chapter">New chapter!</span>
    </div>
    <p class="summary">
      Caught {{ store.caughtCount }} / {{ store.pokemon.length }}
      <span class="streak">Streak {{ store.game.streak }}</span>
    </p>

    <ul class="rules">
      <li v-for="rule in rules" :key="rule.id">
        <span class="rule-label">{{ rule.label }}</span>
        <span class="bar" role="progressbar" :aria-valuenow="store.ruleMastery[rule.id] ?? 0" aria-valuemin="0" aria-valuemax="100" :aria-label="rule.label">
          <span :style="{ width: `${store.ruleMastery[rule.id] ?? 0}%` }"></span>
        </span>
        <span class="percent">{{ store.ruleMastery[rule.id] ?? 0 }}%</span>
      </li>
    </ul>

    <button id="explore" type="button" class="primary" @click="store.explore()">Walk in the tall grass</button>
    <button id="back-to-map" type="button" class="secondary" @click="store.openRoute(undefined)">Back to the map</button>
  </section>
</template>

<style scoped>
.route {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Like the games' location signs: the board drops in, then the label pops. */
.location-sign {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  margin: -4px -4px 0;
  border: 3px solid var(--frame);
  border-radius: 8px;
  background: var(--bg);
  animation: sign-drop 0.55s cubic-bezier(0.3, 1.4, 0.5, 1) both;
}

.new-chapter {
  position: absolute;
  top: -12px;
  right: 10px;
  padding: 3px 10px;
  border: 2px solid var(--frame);
  border-radius: 999px;
  background: #f4c542;
  color: #1b1f2a;
  font: 10px/1.4 var(--font-pixel);
  animation:
    pop-in 0.4s cubic-bezier(0.3, 1.6, 0.5, 1) 0.5s both,
    glow 1.6s ease-in-out 1s infinite;
}

@keyframes sign-drop {
  from {
    transform: translateY(-40px) rotate(-3deg);
    opacity: 0;
  }
}

@keyframes pop-in {
  from {
    transform: scale(0);
  }
}

@keyframes glow {
  50% {
    box-shadow: 0 0 12px #f4c542;
  }
}

.eyebrow {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

h2 {
  margin: 0;
  font-size: 16px;
}

.summary {
  margin: 0;
  display: flex;
  justify-content: space-between;
  font-variant-numeric: tabular-nums;
}

.streak {
  color: var(--muted);
}

.rules {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rules li {
  display: grid;
  grid-template-columns: 1fr 64px 40px;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.rule-label {
  min-width: 0;
}

.bar {
  height: 8px;
  border-radius: 4px;
  background: var(--line);
  overflow: hidden;
}

.bar span {
  display: block;
  height: 100%;
  background: var(--good);
}

.percent {
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}
</style>
