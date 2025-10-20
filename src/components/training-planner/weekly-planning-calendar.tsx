'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DayCard } from './day-card'
import { WeekNavigator } from './week-navigator'
import { ModuleSelector } from './module-selector'
import { WeeklyPlanData, addModuleToDay, removeModuleFromDay } from '@/app/dashboard/weekly-planning/actions'
import { Module } from '@/lib/contentful/modules-delivery'
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
}

export function WeeklyPlanningCalendar({
  initialYear,
  initialWeek,
  weeklyPlanData,
  availableModules,
}: WeeklyPlanningCalendarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [isModuleSelectorOpen, setIsModuleSelectorOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const year = initialYear
  const week = initialWeek

  // Group modules by day
  const modulesByDay: Record<number, typeof weeklyPlanData.modules> = {}
  for (let i = 1; i <= 7; i++) {
    modulesByDay[i] = weeklyPlanData.modules.filter((m) => m.day_of_week === i)
  }

  // Get current date for highlighting today
  const currentWeek = getCurrentWeek()
  const isCurrentWeek = currentWeek.year === year && currentWeek.week === week
  const today = isCurrentWeek ? new Date().getDay() || 7 : null

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

  const handleAddModule = (dayOfWeek: number) => {
    setSelectedDay(dayOfWeek)
    setIsModuleSelectorOpen(true)
  }

  const handleSelectModule = async (moduleExternalId: string) => {
    if (selectedDay === null) return

    startTransition(async () => {
      const result = await addModuleToDay(year, week, moduleExternalId, selectedDay)

      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Erro ao adicionar módulo')
      }
    })
  }

  const handleRemoveModule = async (moduleId: string) => {
    startTransition(async () => {
      const result = await removeModuleFromDay(moduleId)

      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Erro ao remover módulo')
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

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => {
          const date = getDateForDay(year, week, dayOfWeek)
          const isToday = today === dayOfWeek

          return (
            <DayCard
              key={dayOfWeek}
              dayName={getDayName(dayOfWeek)}
              date={formatShortDate(date)}
              dayOfWeek={dayOfWeek}
              modules={modulesByDay[dayOfWeek] || []}
              onAddModule={() => handleAddModule(dayOfWeek)}
              onRemoveModule={handleRemoveModule}
              isToday={isToday}
            />
          )
        })}
      </div>

      {/* Module Selector Dialog */}
      <ModuleSelector
        isOpen={isModuleSelectorOpen}
        onClose={() => {
          setIsModuleSelectorOpen(false)
          setSelectedDay(null)
        }}
        onSelectModule={handleSelectModule}
        availableModules={availableModules}
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
