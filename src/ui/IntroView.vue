<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from './gameStore';

const STARTERS = [1, 4, 7, 25];

const emit = defineEmits<{ start: [] }>();
const store = useGameStore();
const starters = computed(() => STARTERS.flatMap(id => store.pokemonById.get(id) ?? []));
</script>

<template>
  <button id="intro" type="button" class="intro" @click="emit('start')">
    <span class="flash" aria-hidden="true"></span>
    <span class="ball" aria-hidden="true"></span>
    <span class="title">Grammar Trainer</span>
    <span class="tagline">Catch them all. Master English.</span>
    <span class="starters" aria-hidden="true">
      <img v-for="(pokemon, index) in starters" :key="pokemon.id" :src="pokemon.sprite" alt="" width="96" height="96" :style="{ animationDelay: `${2.2 + index * 0.15}s` }" />
    </span>
    <span class="prompt">Tap to start</span>
  </button>
</template>

<style scoped>
/* A deliberate single dark look, like a console boot screen; every state below is the final one, the keyframes start from hidden. */
.intro {
  position: fixed;
  inset: 0;
  z-index: 20;
  width: 100%;
  border: 0;
  margin: 0;
  padding: calc(24px + env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) calc(24px + env(safe-area-inset-bottom, 0px))
    max(16px, env(safe-area-inset-left, 0px));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  background: radial-gradient(circle at 50% 40%, #2a3142 0%, #12151c 70%);
  color: #ffffff;
  font: inherit;
  cursor: pointer;
  overflow: hidden;
}

.flash {
  position: absolute;
  inset: 0;
  background: #ffffff;
  opacity: 0;
  pointer-events: none;
  animation: flash 0.5s ease-out 1.75s both;
}

.ball {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 6px solid #222222;
  background: linear-gradient(#d0372c 0 45%, #222222 45% 55%, #ffffff 55%);
  box-shadow: 0 10px 0 rgba(0, 0, 0, 0.35);
  animation:
    fall 0.9s cubic-bezier(0.3, 0, 0.6, 1) both,
    wobble 0.8s ease-in-out 0.95s both;
}

.ball::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 22px;
  height: 22px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 6px solid #222222;
  background: #ffffff;
}

.title {
  font: 22px/1.4 var(--font-pixel);
  letter-spacing: 0.04em;
  text-align: center;
  text-shadow: 3px 3px 0 #d0372c;
  animation: rise 0.5s steps(5) 1.95s both;
}

.tagline {
  color: #c8cfdb;
  font-size: 16px;
  animation: rise 0.5s ease-out 2.1s both;
}

.starters {
  display: flex;
  gap: 4px;
}

.starters img {
  width: 72px;
  height: 72px;
  image-rendering: pixelated;
  animation: hop 0.45s steps(3) both;
}

.prompt {
  margin-top: 12px;
  font: 13px/1.4 var(--font-pixel);
  color: #f4c542;
  animation:
    rise 0.3s ease-out 3s both,
    blink 1.1s steps(2, jump-none) 3.3s infinite;
}

.intro:focus-visible {
  outline: 3px solid #f4c542;
  outline-offset: -6px;
}

@keyframes fall {
  0% {
    transform: translateY(-70vh);
  }
  60% {
    transform: translateY(0);
  }
  75% {
    transform: translateY(-40px);
  }
  88% {
    transform: translateY(0);
  }
  94% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0);
  }
}

@keyframes wobble {
  0%,
  100% {
    transform: rotate(0);
  }
  20% {
    transform: rotate(-18deg);
  }
  45% {
    transform: rotate(14deg);
  }
  70% {
    transform: rotate(-8deg);
  }
}

@keyframes flash {
  0% {
    opacity: 0;
  }
  25% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
  }
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
}

@keyframes hop {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  60% {
    opacity: 1;
    transform: translateY(-8px);
  }
}

@keyframes blink {
  50% {
    opacity: 0.2;
  }
}
</style>
