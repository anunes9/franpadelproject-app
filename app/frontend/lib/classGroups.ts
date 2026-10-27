import type { useTranslation } from '@/i18n/useTranslation'
import type { Level, Weekday } from '../types/dashboard-data'

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

// A group's name: the Coach's own, or else its Level.
export function groupName(t: Translate, group: { name: string | null; level: Level }) {
  return group.name || t(`players.levelOption.${group.level}`)
}

// "18:00" plus `minutes`, as "HH:MM" on the same day.
export function addMinutes(time: string, minutes: number) {
  const [hours, mins] = time.split(':').map(Number)
  const total = hours * 60 + mins + minutes
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`
}

// ISO dates (YYYY-MM-DD) as calendar days, read and written in UTC so no
// time zone shifts them.
const dayOf = (iso: string) => new Date(`${iso}T00:00:00Z`)
const isoOf = (date: Date) => date.toISOString().slice(0, 10)
const intlLocale = (locale: string) => (locale === 'pt' ? 'pt-PT' : 'en-GB')

export function addDays(iso: string, days: number) {
  const date = dayOf(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return isoOf(date)
}

// 0 for Monday to 6 for Sunday.
export function weekdayIndex(iso: string) {
  return (dayOf(iso).getUTCDay() + 6) % 7
}

// The Monday of the week holding `iso`.
export function mondayOf(iso: string) {
  return addDays(iso, -weekdayIndex(iso))
}

// "26/10"
export function formatDayMonth(iso: string) {
  const date = dayOf(iso)
  return `${date.getUTCDate()}/${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

// "Mon, 26/10"
export function formatShortDay(iso: string, t: Translate) {
  return `${t(`classGroups.weekdayShort.${WEEKDAY_ORDER[weekdayIndex(iso)]}`)}, ${formatDayMonth(iso)}`
}

// "Monday, 26 October", capitalised.
export function formatLongDay(iso: string, locale: string) {
  const text = new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(dayOf(iso))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// The short weekday names, Monday first: "Mon" … "Sun".
export function weekdayNames(t: Translate) {
  return WEEKDAY_ORDER.map((day) => t(`classGroups.weekdayShort.${day}`))
}

// "October 2026", capitalised, for a month given as "YYYY-MM".
export function formatMonth(month: string, locale: string) {
  const text = new Intl.DateTimeFormat(intlLocale(locale), { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    dayOf(`${month}-01`)
  )
  return text.charAt(0).toUpperCase() + text.slice(1)
}
