<template>
  <div class="screen alert-screen" :style="{ background: color }">
    <PawBackground />
    <DinoBadge />
    <span v-if="testMode" class="test-badge">Evento teste</span>
    <div v-if="icons && icons.length" class="alert-icon-composition">
      <img v-for="src in icons" :key="src" :src="src" :alt="label" class="alert-icon-composition-item" />
    </div>
    <img v-else :src="icon" :alt="label" class="alert-icon" />
    <p class="alert-label">{{ label }}</p>
    <ProgressFill v-if="progress !== null" :progress="progress" />

    <button v-if="testMode" class="back-button" @click="$emit('back')">
      Voltar
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

withDefaults(
  defineProps<{
    label: string
    icon: string
    icons?: string[]
    color: string
    progress: number | null
    testMode?: boolean
  }>(),
  { testMode: false }
)

defineEmits<{ back: [] }>()

const { play: playLoud } = useLoudAudio()

onMounted(() => {
  playLoud('/sounds/alerta-lembrete.wav')
})
</script>

<style scoped>
.alert-screen {
  color: #fff;
  gap: 24px;
}

.alert-icon {
  position: relative;
  z-index: 1;
  width: 40vh;
  height: 40vh;
  max-width: 320px;
  max-height: 320px;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2));
}

.alert-icon-composition {
  position: relative;
  z-index: 1;
  width: 40vh;
  height: 40vh;
  max-width: 320px;
  max-height: 320px;
}

.alert-icon-composition-item {
  position: absolute;
  height: 42%;
  width: auto;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2));
}

.alert-icon-composition-item:nth-child(1) {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
}

.alert-icon-composition-item:nth-child(2) {
  bottom: 0;
  left: 0;
}

.alert-icon-composition-item:nth-child(3) {
  bottom: 0;
  right: 0;
}

.alert-label {
  position: relative;
  z-index: 1;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
}

.test-badge {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 1;
  background: rgba(0, 0, 0, 0.35);
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.back-button {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  border: none;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  padding: 14px 28px;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  z-index: 30;
}

.back-button:active {
  transform: translateX(-50%) scale(0.96);
}
</style>
