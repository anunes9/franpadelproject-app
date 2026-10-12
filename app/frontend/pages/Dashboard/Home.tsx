import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { ModuleCard } from '@/components/ui/ModuleCard'
import type { TranslationKey } from '@/i18n/translations'
import { useTranslation } from '@/i18n/useTranslation'
import { AppShell, PageHeader } from '../../components/shell'
import { buttonClass, Card, Eyebrow } from '../../components/ui'
import type { DashboardUser, Module } from '../../types/dashboard-data'

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

function greetingKey(hour: number): TranslationKey {
  if (hour < 12) return 'dashboard.home.greeting.morning'
  if (hour < 20) return 'dashboard.home.greeting.afternoon'
  return 'dashboard.home.greeting.evening'
}

function Home() {
  const { courseStats, modules, dashboardUser } = usePage<Props>().props
  const { t } = useTranslation()
  // The Module to continue: one already In Progress, else the next Available
  // one. None when every Module is completed, or there are no Modules at all.
  const current = modules.find((m) => m.status === 'in_progress') ?? modules.find((m) => m.status === 'available')

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-5xl flex-col gap-7">
        <PageHeader title={t(greetingKey(new Date().getHours()), { name: dashboardUser.name.split(' ')[0] })} />

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
            className="col-span-2 md:col-span-1"
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

            {current ? (
              <ModuleCard
                href={`/dashboard/courses/${current.id}`}
                title={current.title}
                description={current.description}
                status={current.status}
                progress={current.progress}
                topics={current.topics}
              />
            ) : (
              <p className="rounded-2xl border border-line bg-white p-4 text-sm text-muted-strong shadow-card">
                {modules.length > 0 ? t('dashboard.home.allCompleted') : t('dashboard.home.noModules')}
              </p>
            )}

            {/*All Module*/}
            <div className="mt-3 flex flex-col gap-3">
              <Eyebrow>{t('dashboard.home.modulesEyebrow')}</Eyebrow>

              {modules.slice(0, 5).map((m) => (
                <ModuleCard
                  key={m.id}
                  href={`/dashboard/courses/${m.id}`}
                  title={m.title}
                  description={m.description}
                  status={m.status}
                  progress={m.progress}
                  duration={m.duration}
                  topics={m.topics}
                />
              ))}
            </div>
          </div>

          {/*Plan for this week*/}
          <div className="flex flex-col gap-3">
            <Eyebrow>{t('dashboard.home.thisWeekEyebrow')}</Eyebrow>

            <div className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-[18px] shadow-card">
              <div>
                <h2 className="text-base font-bold text-ink">{t('dashboard.home.weekPlan.title')}</h2>
                <p className="mt-0.5 text-meta text-muted-strong">{t('dashboard.home.weekPlan.detail')}</p>
              </div>
              <Link href="/dashboard/plan" className={buttonClass('primary')}>
                {t('dashboard.home.weekPlan.cta')}
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
