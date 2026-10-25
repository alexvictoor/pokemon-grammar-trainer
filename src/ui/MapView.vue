<script setup lang="ts">
import { CHAPTER_TITLES, isGymOpen, routesLabel } from '../domain/region';
import { useGameStore } from './gameStore';
import { useGymStore } from './gymStore';

const store = useGameStore();
const gyms = useGymStore();
</script>

<template>
  <section class="map" aria-labelledby="map-title">
    <div class="map-header">
      <h2 id="map-title" class="pixel">Kanto</h2>
      <p class="summary">
        Caught {{ store.caughtCount }} / {{ store.pokemon.length }}
        <span>Badges {{ store.game.badges?.length ?? 0 }} / {{ gyms.gyms.length }}</span>
      </p>
    </div>

    <section v-for="(gym, index) in gyms.gyms" :key="gym.id" class="area panel" :class="{ closed: !isGymOpen(gyms.gyms, index, store.game.badges ?? []) }">
      <p class="eyebrow">{{ gym.city }}</p>

      <template v-if="isGymOpen(gyms.gyms, index, store.game.badges ?? [])">
        <ul class="routes">
          <li v-for="chapter in gym.chapters" :key="chapter">
            <button :id="`route-${chapter}`" type="button" class="route-row" @click="store.openRoute(chapter)">
              <span class="route-name">Route {{ chapter }}</span>
              <span class="route-title">{{ CHAPTER_TITLES[chapter] }}</span>
              <span class="route-mastery">{{ store.chapterMastery[chapter] ?? 0 }}%</span>
            </button>
          </li>
        </ul>

        <div class="gym-card">
          <h3 class="pixel">{{ gym.city }} Gym · {{ gym.leader }}</h3>
          <p v-if="store.game.badges?.includes(gym.id)" class="badge-earned">{{ gym.badge }} earned</p>
          <button v-if="gyms.progressOf(gym).unlocked" :id="`challenge-${gym.id}`" type="button" class="primary" @click="gyms.open(gym)">
            Challenge {{ gym.leader }}
          </button>
          <p v-else class="locked">Reach {{ gym.unlockAt }}% on {{ routesLabel(gym.chapters) }} to challenge {{ gym.leader }}. Now: {{ gyms.progressOf(gym).mastery }}%.</p>
        </div>
      </template>
      <p v-else class="locked">Earn the {{ gyms.gyms[index - 1]?.badge }} to open {{ routesLabel(gym.chapters) }} and the {{ gym.city }} Gym.</p>
    </section>
  </section>
</template>

<style scoped>
.map {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.map-header h2 {
  margin: 0;
}

.summary {
  margin: 4px 0 0;
  display: flex;
  justify-content: space-between;
  font-variant-numeric: tabular-nums;
}

.summary span {
  color: var(--muted);
}

.area {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.area.closed {
  opacity: 0.6;
}

.eyebrow {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.routes {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.route-row {
  width: 100%;
  padding: 10px 12px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  border: 2px solid var(--line);
  border-radius: 8px;
  background: var(--bg);
  text-align: left;
  cursor: pointer;
}

.route-name {
  font-weight: 700;
  white-space: nowrap;
}

.route-title {
  min-width: 0;
}

.route-mastery {
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.gym-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 10px;
  border-top: 2px solid var(--line);
}

.gym-card h3,
.gym-card p,
.locked {
  margin: 0;
}

.gym-card h3 {
  font-size: 12px;
}

.badge-earned {
  color: var(--good);
  font-weight: 700;
}

.locked {
  color: var(--muted);
}
</style>
