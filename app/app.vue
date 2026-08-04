<template>
  <div>
    <PlayScreen v-if="active.kind === 'play'" @play="handlePlay" />
    <IdleScreen v-else-if="active.kind === 'idle'" :now="now" />
    <AlertScreen
      v-else-if="active.kind === 'fixed'"
      :key="`fixed-${active.reminder.id}`"
      :label="active.reminder.label"
      :icon="active.reminder.icon"
      :color="active.reminder.color"
      :progress="active.progress"
    />
    <AlertScreen
      v-else-if="active.kind === 'recurring'"
      :key="`recurring-${active.reminder.id}-${active.occurrenceStart}`"
      :label="active.reminder.label"
      :icon="active.reminder.icon"
      :color="active.reminder.color"
      :progress="active.progress"
    />
  </div>
</template>

<script setup lang="ts">
const { now, active, start } = useScheduler()
const { requestWakeLock } = useWakeLock()

function handlePlay() {
  start()
  requestWakeLock()
}
</script>
