import type { useTranslation } from '@/i18n/useTranslation'
import type { Weekday } from '../types/dashboard-data'

type Translate = ReturnType<typeof useTranslation>['t']

export const WEEKDAY_ORDER: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

// A Class duration in minutes as the academy names it: "1h" or "1h30".
export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, '0')}`
}

// "18:00" plus a duration, as "18:00–19:30". A Class always ends by midnight,
// on its own day.
export function formatTimeRange(startTime: string, minutes: number) {
  const [hours, mins] = startTime.split(':').map(Number)
  const end = hours * 60 + mins + minutes
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${startTime}–${pad(Math.floor(end / 60))}:${pad(end % 60)}`
}

// When a group's Classes are each week: "Tue, Thu · 18:00 · 1h30"
export function formatWeeklyTime(t: Translate, group: { weekdays: Weekday[]; startTime: string; duration: number }) {
  const days = [...group.weekdays]
    .sort((a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b))
    .map((day) => t(`classGroups.weekdayShort.${day}`))
    .join(', ')
  return `${days} · ${group.startTime} · ${formatDuration(group.duration)}`
}

// An ISO date (YYYY-MM-DD) in the Client's language, e.g. "Tue, 8 Sep 2026".
export function formatDate(iso: string, locale: string, withWeekday = true) {
  return new Intl.DateTimeFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', {
    weekday: withWeekday ? 'short' : undefined,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`))
}
