import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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

// If Hidratação and Banheiro occurrences land at (or within) this many minutes of each
// other, an Intervalo fires instead of the individual reminders, and the reference time
// resets to now (as if Play had just been pressed again).
const COINCIDENCE_WINDOW_MINUTES = 10
let lastCoincidenceKey: string | null = null
let coincidenceWatcherInitialized = false

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

  // When Hidratação and Banheiro occurrences land at the same moment or within
  // COINCIDENCE_WINDOW_MINUTES of each other, an Intervalo fires instead of them.
  const coincidence = computed(() => {
    if (!effectiveReference.value) return null

    const hidratacao = recurringReminders.find(r => r.id === 'hidratacao')
    const banheiro = recurringReminders.find(r => r.id === 'banheiro')
    const intervalo = recurringReminders.find(r => r.id === 'intervalo')
    if (!hidratacao || !banheiro || !intervalo) return null

    const current = now.value
    const elapsedMs = current.getTime() - effectiveReference.value.getTime()
    if (elapsedMs < 0) return null

    const hidIntervalMs = hidratacao.intervalMinutes * 60 * 1000
    const banIntervalMs = banheiro.intervalMinutes * 60 * 1000

    const hidOccurrence = Math.floor(elapsedMs / hidIntervalMs) * hidIntervalMs
    const banOccurrence = Math.floor(elapsedMs / banIntervalMs) * banIntervalMs

    const hidActive =
      elapsedMs >= hidIntervalMs &&
      current.getTime() < effectiveReference.value.getTime() + hidOccurrence + hidratacao.durationSeconds * 1000
    const banActive =
      elapsedMs >= banIntervalMs &&
      current.getTime() < effectiveReference.value.getTime() + banOccurrence + banheiro.durationSeconds * 1000

    if (!hidActive && !banActive) return null

    const diffMs = Math.abs(hidOccurrence - banOccurrence)
    if (diffMs > COINCIDENCE_WINDOW_MINUTES * 60 * 1000) return null

    const occurrenceStart = effectiveReference.value.getTime() + Math.min(hidOccurrence, banOccurrence)
    return {
      reminder: intervalo,
      occurrenceStart,
      key: `${hidOccurrence}-${banOccurrence}`
    }
  })

  if (!coincidenceWatcherInitialized) {
    coincidenceWatcherInitialized = true
    watch(coincidence, val => {
      if (val && val.key !== lastCoincidenceKey) {
        lastCoincidenceKey = val.key
        referenceTime.value = new Date()
      }
    })
  }

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

    // Hidratação/Banheiro coincidence overrides both with an Intervalo.
    if (coincidence.value) {
      const { reminder, occurrenceStart } = coincidence.value
      const elapsedInOccurrence = current.getTime() - occurrenceStart
      return {
        kind: 'recurring',
        reminder,
        progress: Math.min(1, elapsedInOccurrence / (reminder.durationSeconds * 1000)),
        occurrenceStart
      }
    }

    // Array order in `recurringReminders` sets priority: earlier entries win when occurrences coincide.
    for (const reminder of recurringReminders) {
      const intervalMs = reminder.intervalMinutes * 60 * 1000
      const occurrence = Math.floor(elapsedMs / intervalMs) * intervalMs
      const occurrenceStart = effectiveReference.value.getTime() + occurrence
      const active =
        elapsedMs >= intervalMs && current.getTime() < occurrenceStart + reminder.durationSeconds * 1000

      if (active) {
        const elapsedInOccurrence = current.getTime() - occurrenceStart
        return {
          kind: 'recurring',
          reminder,
          progress: Math.min(1, elapsedInOccurrence / (reminder.durationSeconds * 1000)),
          occurrenceStart
        }
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
