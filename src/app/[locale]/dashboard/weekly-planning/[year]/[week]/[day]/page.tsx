import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { DayDetailView } from '@/components/training-planner/day-detail-view'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getDayDetails,
  getAvailableModules,
  getAvailableExercises,
} from '@/app/[locale]/dashboard/weekly-planning/actions'

interface DayDetailPageProps {
  params: Promise<{
    year: string
    week: string
    day: string
  }>
}

async function DayDetailContent({ year, week, day }: { year: number; week: number; day: number }) {
  // Fetch data in parallel
  const [dayDetails, availableModules, availableExercises] = await Promise.all([
    getDayDetails(year, week, day),
    getAvailableModules(),
    getAvailableExercises(),
  ])

  if (!dayDetails) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Erro ao carregar detalhes do dia</p>
      </div>
    )
  }

  return (
    <DayDetailView
      date={dayDetails.date}
      items={dayDetails.items}
      year={year}
      week={week}
      dayOfWeek={day}
      availableModules={availableModules}
      availableExercises={availableExercises}
    />
  )
}

function DayDetailLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-5 w-32 mt-2" />
      </div>

      {/* Navigation skeleton */}
      <div className="flex justify-center gap-4">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Sections skeleton */}
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  )
}

export default async function DayDetailPage({ params }: DayDetailPageProps) {
  const resolvedParams = await params
  const year = parseInt(resolvedParams.year)
  const week = parseInt(resolvedParams.week)
  const day = parseInt(resolvedParams.day)

  // Validate parameters
  if (isNaN(year) || isNaN(week) || isNaN(day) || week < 1 || week > 53 || day < 1 || day > 7) {
    redirect('/dashboard/weekly-planning')
  }

  return (
    <Suspense fallback={<DayDetailLoadingSkeleton />}>
      <DayDetailContent year={year} week={week} day={day} />
    </Suspense>
  )
}
