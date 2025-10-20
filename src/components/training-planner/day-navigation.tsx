'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getPreviousDay, getNextDay, getDayName, getDateForDay } from '@/utils/date-helpers'

interface DayNavigationProps {
  year: number
  week: number
  dayOfWeek: number
}

export function DayNavigation({ year, week, dayOfWeek }: DayNavigationProps) {
  const router = useRouter()

  const prevDay = getPreviousDay(year, week, dayOfWeek)
  const nextDay = getNextDay(year, week, dayOfWeek)

  // Get actual dates for formatting
  const currentDate = getDateForDay(year, week, dayOfWeek)
  const prevDate = getDateForDay(prevDay.year, prevDay.week, prevDay.dayOfWeek)
  const nextDate = getDateForDay(nextDay.year, nextDay.week, nextDay.dayOfWeek)

  // Format as "DayName - DD/MM"
  const formatDayDate = (date: Date, dayOfWeek: number) => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return `${getDayName(dayOfWeek)} - ${day}/${month}`
  }

  const currentDayFormatted = formatDayDate(currentDate, dayOfWeek)
  const prevDayFormatted = formatDayDate(prevDate, prevDay.dayOfWeek)
  const nextDayFormatted = formatDayDate(nextDate, nextDay.dayOfWeek)

  const handlePreviousDay = () => {
    router.push(`/dashboard/weekly-planning/${prevDay.year}/${prevDay.week}/${prevDay.dayOfWeek}`)
  }

  const handleNextDay = () => {
    router.push(`/dashboard/weekly-planning/${nextDay.year}/${nextDay.week}/${nextDay.dayOfWeek}`)
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <Button variant="outline" size="sm" onClick={handlePreviousDay} className="gap-2">
        <ChevronLeft className="h-4 w-4" />
        {prevDayFormatted}
      </Button>

      <div className="px-4 py-2 text-lg font-semibold text-foreground">{currentDayFormatted}</div>

      <Button variant="outline" size="sm" onClick={handleNextDay} className="gap-2">
        {nextDayFormatted}
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
