import { Suspense } from 'react'
import { WeeklyPlanningCalendar } from '@/components/training-planner/weekly-planning-calendar'
import PageHeader from '@/components/PageHeader'
import { getWeeklyPlan, getAvailableModules, getAvailableExercises } from './actions'
import { getCurrentWeek } from '@/utils/date-helpers'
import { Skeleton } from '@/components/ui/skeleton'

interface WeeklyPlanningPageProps {
  searchParams: Promise<{
    year?: string
    week?: string
  }>
}

async function WeeklyPlanningContent({ year, week }: { year: number; week: number }) {
  // Fetch data in parallel
  const [weeklyPlanData, availableModules, availableExercises] = await Promise.all([
    getWeeklyPlan(year, week),
    getAvailableModules(),
    getAvailableExercises(),
  ])

  if (!weeklyPlanData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Erro ao carregar o planeamento semanal</p>
      </div>
    )
  }

  return (
    <WeeklyPlanningCalendar
      initialYear={year}
      initialWeek={week}
      weeklyPlanData={weeklyPlanData}
      availableModules={availableModules}
      availableExercises={availableExercises}
    />
  )
}

function WeeklyPlanningLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Week Navigator Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-16 w-[200px]" />
          <Skeleton className="h-10 w-10" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Calendar Grid Skeleton - Only weekdays */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((day) => (
          <Skeleton key={day} className="h-[300px]" />
        ))}
      </div>
    </div>
  )
}

export default async function WeeklyPlanningPage({ searchParams }: WeeklyPlanningPageProps) {
  // Await searchParams in Next.js 15
  const params = await searchParams

  // Get year and week from search params or use current week
  const currentWeek = getCurrentWeek()
  const year = params.year ? parseInt(params.year) : currentWeek.year
  const week = params.week ? parseInt(params.week) : currentWeek.week

  // Validate parameters
  if (isNaN(year) || isNaN(week) || week < 1 || week > 53) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Parâmetros de semana inválidos</p>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Planeamento Semanal"
        description="Organize os seus módulos de treino para cada dia da semana"
      />

      <Suspense fallback={<WeeklyPlanningLoadingSkeleton />}>
        <WeeklyPlanningContent year={year} week={week} />
      </Suspense>
    </>
  )
}
