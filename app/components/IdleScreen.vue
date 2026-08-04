<template>
  <div class="screen idle-screen">
    <DinoBadge />
    <div class="clock">{{ time }}</div>
    <div class="deco">
      <img src="/reminder-icons/dino-paw.svg" alt="" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ now: Date }>()

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
  font-size: 6rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
}

.deco {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.deco img {
  width: 48px;
  height: 48px;
}
</style>
