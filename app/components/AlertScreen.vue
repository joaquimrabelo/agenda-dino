<template>
  <div class="screen alert-screen" :style="{ background: color }">
    <DinoBadge />
    <img :src="icon" :alt="label" class="alert-icon" />
    <p class="alert-label">{{ label }}</p>
    <ProgressFill v-if="progress !== null" :progress="progress" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

defineProps<{
  label: string
  icon: string
  color: string
  progress: number | null
}>()

onMounted(() => {
  const audio = new Audio('/sounds/alert.wav')
  audio.play().catch(() => {})
})
</script>

<style scoped>
.alert-screen {
  color: #fff;
  gap: 24px;
}

.alert-icon {
  width: 40vh;
  height: 40vh;
  max-width: 320px;
  max-height: 320px;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2));
}

.alert-label {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
}
</style>
