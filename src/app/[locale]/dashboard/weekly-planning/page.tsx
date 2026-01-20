import { getCurrentWeek } from '@/utils/date-helpers'
import { getWeeklyPlan } from './actions'
import { WeeklyPlanningCalendar } from '@/components/WeeklyPlanningCalendar'
import { getAllModules } from '@/lib/contentful/modules-delivery'
import { getAllExercises } from '@/lib/contentful/exercises-delivery'
import { getLocale } from 'next-intl/server'

export default async function WeeklyPlanningPage() {
  const locale = await getLocale()
  const { year, week } = getCurrentWeek()
  
  const plan = await getWeeklyPlan(year, week)
  const modules = await getAllModules(locale as any)
  const exercises = await getAllExercises(locale as any)

  // Map database items to include titles and levels from Contentful
  const initialItems = plan?.weekly_plan_modules?.map((dbItem: any) => {
    let title = 'Unknown'
    let level = undefined

    if (dbItem.item_type === 'module') {
      const module = modules.find(m => m.externalId === dbItem.item_external_id)
      title = module?.title || 'Unknown Module'
      level = module?.level
    } else {
      const exercise = exercises.find(e => e.externalId === dbItem.item_external_id)
      title = exercise?.title || 'Unknown Exercise'
    }

    return {
      id: dbItem.id,
      item_external_id: dbItem.item_external_id,
      item_type: dbItem.item_type,
      day_of_week: dbItem.day_of_week,
      title,
      level
    }
  }) || []

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-p-blue md:text-4xl">
          Weekly Planning
        </h1>
        <p className="text-p-blue/60 text-lg">
          Organize your training routine and track your progress.
        </p>
      </div>

      <WeeklyPlanningCalendar 
        initialItems={initialItems} 
        currentYear={year} 
        currentWeek={week} 
      />
    </div>
  )
}
