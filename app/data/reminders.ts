export interface RecurringReminder {
  id: 'hidratacao' | 'banheiro' | 'intervalo'
  label: string
  icon: string
  /** When set, the alert screen renders this composition of icons centered instead of the single `icon`. */
  icons?: string[]
  color: string
  intervalMinutes: number
  durationSeconds: number
}

// Order defines priority when occurrences coincide: earlier entries win.
export const recurringReminders: RecurringReminder[] = [
  {
    id: 'intervalo',
    label: 'Intervalo',
    icon: '/reminder-icons/cadeira-descanso.png',
    icons: ['/reminder-icons/water-bottle.svg', '/reminder-icons/water-toilet.svg', '/reminder-icons/cadeira-descanso.png'],
    color: 'rgb(34, 197, 94)',
    intervalMinutes: 120,
    durationSeconds: 300
  },
  { id: 'banheiro', label: 'Banheiro', icon: '/reminder-icons/water-toilet.svg', color: '#22C55E', intervalMinutes: 60, durationSeconds: 180 },
  { id: 'hidratacao', label: 'Pausa para hidratação', icon: '/reminder-icons/water-bottle.svg', color: '#3B82F6', intervalMinutes: 40, durationSeconds: 90 }
]

export interface FixedReminder {
  id: string
  label: string
  icon: string
  color: string
  start: string // 'HH:mm'
  end: string | null // 'HH:mm' or null = no end
}

export const fixedReminders: FixedReminder[] = [
  { id: 'cafe-da-manha', label: 'Café da manhã', icon: '/reminder-icons/cafe.webp', color: '#F97316', start: '07:00', end: '08:00' },
  { id: 'almoco', label: 'Almoço', icon: '/reminder-icons/plate.svg', color: '#F97316', start: '11:20', end: '12:00' },
  { id: 'soneca', label: 'Soneca', icon: '/reminder-icons/bed.svg', color: '#A855F7', start: '12:00', end: '13:30' },
  { id: 'lanche', label: 'Lanche', icon: '/reminder-icons/cesto-frutas.png', color: '#EAB308', start: '15:30', end: '15:50' },
  { id: 'banho', label: 'Banho', icon: '/reminder-icons/chuveiro.png', color: '#06B6D4', start: '18:00', end: '18:15' },
  { id: 'jantar', label: 'Jantar', icon: '/reminder-icons/plate.svg', color: '#F97316', start: '18:15', end: '18:45' },
  { id: 'dormir', label: 'Dormir', icon: '/reminder-icons/bed.svg', color: '#A855F7', start: '19:30', end: null }
]

// R (Play reference time) checkpoints: if R is still earlier than a checkpoint when that
// checkpoint's clock time arrives, R snaps forward to it — once, in chronological order.
export const RESET_CHECKPOINTS = ['08:00', '13:30']
export const BLACKOUT_WINDOW = { start: '11:30', end: '14:00' }
export const RECURRING_STOP_TIME = '18:00'
