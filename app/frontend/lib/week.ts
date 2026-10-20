import type { TranslationKey } from '@/i18n/translations'

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type DayKey = (typeof DAY_KEYS)[number]

/** Monday-to-Sunday dates of the week containing `now`. */
export function weekOf(now: Date): Date[] {
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  return DAY_KEYS.map((_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/** "MON" → "Mon"; the short day strings in translations are upper-case. */
export const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase()

/** "Monday" → translation key of the long day name. */
export const LONG_DAY_KEY: Record<string, TranslationKey> = {
  Monday: 'common.days.long.monday',
  Tuesday: 'common.days.long.tuesday',
  Wednesday: 'common.days.long.wednesday',
  Thursday: 'common.days.long.thursday',
  Friday: 'common.days.long.friday',
  Saturday: 'common.days.long.saturday',
  Sunday: 'common.days.long.sunday',
}
