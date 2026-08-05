<template>
  <div class="paw-background" aria-hidden="true">
    <span
      v-for="paw in paws"
      :key="paw.id"
      class="paw"
      :style="{
        top: `${paw.top}%`,
        left: `${paw.left}%`,
        width: `${paw.size}px`,
        height: `${paw.size}px`,
        transform: `rotate(${paw.rotation}deg)`,
        opacity: paw.opacity,
        backgroundColor: paw.color
      }"
    />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ count?: number }>(), { count: 14 })

const COLORS = ['#ffffff', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#A855F7', '#EC4899', '#06B6D4']

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

const paws = Array.from({ length: props.count }, (_, id) => ({
  id,
  top: randomBetween(2, 88),
  left: randomBetween(2, 88),
  size: randomBetween(28, 72),
  rotation: randomBetween(0, 360),
  opacity: randomBetween(0.12, 0.3),
  color: COLORS[Math.floor(Math.random() * COLORS.length)]
}))
</script>

<style scoped>
.paw-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.paw {
  position: absolute;
  mask-image: url('/reminder-icons/dino-paw.svg');
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-image: url('/reminder-icons/dino-paw.svg');
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
}
</style>
