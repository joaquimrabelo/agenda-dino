<template>
  <div class="screen idle-screen">
    <PawBackground />
    <DinoBadge />
    <span v-if="testMode" class="test-badge">Evento teste</span>
    <div class="clock">{{ time }}</div>
    <div class="deco-grid">
      <img src="/reminder-icons/bola.png" alt="" />
      <img src="/reminder-icons/pintor.png" alt="" />
      <img src="/reminder-icons/quebra-cabeca.png" alt="" />
      <img src="/reminder-icons/meninos-bola.png" alt="" />
    </div>

    <button v-if="testMode" class="back-button" @click="$emit('back')">
      Voltar
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ now: Date; testMode?: boolean }>(),
  { testMode: false }
)

defineEmits<{ back: [] }>()

const time = computed(() =>
  props.now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
)
</script>

<style scoped>
.idle-screen {
  background: #5EA8E8;
  color: #fff;
  gap: 40px;
}

.clock {
  position: relative;
  z-index: 1;
  font-size: 6rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
}

.deco-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, 90px);
  grid-template-rows: repeat(2, 90px);
  gap: 16px;
}

.deco-grid img {
  width: 90px;
  height: 90px;
  object-fit: contain;
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
