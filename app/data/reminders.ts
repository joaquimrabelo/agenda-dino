export interface RecurringReminder {
  id: 'hidratacao' | 'intervalo'
  label: string
  icon: string
  color: string
  intervalMinutes: number
  durationSeconds: number
}

export const recurringReminders: RecurringReminder[] = [
  { id: 'hidratacao', label: 'Pausa para hidratação', icon: '/reminder-icons/water-bottle.svg', color: '#3B82F6', intervalMinutes: 60, durationSeconds: 180 },
  { id: 'intervalo', label: 'Intervalo', icon: '/reminder-icons/water-toilet.svg', color: '#22C55E', intervalMinutes: 120, durationSeconds: 600 }
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
  { id: 'almoco', label: 'Almoço', icon: '/reminder-icons/plate.svg', color: '#F97316', start: '11:30', end: '12:00' },
  { id: 'soneca', label: 'Soneca', icon: '/reminder-icons/bed.svg', color: '#A855F7', start: '12:00', end: '13:30' },
  { id: 'lanche', label: 'Lanche', icon: '/reminder-icons/fruits.svg', color: '#EAB308', start: '15:30', end: '15:40' },
  { id: 'banho', label: 'Banho', icon: '/reminder-icons/shower.svg', color: '#06B6D4', start: '18:00', end: '18:15' },
  { id: 'jantar', label: 'Jantar', icon: '/reminder-icons/plate.svg', color: '#F97316', start: '18:15', end: null }
]

export const RESET_TIME = '14:00'
export const BLACKOUT_WINDOW = { start: '11:30', end: '14:00' }
export const RECURRING_STOP_TIME = '18:00'
