'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, BookOpen, Dumbbell } from 'lucide-react'
import { ModuleDetailCard } from './module-detail-card'
import { ExerciseDetailCard } from './exercise-detail-card'
import { DayNavigation } from './day-navigation'
import { ItemSelector } from './item-selector'
import {
  WeeklyPlanItem,
  addItemToDay,
  removeItemFromDay,
  getAvailableModules,
  getAvailableExercises,
} from '@/app/dashboard/weekly-planning/actions'
import { Module } from '@/lib/contentful/modules-delivery'
import { Exercise } from '@/lib/contentful/exercises-delivery'
import { formatFullDate, formatWeekDisplay } from '@/utils/date-helpers'

interface DayDetailViewProps {
  date: Date
  items: WeeklyPlanItem[]
  year: number
  week: number
  dayOfWeek: number
  availableModules: Module[]
  availableExercises: Exercise[]
}

export function DayDetailView({
  date,
  items,
  year,
  week,
  dayOfWeek,
  availableModules,
  availableExercises,
}: DayDetailViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isItemSelectorOpen, setIsItemSelectorOpen] = useState(false)

  // Group items by type
  const modules = items.filter((item) => item.item_type === 'module')
  const exercises = items.filter((item) => item.item_type === 'exercise')

  const handleBack = () => {
    router.push(`/dashboard/weekly-planning?year=${year}&week=${week}`)
  }

  const handleSelectItem = async (itemExternalId: string, itemType: 'module' | 'exercise') => {
    startTransition(async () => {
      const result = await addItemToDay(year, week, itemExternalId, itemType, dayOfWeek)

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
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Calendário
          </Button>
          <h1 className="text-2xl font-bold">{formatFullDate(date)}</h1>
          <p className="text-sm text-muted-foreground mt-1">{formatWeekDisplay(year, week, 'short')}</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {modules.length + exercises.length} {modules.length + exercises.length === 1 ? 'item' : 'itens'}
        </Badge>
      </div>

      {/* Day Navigation */}
      <DayNavigation year={year} week={week} dayOfWeek={dayOfWeek} />

      {/* Modules Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Módulos</h2>
            <Badge variant="outline">{modules.length}</Badge>
          </div>
          <Button size="sm" onClick={() => setIsItemSelectorOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {modules.length > 0 ? (
          <div className="space-y-4">
            {modules.map((item) =>
              item.module ? (
                <ModuleDetailCard key={item.id} module={item.module} onRemove={() => handleRemoveItem(item.id)} />
              ) : (
                <div key={item.id} className="p-4 border rounded-lg text-sm text-muted-foreground">
                  Módulo não encontrado
                </div>
              )
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm mb-3">Nenhum módulo agendado para este dia</p>
            <Button size="sm" variant="outline" onClick={() => setIsItemSelectorOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Módulo
            </Button>
          </div>
        )}
      </div>

      {/* Exercises Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold">Exercícios</h2>
            <Badge variant="outline">{exercises.length}</Badge>
          </div>
          <Button size="sm" onClick={() => setIsItemSelectorOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {exercises.length > 0 ? (
          <div className="space-y-4">
            {exercises.map((item) =>
              item.exercise ? (
                <ExerciseDetailCard key={item.id} exercise={item.exercise} onRemove={() => handleRemoveItem(item.id)} />
              ) : (
                <div key={item.id} className="p-4 border rounded-lg text-sm text-muted-foreground">
                  Exercício não encontrado
                </div>
              )
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
            <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm mb-3">Nenhum exercício agendado para este dia</p>
            <Button size="sm" variant="outline" onClick={() => setIsItemSelectorOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Exercício
            </Button>
          </div>
        )}
      </div>

      {/* Item Selector Dialog */}
      <ItemSelector
        isOpen={isItemSelectorOpen}
        onClose={() => setIsItemSelectorOpen(false)}
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
