<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGameStore } from './gameStore';

const TYPE_COLORS: Record<string, string> = {
  normal: '#a8a77a', fire: '#ee8130', water: '#6390f0', electric: '#f7d02c', grass: '#7ac74c', ice: '#96d9d6',
  fighting: '#c22e28', poison: '#a33ea1', ground: '#e2bf65', flying: '#a98ff3', psychic: '#f95587', bug: '#a6b91a',
  rock: '#b6a136', ghost: '#735797', dragon: '#6f35fc', dark: '#705746', steel: '#b7b7ce', fairy: '#d685ad',
};

const store = useGameStore();
const selectedId = ref<number>();
const selected = computed(() => (selectedId.value === undefined ? undefined : store.pokemonById.get(selectedId.value)));
const caught = computed(() => store.pokemon.filter(pokemon => store.game.caught[pokemon.id]).sort((a, b) => a.id - b.id));

const dexNumber = (id: number) => `#${String(id).padStart(3, '0')}`;
</script>

<template>
  <section class="pokedex" aria-labelledby="dex-title">
    <h2 id="dex-title" class="pixel">Pokédex · {{ store.caughtCount }} caught</h2>

    <article v-if="selected" class="detail panel">
      <img v-if="selected.sprite" :src="selected.sprite" :alt="selected.name" width="96" height="96" />
      <div class="facts">
        <p class="number">{{ dexNumber(selected.id) }}</p>
        <h3 class="pixel">{{ selected.name }}</h3>
        <p class="french">In French: <span lang="fr">{{ selected.nameFr }}</span></p>
        <p class="types">
          <span v-for="type in selected.types" :key="type" class="type" :style="{ background: TYPE_COLORS[type] }">{{ type }}</span>
        </p>
        <p class="size">{{ (selected.heightCm / 100).toFixed(1) }} m · {{ selected.weightKg }} kg · caught ×{{ store.game.caught[selected.id] }}</p>
      </div>
      <p class="flavor">{{ selected.flavor }}</p>
      <button id="close-detail" type="button" class="close" @click="selectedId = undefined">Close</button>
    </article>

    <p v-if="caught.length === 0" class="empty panel">No Pokémon caught yet. Walk in the tall grass on a route to catch your first one!</p>
    <ul v-else class="grid">
      <li v-for="pokemon in caught" :key="pokemon.id">
        <button :id="`dex-${pokemon.id}`" type="button" class="dex-slot" @click="selectedId = pokemon.id">
          <img v-if="pokemon.sprite" :src="pokemon.sprite" alt="" width="96" height="96" />
          <span class="slot-number">{{ dexNumber(pokemon.id) }}</span>
          <span class="slot-name">{{ pokemon.name }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.pokedex {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

h2 {
  margin: 0;
}

.detail {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 4px 12px;
  align-items: start;
}

.detail img {
  image-rendering: pixelated;
}

.facts {
  min-width: 0;
}

.facts p,
.facts h3 {
  margin: 0 0 4px;
}

.number,
.size,
.french {
  color: var(--muted);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

.types {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.type {
  padding: 1px 8px;
  border-radius: 999px;
  color: #1b1f2a;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.flavor {
  grid-column: 1 / -1;
  margin: 8px 0 0;
}

.close {
  grid-column: 1 / -1;
  justify-self: end;
  padding: 8px 14px;
  border: 2px solid var(--line);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}

.grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
}

.dex-slot {
  width: 100%;
  min-height: 116px;
  padding: 6px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  border: 2px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  cursor: pointer;
}

.dex-slot img {
  width: 72px;
  height: 72px;
  image-rendering: pixelated;
}

.empty {
  margin: 0;
  color: var(--muted);
}

.slot-number {
  font-size: 11px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.slot-name {
  font-size: 13px;
  overflow-wrap: anywhere;
}
</style>
