import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  BLACKOUT_WINDOW,
  RECURRING_STOP_TIME,
  RESET_TIME,
  fixedReminders,
  recurringReminders,
  type FixedReminder,
  type RecurringReminder
} from '~/data/reminders'

export type ActiveReminder =
  | { kind: 'play' }
  | { kind: 'idle' }
  | { kind: 'fixed'; reminder: FixedReminder; progress: number | null }
  | { kind: 'recurring'; reminder: RecurringReminder; progress: number; occurrenceStart: number }

function parseHM(hm: string) {
  const [h, m] = hm.split(':').map(Number)
  return { h, m }
}

function todayAt(hm: string, reference: Date) {
  const { h, m } = parseHM(hm)
  const d = new Date(reference)
  d.setHours(h, m, 0, 0)
  return d
}

// Module-level singleton state so every component shares the same routine.
const started = ref(false)
const referenceTime = ref<Date | null>(null)
const now = ref(new Date())

export function useScheduler() {
  let timer: ReturnType<typeof setInterval> | undefined

  onMounted(() => {
    timer = setInterval(() => {
      now.value = new Date()
    }, 1000)
  })

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
  })

  function start() {
    started.value = true
    referenceTime.value = new Date()
  }

  // Reset R to 14:00 exactly once, only if R is still earlier than 14:00.
  const effectiveReference = computed<Date | null>(() => {
    if (!referenceTime.value) return null
    const resetAt = todayAt(RESET_TIME, now.value)
    if (now.value >= resetAt && referenceTime.value < resetAt) {
      return resetAt
    }
    return referenceTime.value
  })

  const active = computed<ActiveReminder>(() => {
    if (!started.value || !effectiveReference.value) {
      return { kind: 'play' }
    }

    const current = now.value

    // 1. Fixed reminders take top priority.
    for (const reminder of fixedReminders) {
      const start = todayAt(reminder.start, current)
      const end = reminder.end ? todayAt(reminder.end, current) : null
      if (current >= start && (!end || current < end)) {
        let progress: number | null = null
        if (end) {
          const total = end.getTime() - start.getTime()
          const elapsed = current.getTime() - start.getTime()
          progress = Math.min(1, Math.max(0, elapsed / total))
        }
        return { kind: 'fixed', reminder, progress }
      }
    }

    // 2. Blackout window and post-18:00 suppress recurring reminders.
    const blackoutStart = todayAt(BLACKOUT_WINDOW.start, current)
    const blackoutEnd = todayAt(BLACKOUT_WINDOW.end, current)
    const recurringStop = todayAt(RECURRING_STOP_TIME, current)
    const inBlackout = current >= blackoutStart && current < blackoutEnd
    const recurringStopped = current >= recurringStop

    if (inBlackout || recurringStopped) {
      return { kind: 'idle' }
    }

    // 3. Recurring reminders, computed from elapsed time since R.
    const elapsedMs = current.getTime() - effectiveReference.value.getTime()
    if (elapsedMs < 0) {
      return { kind: 'idle' }
    }

    const intervalo = recurringReminders.find(r => r.id === 'intervalo')!
    const hidratacao = recurringReminders.find(r => r.id === 'hidratacao')!

    const intervaloIntervalMs = intervalo.intervalMinutes * 60 * 1000
    const hidratacaoIntervalMs = hidratacao.intervalMinutes * 60 * 1000

    const intervaloOccurrence = Math.floor(elapsedMs / intervaloIntervalMs) * intervaloIntervalMs
    const hidratacaoOccurrence = Math.floor(elapsedMs / hidratacaoIntervalMs) * hidratacaoIntervalMs

    const intervaloActive =
      elapsedMs >= intervaloIntervalMs &&
      current.getTime() < effectiveReference.value.getTime() + intervaloOccurrence + intervalo.durationSeconds * 1000

    const hidratacaoActive =
      elapsedMs >= hidratacaoIntervalMs &&
      current.getTime() < effectiveReference.value.getTime() + hidratacaoOccurrence + hidratacao.durationSeconds * 1000

    if (intervaloActive) {
      const occurrenceStart = effectiveReference.value.getTime() + intervaloOccurrence
      const elapsedInOccurrence = current.getTime() - occurrenceStart
      return {
        kind: 'recurring',
        reminder: intervalo,
        progress: Math.min(1, elapsedInOccurrence / (intervalo.durationSeconds * 1000)),
        occurrenceStart
      }
    }

    if (hidratacaoActive) {
      const occurrenceStart = effectiveReference.value.getTime() + hidratacaoOccurrence
      const elapsedInOccurrence = current.getTime() - occurrenceStart
      return {
        kind: 'recurring',
        reminder: hidratacao,
        progress: Math.min(1, elapsedInOccurrence / (hidratacao.durationSeconds * 1000)),
        occurrenceStart
      }
    }

    return { kind: 'idle' }
  })

  return {
    now,
    started,
    referenceTime,
    active,
    start
  }
}
