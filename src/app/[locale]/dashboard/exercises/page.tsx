import { getAllExercises } from '@/lib/contentful/exercises-delivery'
import { getLocale } from 'next-intl/server'
import { ExercisesPageClient } from './ExercisesPageClient'
import { getExerciseCompletionStatus } from '../actions'

export default async function ExercisesPage() {
  const locale = await getLocale()
  const exercises = await getAllExercises(locale as any)

  // Get completion status for all exercises
  const exerciseIds = exercises.map(e => e.externalId)
  const completionStatus = await getExerciseCompletionStatus(exerciseIds)
  const completedExerciseIds = new Set(
    Object.entries(completionStatus)
      .filter(([, isCompleted]) => isCompleted)
      .map(([id]) => id)
  )

  return <ExercisesPageClient exercises={exercises} completedExerciseIds={completedExerciseIds} />
}
