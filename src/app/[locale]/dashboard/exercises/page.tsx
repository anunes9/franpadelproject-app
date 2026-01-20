import { getAllExercises } from '@/lib/contentful/exercises-delivery'
import { getLocale } from 'next-intl/server'
import { ExercisesPageClient } from './ExercisesPageClient'

export default async function ExercisesPage() {
  const locale = await getLocale()
  const exercises = await getAllExercises(locale as any)

  return <ExercisesPageClient exercises={exercises} />
}
