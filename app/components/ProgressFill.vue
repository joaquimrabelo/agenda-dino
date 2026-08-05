<template>
  <div class="progress-track">
    <div class="progress-fill" :style="{ width: `${Math.round(progress * 100)}%` }" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ progress: number }>()
</script>

<style scoped>
.progress-track {
  position: relative;
  z-index: 1;
  width: min(80vw, 500px);
  height: 22px;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.35);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 11px;
  transition: width 1s linear;
}
</style>
