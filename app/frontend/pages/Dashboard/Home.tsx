import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { AppShell, PageHeader } from '../../components/shell'
import { Card, Eyebrow } from '../../components/ui'
import type { DashboardUser, Module } from '../../types/dashboard-data'
import { ModuleCard } from '@/components/ui/ModuleCard'
import { useTranslation } from '@/i18n/useTranslation'

interface CourseStats {
  progress: number
  modulesDone: number
  modulesTotal: number
  exercisesDone: number
  averageQuiz: number | null
}

interface Props {
  [key: string]: unknown
  courseStats: CourseStats
  modules: Module[]
  dashboardUser: DashboardUser
}

const WEEK = [
  { day: 'mon', state: 'done' },
  { day: 'tue', state: 'empty' },
  { day: 'wed', state: 'today' },
  { day: 'thu', state: 'planned' },
  { day: 'fri', state: 'empty' },
  { day: 'sat', state: 'empty' },
] as const

const WEEK_PLAN_ROWS = [
  { day: 'monday', item: 'mondayItem' },
  { day: 'wednesday', item: 'wednesdayItem' },
  { day: 'thursday', item: 'thursdayItem' },
] as const

function Home() {
  const { courseStats, modules, dashboardUser } = usePage<Props>().props
  const { t } = useTranslation()
  const current = modules.find((m) => m.status === 'current') ?? modules[0]

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-5xl flex-col gap-7">
        <PageHeader title={t('dashboard.home.greeting', { name: dashboardUser.name.split(' ')[0] })} />

        {/*Hero Cards*/}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          <Card
            title={t('dashboard.home.stats.courseProgress')}
            content={`${courseStats.progress}%`}
            details={t('dashboard.home.stats.modulesCompleteDetail', {
              done: courseStats.modulesDone,
              total: courseStats.modulesTotal,
            })}
            progress={courseStats.progress}
            tone="dark"
          />

          <Card title={t('dashboard.home.stats.exercisesCompleted')} content={courseStats.exercisesDone} />

          <Card
            title={t('dashboard.home.stats.averageQuizScore')}
            content={courseStats.averageQuiz != null ? `${courseStats.averageQuiz}%` : t('dashboard.home.stats.noData')}
          />
        </div>

        {/*Modules*/}
        <div className="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
          {/*In Progress Module*/}
          <div className="flex flex-col gap-3">
            <Eyebrow>{t('dashboard.home.continueEyebrow')}</Eyebrow>

            <ModuleCard
              href={'/dashboard/courses/' + current.id}
              title={current.title}
              description={current.description}
              progress={current.progress}
              topics={current.topics}
              pill={t('common.status.inProgress')}
              variant="index"
            />

            {/*All Module*/}
            <div className="mt-3 flex flex-col gap-3">
              <Eyebrow>{t('dashboard.home.modulesEyebrow')}</Eyebrow>

              {modules.slice(0, 5).map((m) => (
                <ModuleCard
                  key={m.id}
                  href={'/dashboard/courses/' + m.id}
                  title={m.title}
                  description={m.description}
                  progress={m.progress}
                  duration={m.duration}
                  pill={m.progress === 100 ? t('common.status.completed') : t('common.status.open')}
                  topics={m.topics}
                  variant="index"
                />
              ))}
            </div>
          </div>

          {/*Plan for this week*/}
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <Eyebrow>{t('dashboard.home.thisWeekEyebrow')}</Eyebrow>

              <Link href="/dashboard/plan" className="text-[13px] font-semibold">
                {t('dashboard.home.planLink')}
              </Link>
            </div>

            <div className="flex gap-1.5 lg:hidden">
              {WEEK.map((d) => (
                <div
                  key={d.day}
                  className={
                    'flex-1 rounded-xl border py-2.5 text-center ' +
                    (d.state === 'today' ? 'border-ink bg-ink' : 'border-line bg-white')
                  }
                >
                  <div
                    className={'font-dash-mono text-[10px] ' + (d.state === 'today' ? 'text-ink-mute' : 'text-muted')}
                  >
                    {t(`common.days.short.${d.day}`)}
                  </div>
                  <div
                    className={
                      'mx-auto mt-2 h-2 w-2 rounded-full ' +
                      (d.state === 'empty' ? 'bg-line' : d.state === 'today' ? 'bg-teal' : 'bg-teal-deep')
                    }
                  />
                </div>
              ))}
            </div>

            <div className="hidden flex-col gap-3.5 rounded-[18px] border border-line bg-white p-[18px] lg:flex">
              {WEEK_PLAN_ROWS.map((row) => (
                <div key={row.day} className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-ink">{t(`common.days.long.${row.day}`)}</span>
                  <div className="rounded-[10px] border border-dashed border-[#C9D2CD] px-3 py-2.5 text-[13px] text-[#3B4B54]">
                    {t(`dashboard.home.weekPlan.${row.item}`)}
                  </div>
                </div>
              ))}
              <Link
                href="/dashboard/plan"
                className="rounded-[10px] border border-dashed border-line px-3 py-3.5 text-center text-xs text-[#A3B0B7]"
              >
                {t('dashboard.home.weekPlan.dragExerciseHere')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

Home.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Home
