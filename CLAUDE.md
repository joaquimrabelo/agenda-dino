# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

The Nuxt 3 app is implemented and live under `app/`. There is no separate spec document — `app/data/reminders.ts` and `app/composables/useScheduler.ts` are the source of truth for behavior, data shapes, and timing. Read both in full before making changes to scheduling logic.

## Commands

- Package manager is **npm only** — never use yarn or pnpm (no corresponding lockfiles should be created).
- Standard Nuxt 3 commands apply: `npm install`, `npm run dev`, `npm run build`, `npm run generate`.

## What this app is

"Agenda Dino" is a **backend-less PWA** (Nuxt 3 + Vue 3 Composition API) that acts as a passive, full-screen visual/audio reminder panel for a 3-year-old's daily routine (hydration, bathroom breaks, meals, nap). It is not interactive for the child — a caregiver presses Play once in the morning, and the app runs unattended for the rest of the day. Closing or reloading the page resets all state; there is no persistence, no backend, no config screen, and no auth.

## Core architecture: the scheduling engine

The most important — and most error-prone — part of this app is the reminder scheduling logic in `app/composables/useScheduler.ts` (the `active` computed). Any change touching timing must preserve this exact priority order, evaluated on every clock tick:

1. Routine not started → Play screen
2. Current time falls in a **fixed reminder** window (`app/data/reminders.ts` → `fixedReminders`: Café da manhã, Almoço, Soneca, Lanche, Banho, Jantar, Dormir — fixed by wall-clock time, independent of when Play was pressed) → show that reminder
3. Current time is in the **blackout window** (11:30–14:00) or after **18:00** (`RECURRING_STOP_TIME`) → Idle
4. Otherwise, compute **recurring reminders** (`recurringReminders`: Hidratação every 40min, Banheiro every 60min, Intervalo every 120min) from reference time `R` — array order sets priority when occurrences coincide

Key rules that are easy to get wrong:
- `R` (reference time) is set when Play is pressed. It snaps forward to each checkpoint in `RESET_CHECKPOINTS` (`app/data/reminders.ts`, currently `08:00` then `13:30`) in chronological order, the moment that checkpoint's clock time arrives, but only if `R` hasn't already reached it — e.g. Play at 07:00 snaps `R` to 08:00, then again to 13:30. Play pressed after a checkpoint leaves `R` untouched at that checkpoint.
- Recurring reminders never fire during the 11:30–14:00 blackout, and stop permanently after 18:00 (`recurringStopped` is checked explicitly, not just as a side effect of fixed-reminder priority).
- Recurring occurrence math is derived from elapsed time since `R` (`floor(elapsed / interval) * interval`) per reminder, not from ticking counters, so it stays correct regardless of tick frequency.
- `intervalo`'s 120min interval is the LCM of `hidratacao`'s 40min and `banheiro`'s 60min, so all three naturally realign every 2h from `R`. Because `intervalo` is listed **first** in `recurringReminders`, the priority loop returns it on that tick and implicitly covers/suppresses the other two — no extra coincidence detection or `R`-mutation is needed. (An earlier version tried to detect this coincidence separately and reset `R` as a side effect; that reset happened within the same reactive tick the coincidence was computed, immediately zeroing elapsed time and cancelling the very state it had just set — so Intervalo never rendered. Don't reintroduce that pattern.)
- Reminder definitions (recurring and fixed) live in the typed `RecurringReminder`/`FixedReminder` structures in `app/data/reminders.ts`, not scattered as magic time strings through the logic.

### Testing timing via console (dev only)

`app/composables/useScheduler.ts` installs `window.__dino` in dev mode (`import.meta.dev`) so reminder timing can be tested without waiting in real time:
- `__dino.play("HH:mm"?)` — presses Play, optionally backdating `R` to that time (omit to use the current simulated time)
- `__dino.setPlayTime("HH:mm")` — changes `R` without touching `started` or the clock
- `__dino.setTime("HH:mm")` — jumps the simulated clock to that time today
- `__dino.addMinutes(n)` — fast-forwards (or rewinds, negative `n`) by N minutes
- `__dino.resetTime()` — returns to the real system clock
- `__dino.now()` — logs and returns the current simulated time

These work by offsetting `Date.now()` (`timeOffsetMs`), not by monkey-patching the global `Date`, and the 1s ticking timer keeps advancing from that offset.

## PWA requirements

- Wake Lock (`navigator.wakeLock.request('screen')`) must be requested on Play press and re-requested on `visibilitychange` if released by the system.
- Service worker (via `@vite-pwa/nuxt`) must cache all static assets (SVGs, sounds, fonts) for offline use after first load.
- Reminder images are SVG; sound is a single sound effect per alert (no recorded voice).

## Visual conventions

- No animated/interactive mascot — the dino theme is limited to the PWA icon and a small static badge (paw icon + "Agenda Dino" wordmark) in the corner of Idle/Alert screens.
- Idle screen: solid light-blue background, large centered digital clock.
- Alert screens: solid vibrant color per reminder type (colors defined in `app/data/reminders.ts`), large centered SVG icon, "filling" progress bar for recurring reminders (optional for fixed ones).
- Flat solid colors only — no gradients — for high contrast at a distance (designed for a fixed tablet).
