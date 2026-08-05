<template>
  <div>
    <IdleScreen v-if="testEvent?.kind === 'idle'" :now="now" test-mode @back="stopTest" />
    <AlertScreen
      v-else-if="testActive"
      :key="`test-${testActive.reminder.id}`"
      :label="testActive.reminder.label"
      :icon="testActive.reminder.icon"
      :icons="testActive.kind === 'recurring' ? testActive.reminder.icons : undefined"
      :color="testActive.reminder.color"
      :progress="testActive.progress"
      test-mode
      @back="stopTest"
    />
    <PlayScreen v-else-if="active.kind === 'play'" @play="handlePlay" @test="startTest" />
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
      :icons="active.reminder.icons"
      :color="active.reminder.color"
      :progress="active.progress"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FixedReminder, RecurringReminder } from '~/data/reminders'

const { now, active, start } = useScheduler()
const { requestWakeLock } = useWakeLock()
const { play: playLoud } = useLoudAudio()

function handlePlay() {
  start()
  requestWakeLock()
  playLoud('/sounds/play-start.wav')
}

type TestEvent =
  | { kind: 'fixed'; reminder: FixedReminder }
  | { kind: 'recurring'; reminder: RecurringReminder }
  | { kind: 'idle' }

const testEvent = ref<TestEvent | null>(null)
const testStartedAt = ref(0)

function startTest(event: TestEvent) {
  testEvent.value = event
  testStartedAt.value = Date.now()
}

function stopTest() {
  testEvent.value = null
}

function parseHMToMinutes(hm: string) {
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + m
}

const testActive = computed(() => {
  if (!testEvent.value || testEvent.value.kind === 'idle') return null
  const { kind, reminder } = testEvent.value
  const elapsedMs = now.value.getTime() - testStartedAt.value

  if (kind === 'fixed') {
    const r = reminder as FixedReminder
    let progress: number | null = null
    if (r.end) {
      const totalMs = (parseHMToMinutes(r.end) - parseHMToMinutes(r.start)) * 60 * 1000
      progress = totalMs > 0 ? Math.min(1, elapsedMs / totalMs) : null
    }
    return { kind, reminder: r, progress }
  }

  const r = reminder as RecurringReminder
  const totalMs = r.durationSeconds * 1000
  return { kind, reminder: r, progress: Math.min(1, elapsedMs / totalMs) }
})
</script>
