'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { formatWeekDisplay, isCurrentWeek } from '@/utils/date-helpers'

interface WeekNavigatorProps {
  year: number
  week: number
  onPreviousWeek: () => void
  onNextWeek: () => void
  onCurrentWeek: () => void
}

export function WeekNavigator({ year, week, onPreviousWeek, onNextWeek, onCurrentWeek }: WeekNavigatorProps) {
  const isCurrent = isCurrentWeek(year, week)

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onPreviousWeek} aria-label="Semana anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="text-center min-w-[200px]">
          <h2 className="text-lg font-semibold">{formatWeekDisplay(year, week, 'short')}</h2>
          <p className="text-sm text-muted-foreground">{formatWeekDisplay(year, week, 'long')}</p>
        </div>

        <Button variant="outline" size="icon" onClick={onNextWeek} aria-label="Próxima semana">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {!isCurrent && (
        <Button variant="outline" size="sm" onClick={onCurrentWeek} className="gap-2">
          <Calendar className="h-4 w-4" />
          Semana Atual
        </Button>
      )}
    </div>
  )
}
