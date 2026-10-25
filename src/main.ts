import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { questions, rules } from './content';
import pokemon from './data/pokemon.json';
import typeChart from './data/type-chart.json';
import { GYMS } from './domain/gym';
import type { PokemonEntry, TypeChart } from './domain/pokemon';
import type { SaveStorage } from './domain/save';
import { enterFullscreen, registerServiceWorker } from './pwa';
import App from './ui/App.vue';
import { GAME_DEPS } from './ui/deps';

const browserStorage: SaveStorage = {
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
};

createApp(App)
  .use(createPinia())
  .provide(GAME_DEPS, {
    storage: browserStorage,
    random: Math.random,
    now: Date.now,
    questions,
    rules,
    pokemon: pokemon as PokemonEntry[],
    gyms: GYMS,
    typeChart: typeChart as TypeChart,
    enterFullscreen,
  })
  .mount('#app');

registerServiceWorker();
