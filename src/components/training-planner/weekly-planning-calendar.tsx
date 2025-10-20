'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DayCard } from './day-card'
import { WeekNavigator } from './week-navigator'
import { ItemSelector } from './item-selector'
import { WeeklyPlanData, addItemToDay, removeItemFromDay } from '@/app/dashboard/weekly-planning/actions'
import { Module } from '@/lib/contentful/modules-delivery'
import { Exercise } from '@/lib/contentful/exercises-delivery'
import {
  getDayName,
  getDateForDay,
  formatShortDate,
  getCurrentWeek,
  getPreviousWeek,
  getNextWeek,
} from '@/utils/date-helpers'

interface WeeklyPlanningCalendarProps {
  initialYear: number
  initialWeek: number
  weeklyPlanData: WeeklyPlanData
  availableModules: Module[]
  availableExercises: Exercise[]
}

export function WeeklyPlanningCalendar({
  initialYear,
  initialWeek,
  weeklyPlanData,
  availableModules,
  availableExercises,
}: WeeklyPlanningCalendarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [isItemSelectorOpen, setIsItemSelectorOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const year = initialYear
  const week = initialWeek

  // Group items by day (only weekdays: Monday-Friday)
  const itemsByDay: Record<number, typeof weeklyPlanData.items> = {}
  for (let i = 1; i <= 5; i++) {
    itemsByDay[i] = weeklyPlanData.items.filter((m) => m.day_of_week === i)
  }

  // Get current date for highlighting today (only for weekdays)
  const currentWeek = getCurrentWeek()
  const isCurrentWeek = currentWeek.year === year && currentWeek.week === week
  const currentDay = new Date().getDay() || 7
  const today = isCurrentWeek && currentDay <= 5 ? currentDay : null

  const handlePreviousWeek = () => {
    const prev = getPreviousWeek(year, week)
    navigateToWeek(prev.year, prev.week)
  }

  const handleNextWeek = () => {
    const next = getNextWeek(year, week)
    navigateToWeek(next.year, next.week)
  }

  const handleCurrentWeek = () => {
    const current = getCurrentWeek()
    navigateToWeek(current.year, current.week)
  }

  const navigateToWeek = (newYear: number, newWeek: number) => {
    router.push(`/dashboard/weekly-planning?year=${newYear}&week=${newWeek}`)
  }

  const handleAddItem = (dayOfWeek: number) => {
    setSelectedDay(dayOfWeek)
    setIsItemSelectorOpen(true)
  }

  const handleSelectItem = async (itemExternalId: string, itemType: 'module' | 'exercise') => {
    if (selectedDay === null) return

    startTransition(async () => {
      const result = await addItemToDay(year, week, itemExternalId, itemType, selectedDay)

      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Erro ao adicionar item')
      }
    })
  }

  const handleRemoveItem = async (itemId: string) => {
    startTransition(async () => {
      const result = await removeItemFromDay(itemId)

      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Erro ao remover item')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Week Navigator */}
      <WeekNavigator
        year={year}
        week={week}
        onPreviousWeek={handlePreviousWeek}
        onNextWeek={handleNextWeek}
        onCurrentWeek={handleCurrentWeek}
      />

      {/* Calendar Grid - Only weekdays (Monday-Friday) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((dayOfWeek) => {
          const date = getDateForDay(year, week, dayOfWeek)
          const isToday = today === dayOfWeek

          return (
            <DayCard
              key={dayOfWeek}
              dayName={getDayName(dayOfWeek)}
              date={formatShortDate(date)}
              dayOfWeek={dayOfWeek}
              year={year}
              week={week}
              items={itemsByDay[dayOfWeek] || []}
              onAddItem={() => handleAddItem(dayOfWeek)}
              onRemoveItem={handleRemoveItem}
              isToday={isToday}
            />
          )
        })}
      </div>

      {/* Item Selector Dialog */}
      <ItemSelector
        isOpen={isItemSelectorOpen}
        onClose={() => {
          setIsItemSelectorOpen(false)
          setSelectedDay(null)
        }}
        onSelectItem={handleSelectItem}
        availableModules={availableModules}
        availableExercises={availableExercises}
      />

      {/* Loading overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
          <div className="bg-background rounded-lg p-4 shadow-lg">
            <p className="text-sm">A processar...</p>
          </div>
        </div>
      )}
    </div>
  )
}
