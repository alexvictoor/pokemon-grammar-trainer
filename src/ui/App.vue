<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import EncounterView from './EncounterView.vue';
import { useGameStore } from './gameStore';
import GymView from './GymView.vue';
import { useGymStore } from './gymStore';
import IntroView from './IntroView.vue';
import MapView from './MapView.vue';
import PokedexView from './PokedexView.vue';
import RouteView from './RouteView.vue';
import ShareView from './ShareView.vue';
import TeacherView from './TeacherView.vue';

const store = useGameStore();
const gyms = useGymStore();
const tab = ref<'map' | 'pokedex' | 'share'>('map');
const isTeacherPage = () => window.location.hash === '#teacher';
const teacher = ref(isTeacherPage());
const showIntro = ref(!teacher.value);
const followHash = () => {
  teacher.value = isTeacherPage();
  if (teacher.value) showIntro.value = false;
};
const start = () => {
  showIntro.value = false;
  store.enterFullscreen();
};

onMounted(() => window.addEventListener('hashchange', followHash));
onBeforeUnmount(() => window.removeEventListener('hashchange', followHash));
</script>

<template>
  <div class="app">
    <IntroView v-if="showIntro" @start="start" />
    <header class="shell">
      <div class="lights" aria-hidden="true"><span class="lens"></span><span></span><span></span><span></span></div>
      <h1 class="brand">Grammar Trainer</h1>
    </header>

    <TeacherView v-if="teacher" />
    <template v-else>
      <p v-if="store.saveFailed" class="save-warning" role="alert">
        This browser cannot save your progress. Before closing the page, open Share and copy your code: it brings your game back.
      </p>

      <GymView v-if="gyms.gym" />
      <EncounterView v-else-if="store.play" />
      <template v-else>
        <nav class="tabs" aria-label="Sections">
          <button id="tab-map" type="button" :aria-pressed="tab === 'map'" @click="tab = 'map'">Map</button>
          <button id="tab-pokedex" type="button" :aria-pressed="tab === 'pokedex'" @click="tab = 'pokedex'">Pokédex</button>
          <button id="tab-share" type="button" :aria-pressed="tab === 'share'" @click="tab = 'share'">Share</button>
        </nav>
        <template v-if="tab === 'map'">
          <RouteView v-if="store.route !== undefined" />
          <MapView v-else />
        </template>
        <PokedexView v-else-if="tab === 'pokedex'" />
        <ShareView v-else />
      </template>
    </template>

    <footer class="notice">Unofficial fan project for English class. Pokémon © Nintendo / Game Freak / The Pokémon Company.</footer>
  </div>
</template>

<style>
@font-face {
  font-family: 'Press Start 2P';
  src: url('../assets/press-start-2p.woff2') format('woff2');
  font-display: swap;
}

/* One phone-width column: a red device header, then panels in the style of the games' text boxes. */
:root {
  --bg: #eceff3;
  --surface: #ffffff;
  --ink: #1b1f2a;
  --muted: #5b6475;
  --line: #d3d9e2;
  --shell: #d0372c;
  --shell-ink: #ffffff;
  --frame: #2a2f3c;
  --accent: #2563d6;
  --good: #1d7f45;
  --bad: #c0352a;
  --grass: #8fcf7a;
  --font-pixel: 'Press Start 2P', ui-monospace, monospace;
  --font-body: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #13161c;
    --surface: #1c2129;
    --ink: #e7eaf0;
    --muted: #9aa3b4;
    --line: #2e3542;
    --shell: #a92e25;
    --frame: #c8cfdb;
    --accent: #6d9bff;
    --good: #55c585;
    --bad: #ff7d70;
    --grass: #3f7a3a;
    color-scheme: dark;
  }
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font: 16px/1.5 var(--font-body);
}

button {
  font: inherit;
  color: inherit;
}

button:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

.app {
  max-width: 480px;
  margin: 0 auto;
  padding-block: 0 24px;
  padding-left: max(16px, env(safe-area-inset-left, 0px));
  padding-right: max(16px, env(safe-area-inset-right, 0px));
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.shell {
  margin-inline: calc(-1 * max(16px, env(safe-area-inset-left, 0px)));
  padding: calc(12px + env(safe-area-inset-top, 0px)) 16px 12px;
  background: var(--shell);
  color: var(--shell-ink);
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 4px solid var(--frame);
}

.lights {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.lights span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f4c542;
  border: 2px solid var(--frame);
}

.lights span:nth-child(3) {
  background: #e9473b;
}

.lights span:nth-child(4) {
  background: #48b765;
}

.lights .lens {
  width: 28px;
  height: 28px;
  background: radial-gradient(circle at 35% 35%, #bfe3ff, #3a8be0 60%);
}

.brand {
  margin: 0;
  font: 14px/1.4 var(--font-pixel);
  letter-spacing: 0.04em;
}

.save-warning {
  margin: 0;
  padding: 12px;
  border: 2px solid var(--bad);
  border-radius: 8px;
  color: var(--bad);
  background: var(--surface);
}

.tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.tabs button {
  padding: 10px;
  border: 2px solid var(--frame);
  border-radius: 8px;
  background: var(--surface);
  font: 11px/1.4 var(--font-pixel);
  cursor: pointer;
}

.tabs button[aria-pressed='true'] {
  background: var(--frame);
  color: var(--bg);
}

.panel {
  background: var(--surface);
  border: 3px solid var(--frame);
  border-radius: 10px;
  padding: 16px;
}

.pixel {
  font-family: var(--font-pixel);
  font-size: 12px;
  line-height: 1.6;
}

.primary {
  width: 100%;
  padding: 14px;
  border: 3px solid var(--frame);
  border-radius: 10px;
  background: var(--accent);
  color: #ffffff;
  font: 700 17px/1.3 var(--font-body);
  cursor: pointer;
}

.secondary {
  width: 100%;
  padding: 12px;
  border: 2px solid var(--line);
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
}

.notice {
  color: var(--muted);
  font-size: 12px;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
  }
}
</style>
