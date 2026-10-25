<script setup lang="ts">
const { delay = 0, colors = ['#f4c542', '#ffffff', '#ff8a65'] } = defineProps<{ delay?: number; colors?: string[] }>();

const PARTICLES = 12;
const particles = Array.from({ length: PARTICLES }, (_, index) => ({
  angle: (360 / PARTICLES) * index,
  distance: 70 + (index % 3) * 18,
}));
</script>

<template>
  <span class="burst" aria-hidden="true">
    <span
      v-for="(particle, index) in particles"
      :key="index"
      class="particle"
      :style="{
        '--angle': `${particle.angle}deg`,
        '--distance': `${particle.distance}px`,
        background: colors[index % colors.length],
        animationDelay: `${delay}s`,
      }"
    ></span>
  </span>
</template>

<style scoped>
.burst {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 3;
}

.particle {
  position: absolute;
  left: -6px;
  top: -6px;
  width: 12px;
  height: 12px;
  clip-path: polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  opacity: 0;
  animation: burst 0.9s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}

@keyframes burst {
  0% {
    opacity: 1;
    transform: rotate(var(--angle)) translateY(0) scale(0.4);
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: rotate(var(--angle)) translateY(calc(-1 * var(--distance))) scale(1);
  }
}
</style>
