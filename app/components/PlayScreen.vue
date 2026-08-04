<template>
  <div class="screen play-screen">
    <img src="/icons/dino-512.svg" alt="Agenda Dino" class="play-logo" />
    <h1>Agenda Dino</h1>
    <button class="play-button" @click="$emit('play')">▶</button>
  </div>
</template>

<script setup lang="ts">
defineEmits<{ play: [] }>()
</script>

<style scoped>
.play-screen {
  background: #1E293B;
  color: #fff;
  gap: 32px;
}

.play-logo {
  width: 120px;
  height: 120px;
}

h1 {
  font-size: 2.5rem;
  margin: 0;
}

.play-button {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  border: none;
  background: #22C55E;
  color: #fff;
  font-size: 4rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  cursor: pointer;
}

.play-button:active {
  transform: scale(0.96);
}
</style>
