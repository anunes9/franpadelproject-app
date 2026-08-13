/**
 * Date and week calculation utilities for Weekly Planning feature
 * Uses ISO 8601 week date system where weeks start on Monday
 */

/**
 * Get the ISO week number for a given date
 * @param date - The date to get the week number for
 * @returns The ISO week number (1-53)
 */
export function getISOWeek(date: Date): number {
  const tempDate = new Date(date.getTime())

  // Set to nearest Thursday (current date + 4 - current day number)
  // Make Sunday's day number 7
  const dayNum = tempDate.getDay() || 7
  tempDate.setDate(tempDate.getDate() + 4 - dayNum)

  // Get first day of year
  const yearStart = new Date(tempDate.getFullYear(), 0, 1)

  // Calculate full weeks to nearest Thursday
  const weekNum = Math.ceil(((tempDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)

  return weekNum
}

/**
 * Get the year for ISO week date system
 * (Week 1 of a year may start in the previous year)
 * @param date - The date to get the ISO year for
 * @returns The ISO year
 */
export function getISOYear(date: Date): number {
  const tempDate = new Date(date.getTime())
  const dayNum = tempDate.getDay() || 7
  tempDate.setDate(tempDate.getDate() + 4 - dayNum)
  return tempDate.getFullYear()
}

/**
 * Get start and end dates for a given ISO week
 * @param year - The ISO year
 * @param week - The ISO week number (1-53)
 * @returns Object with start (Monday) and end (Sunday) dates
 */
export function getWeekDates(year: number, week: number): { start: Date; end: Date } {
  // January 4th is always in week 1
  const jan4 = new Date(year, 0, 4)
  const dayNum = jan4.getDay() || 7

  // Get Monday of week 1
  const week1Monday = new Date(jan4)
  week1Monday.setDate(jan4.getDate() - dayNum + 1)

  // Calculate Monday of target week
  const targetMonday = new Date(week1Monday)
  targetMonday.setDate(week1Monday.getDate() + (week - 1) * 7)

  // Calculate Sunday of target week
  const targetSunday = new Date(targetMonday)
  targetSunday.setDate(targetMonday.getDate() + 6)

  return {
    start: targetMonday,
    end: targetSunday,
  }
}

/**
 * Get the current ISO week and year
 * @returns Object with current year and week number
 */
export function getCurrentWeek(): { year: number; week: number } {
  const now = new Date()
  return {
    year: getISOYear(now),
    week: getISOWeek(now),
  }
}

/**
 * Format week display string
 * @param year - The ISO year
 * @param week - The ISO week number
 * @param format - Display format: 'short' or 'long'
 * @returns Formatted string (e.g., "Week 42, 2025" or "Oct 14 - Oct 20, 2025")
 */
export function formatWeekDisplay(year: number, week: number, format: 'short' | 'long' = 'short'): string {
  if (format === 'short') {
    return `Semana ${week}, ${year}`
  }

  const { start, end } = getWeekDates(year, week)

  const monthFormatter = new Intl.DateTimeFormat('pt-PT', { month: 'short' })
  const dayFormatter = new Intl.DateTimeFormat('pt-PT', { day: 'numeric' })

  const startMonth = monthFormatter.format(start)
  const startDay = dayFormatter.format(start)
  const endMonth = monthFormatter.format(end)
  const endDay = dayFormatter.format(end)

  // If same month, show: "14 - 20 Out, 2025"
  if (start.getMonth() === end.getMonth()) {
    return `${startDay} - ${endDay} ${capitalize(startMonth)}, ${year}`
  }

  // If different months, show: "28 Out - 3 Nov, 2025"
  return `${startDay} ${capitalize(startMonth)} - ${endDay} ${capitalize(endMonth)}, ${year}`
}

/**
 * Get the day name in Portuguese
 * @param dayOfWeek - Day number (1=Monday, 7=Sunday)
 * @returns Day name in Portuguese
 */
export function getDayName(dayOfWeek: number): string {
  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
  return days[dayOfWeek - 1] || ''
}

/**
 * Get the short day name in Portuguese
 * @param dayOfWeek - Day number (1=Monday, 7=Sunday)
 * @returns Short day name in Portuguese
 */
export function getShortDayName(dayOfWeek: number): string {
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  return days[dayOfWeek - 1] || ''
}

/**
 * Get date for a specific day in a week
 * @param year - The ISO year
 * @param week - The ISO week number
 * @param dayOfWeek - Day number (1=Monday, 7=Sunday)
 * @returns The date object for that day
 */
export function getDateForDay(year: number, week: number, dayOfWeek: number): Date {
  const { start } = getWeekDates(year, week)
  const date = new Date(start)
  date.setDate(start.getDate() + (dayOfWeek - 1))
  return date
}

/**
 * Format a date as "DD MMM" (e.g., "14 Out")
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatShortDate(date: Date): string {
  const monthFormatter = new Intl.DateTimeFormat('pt-PT', { month: 'short' })
  const dayFormatter = new Intl.DateTimeFormat('pt-PT', { day: 'numeric' })

  const day = dayFormatter.format(date)
  const month = monthFormatter.format(date)

  return `${day} ${capitalize(month)}`
}

/**
 * Check if a week is the current week
 * @param year - The ISO year
 * @param week - The ISO week number
 * @returns True if it's the current week
 */
export function isCurrentWeek(year: number, week: number): boolean {
  const current = getCurrentWeek()
  return current.year === year && current.week === week
}

/**
 * Get previous week
 * @param year - Current ISO year
 * @param week - Current ISO week number
 * @returns Object with previous week's year and week number
 */
export function getPreviousWeek(year: number, week: number): { year: number; week: number } {
  if (week > 1) {
    return { year, week: week - 1 }
  }

  // Go to last week of previous year
  const lastWeekOfPrevYear = getISOWeek(new Date(year - 1, 11, 28))
  return { year: year - 1, week: lastWeekOfPrevYear }
}

/**
 * Get next week
 * @param year - Current ISO year
 * @param week - Current ISO week number
 * @returns Object with next week's year and week number
 */
export function getNextWeek(year: number, week: number): { year: number; week: number } {
  const lastWeekOfYear = getISOWeek(new Date(year, 11, 28))

  if (week < lastWeekOfYear) {
    return { year, week: week + 1 }
  }

  // Go to first week of next year
  return { year: year + 1, week: 1 }
}

/**
 * Get previous day (handles week boundaries)
 * @param year - Current ISO year
 * @param week - Current ISO week number
 * @param dayOfWeek - Current day of week (1=Monday, 7=Sunday)
 * @returns Object with previous day's year, week, and dayOfWeek
 */
export function getPreviousDay(
  year: number,
  week: number,
  dayOfWeek: number
): { year: number; week: number; dayOfWeek: number } {
  if (dayOfWeek > 1) {
    // Same week, previous day
    return { year, week, dayOfWeek: dayOfWeek - 1 }
  }

  // Go to previous week's last day (Friday for weekdays)
  const prevWeek = getPreviousWeek(year, week)
  return { ...prevWeek, dayOfWeek: 5 } // Friday
}

/**
 * Get next day (handles week boundaries)
 * @param year - Current ISO year
 * @param week - Current ISO week number
 * @param dayOfWeek - Current day of week (1=Monday, 7=Sunday)
 * @returns Object with next day's year, week, and dayOfWeek
 */
export function getNextDay(
  year: number,
  week: number,
  dayOfWeek: number
): { year: number; week: number; dayOfWeek: number } {
  if (dayOfWeek < 5) {
    // Same week, next day (only weekdays)
    return { year, week, dayOfWeek: dayOfWeek + 1 }
  }

  // Go to next week's first day (Monday)
  const nextWeek = getNextWeek(year, week)
  return { ...nextWeek, dayOfWeek: 1 } // Monday
}

/**
 * Format full date in Portuguese
 * @param date - The date to format
 * @returns Formatted string (e.g., "Segunda-feira, 14 de Outubro de 2025")
 */
export function formatFullDate(date: Date): string {
  const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]

  const dayName = dayNames[date.getDay()]
  const day = date.getDate()
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()

  return `${dayName}, ${day} de ${month} de ${year}`
}

/**
 * Helper to capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
