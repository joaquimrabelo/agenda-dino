# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository currently contains only `instructions.md`, the full product/technical spec for the app. No Nuxt project has been scaffolded yet. When starting implementation, scaffold with Nuxt 3 and follow the spec in `instructions.md` exactly — it is the source of truth for behavior, data shapes, and acceptance criteria. Read it in full before making changes to scheduling logic.

## Commands

- Package manager is **npm only** — never use yarn or pnpm (no corresponding lockfiles should be created).
- Once scaffolded, standard Nuxt 3 commands apply: `npm install`, `npm run dev`, `npm run build`, `npm run generate`.

## What this app is

"Agenda Dino" is a **backend-less PWA** (Nuxt 3 + Vue 3 Composition API) that acts as a passive, full-screen visual/audio reminder panel for a 3-year-old's daily routine (hydration, bathroom breaks, meals, nap). It is not interactive for the child — a caregiver presses Play once in the morning, and the app runs unattended for the rest of the day. Closing or reloading the page resets all state; there is no persistence, no backend, no config screen, and no auth (see "Fora do Escopo" in `instructions.md` §8 for the full exclusion list).

## Core architecture: the scheduling engine

The most important — and most error-prone — part of this app is the reminder scheduling logic in `instructions.md` §4. Any change touching timing must preserve this exact priority order, evaluated on every clock tick:

1. Routine not started → Play screen
2. Current time falls in a **fixed reminder** window (§4.4: Almoço, Soneca, Lanche, Banho, Jantar — fixed by wall-clock time, independent of when Play was pressed) → show that reminder
3. Current time is in the **blackout window** (11:30–14:00) or after **18:00** → Idle
4. Otherwise, compute **recurring reminders** (§4.2: Hidratação hourly, Intervalo every 2h) from reference time `R` → Intervalo takes priority over Hidratação when both coincide (every even hour) → else Idle

Key rules that are easy to get wrong:
- `R` (reference time) is set when Play is pressed. At 14:00, if `R` is still before 14:00, it is reset to 14:00 — but only once, and only if it hasn't already passed 14:00.
- Recurring reminders (Hidratação/Intervalo) never fire during the 11:30–14:00 blackout, and stop permanently after 18:00 (implement this as an explicit stop flag, not just as a side effect of fixed-reminder priority).
- Recurring occurrence math should be derived from elapsed time since `R` (`floor(elapsed / interval) * interval`), not from ticking counters, so it stays correct regardless of tick frequency — see the suggested calculation in §4.2.
- Reminder definitions (recurring and fixed) should live in a typed data structure (see §7 for the suggested `RecurringReminder`/`FixedReminder` shapes and constants), not scattered as magic time strings through the logic.

## PWA requirements

- Wake Lock (`navigator.wakeLock.request('screen')`) must be requested on Play press and re-requested on `visibilitychange` if released by the system.
- Service worker (via `@vite-pwa/nuxt`) must cache all static assets (SVGs, sounds, fonts) for offline use after first load.
- Reminder images are SVG; sound is a single sound effect per alert (no recorded voice).

## Visual conventions

- No animated/interactive mascot — the dino theme is limited to the PWA icon and a small static badge (paw icon + "Agenda Dino" wordmark) in the corner of Idle/Alert screens.
- Idle screen: solid light-blue background, large centered digital clock.
- Alert screens: solid vibrant color per reminder type (colors defined in §7's data structures), large centered SVG icon, "filling" progress bar for recurring reminders (optional for fixed ones).
- Flat solid colors only — no gradients — for high contrast at a distance (designed for a fixed tablet).
