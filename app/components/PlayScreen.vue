<template>
  <div class="screen play-screen">
    <PawBackground />
    <button class="play-button" @click="$emit('play')">▶</button>
    <img src="/reminder-icons/dino-play.png" alt="Agenda Dino" class="play-logo" />

    <button class="clock-button" aria-label="Testar eventos" @click="showList = !showList">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="13" r="8" stroke="currentColor" stroke-width="2" />
        <path d="M12 9v4l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M9 2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </button>

    <Teleport to="body">
      <div v-if="showList" class="event-list-overlay" @click.self="showList = false">
        <div class="event-list">
          <p class="event-list-title">Testar evento</p>
          <button
            v-for="item in events"
            :key="`${item.kind}-${item.reminder.id}`"
            class="event-list-item"
            :style="{ background: item.reminder.color }"
            @click="selectEvent(item)"
          >
            <img :src="item.reminder.icon" :alt="item.reminder.label" />
            <span>{{ item.reminder.label }}</span>
          </button>

          <button class="event-list-item event-list-item-idle" @click="selectIdle">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="13" r="8" stroke="currentColor" stroke-width="2" />
              <path d="M12 9v4l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M9 2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            <span>Tela do relógio</span>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { fixedReminders, recurringReminders, type FixedReminder, type RecurringReminder } from '~/data/reminders'

type EventItem =
  | { kind: 'fixed'; reminder: FixedReminder }
  | { kind: 'recurring'; reminder: RecurringReminder }

type TestSelection = EventItem | { kind: 'idle' }

const emit = defineEmits<{ play: []; test: [event: TestSelection] }>()

const showList = ref(false)

const events: EventItem[] = [
  ...fixedReminders.map(reminder => ({ kind: 'fixed' as const, reminder })),
  ...recurringReminders.map(reminder => ({ kind: 'recurring' as const, reminder }))
]

function selectEvent(item: EventItem) {
  showList.value = false
  emit('test', item)
}

function selectIdle() {
  showList.value = false
  emit('test', { kind: 'idle' })
}
</script>

<style scoped>
.play-screen {
  background: #1E293B;
  color: #fff;
  gap: 32px;
  padding-bottom: 50vh;
}

.play-logo {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  height: 50vh;
  width: auto;
  z-index: 1;
}

.play-button {
  position: relative;
  z-index: 1;
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

.clock-button {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
}

.clock-button svg {
  width: 28px;
  height: 28px;
}

.event-list-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 24px;
  z-index: 20;
}

.event-list {
  background: #fff;
  color: #1E293B;
  border-radius: 16px;
  padding: 16px;
  width: 260px;
  max-height: 60vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-list-title {
  margin: 0 0 4px;
  font-weight: 700;
  font-size: 0.95rem;
  opacity: 0.7;
}

.event-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  border: none;
  border-radius: 10px;
  padding: 10px 12px;
  cursor: pointer;
  font-size: 1rem;
  text-align: left;
  color: #fff;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}

.event-list-item-idle {
  background: #1E293B;
  margin-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding-top: 10px;
}

.event-list-item-idle svg {
  width: 24px;
  height: 24px;
}

.event-list-item:active {
  transform: scale(0.98);
}

.event-list-item img {
  width: 28px;
  height: 28px;
}
</style>
