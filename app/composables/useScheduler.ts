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

// Dev-only clock offset (ms) so the app clock can be fast-forwarded from the
// console without touching the system clock. Applied on top of Date.now().
const timeOffsetMs = ref(0)

function currentNow() {
  return new Date(Date.now() + timeOffsetMs.value)
}

function setupDevTimeTravel() {
  if (!import.meta.dev || typeof window === 'undefined') return
  const w = window as any
  if (w.__dino) return // already installed

  w.__dino = {
    // Jump the clock to a given HH:mm today (e.g. __dino.setTime('11:29'))
    setTime(hm: string) {
      const [h, m] = hm.split(':').map(Number)
      const target = new Date()
      target.setHours(h, m, 0, 0)
      timeOffsetMs.value = target.getTime() - Date.now()
      now.value = currentNow()
      console.log(`[dino] clock set to ${hm} ->`, now.value.toLocaleTimeString())
    },
    // Fast-forward (or rewind with a negative value) by N minutes
    addMinutes(n: number) {
      timeOffsetMs.value += n * 60 * 1000
      now.value = currentNow()
      console.log(`[dino] clock advanced ${n}min ->`, now.value.toLocaleTimeString())
    },
    // Back to the real system clock
    resetTime() {
      timeOffsetMs.value = 0
      now.value = currentNow()
      console.log('[dino] clock reset to system time ->', now.value.toLocaleTimeString())
    },
    // Inspect current simulated time
    now() {
      console.log('[dino] simulated time:', currentNow().toLocaleTimeString())
      return currentNow()
    },
    // Start the routine (as if Play was pressed), optionally backdating R to HH:mm
    play(hm?: string) {
      started.value = true
      if (hm) {
        const [h, m] = hm.split(':').map(Number)
        const target = new Date(currentNow())
        target.setHours(h, m, 0, 0)
        referenceTime.value = target
      } else {
        referenceTime.value = currentNow()
      }
      console.log('[dino] play pressed, R =', referenceTime.value?.toLocaleTimeString())
    },
    // Change R (the Play reference time) without touching started/current clock
    setPlayTime(hm: string) {
      const [h, m] = hm.split(':').map(Number)
      const target = new Date(currentNow())
      target.setHours(h, m, 0, 0)
      referenceTime.value = target
      console.log('[dino] R set to', referenceTime.value.toLocaleTimeString())
    }
  }
  console.log(
    '[dino] time travel enabled: __dino.setTime("HH:mm"), __dino.addMinutes(n), __dino.resetTime(), __dino.now(), __dino.play("HH:mm"?), __dino.setPlayTime("HH:mm")'
  )
}

export function useScheduler() {
  let timer: ReturnType<typeof setInterval> | undefined

  onMounted(() => {
    setupDevTimeTravel()
    timer = setInterval(() => {
      now.value = currentNow()
    }, 1000)
  })

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
  })

  function start() {
    started.value = true
    referenceTime.value = currentNow()
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

    // Array order in `recurringReminders` sets priority: earlier entries win when occurrences coincide.
    // Intervalo's 120min interval is the LCM of Hidratação's 40min and Banheiro's 60min, so all three
    // naturally realign every 2h from R — Intervalo (listed first) wins that tick and covers both.
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
