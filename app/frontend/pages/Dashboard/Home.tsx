import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { ModuleCard } from '@/components/ui/ModuleCard'
import type { TranslationKey } from '@/i18n/translations'
import { useTranslation } from '@/i18n/useTranslation'
import { AppShell } from '../../components/shell'
import { ArrowBadge, ProgressBar, Tile } from '../../components/ui'
import type { DashboardUser, Module, ModuleStatus } from '../../types/dashboard-data'

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

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

const STATUS_LABEL_KEY: Record<ModuleStatus, TranslationKey> = {
  locked: 'common.status.locked',
  available: 'common.status.available',
  in_progress: 'common.status.inProgress',
  completed: 'common.status.completed',
}

function greetingKey(hour: number): TranslationKey {
  if (hour < 12) return 'dashboard.home.greetingLine.morning'
  if (hour < 20) return 'dashboard.home.greetingLine.afternoon'
  return 'dashboard.home.greetingLine.evening'
}

/** Monday-to-Sunday dates of the week containing `now`. */
function weekOf(now: Date): Date[] {
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  return DAY_KEYS.map((_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase()

function SectionTitle({ children, href, linkLabel }: { children: ReactNode; href: string; linkLabel: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-extrabold tracking-[-0.01em] text-ink">{children}</h2>
      <Link href={href} className="flex min-h-11 items-center text-meta font-semibold text-muted-strong">
        {linkLabel}
      </Link>
    </div>
  )
}

function Home() {
  const { courseStats, modules, dashboardUser } = usePage<Props>().props
  const { t } = useTranslation()
  // The Module to continue: one already In Progress, else the next Available
  // one. None when every Module is completed, or there are no Modules at all.
  const current = modules.find((m) => m.status === 'in_progress') ?? modules.find((m) => m.status === 'available')
  const today = new Date()
  const week = weekOf(today)

  return (
    <div className="px-5 pt-5 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 lg:gap-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-sm font-extrabold text-paper">
            {dashboardUser.initials}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-strong">{t(greetingKey(today.getHours()))}</span>
            <span className="text-[15px] font-bold text-ink">{dashboardUser.name}</span>
          </div>
        </div>

        <h1 className="text-balance text-[30px] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink lg:text-[38px]">
          {t('dashboard.home.heading')}
        </h1>

        <div className="flex flex-col gap-5 xl:grid xl:grid-cols-[1fr_320px] xl:items-start xl:gap-6">
          {/* Continue tile */}
          {current ? (
            <Tile tone="teal" href={`/dashboard/courses/${current.id}`} className="order-1 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-muted-strong">
                    {t(STATUS_LABEL_KEY[current.status])} · {current.title}
                  </span>
                  <span className="text-[19px] font-extrabold leading-tight tracking-[-0.01em] text-ink lg:text-2xl">
                    {current.description}
                  </span>
                  {current.topics.length > 0 && (
                    <span className="text-xs text-muted-strong">{current.topics.join(' · ')}</span>
                  )}
                </div>
                <ArrowBadge />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-strong">{t('dashboard.home.progressLabel')}</span>
                  <span className="font-bold text-ink">{current.progress}%</span>
                </div>
                <ProgressBar value={current.progress} tone="tile" label={current.title} />
              </div>
            </Tile>
          ) : (
            <Tile className="order-1 text-sm text-muted-strong">
              {modules.length > 0 ? t('dashboard.home.allCompleted') : t('dashboard.home.noModules')}
            </Tile>
          )}

          {/* This week: strip + plan */}
          <aside className="order-2 flex flex-col gap-3 xl:col-start-2 xl:row-span-3 xl:row-start-1">
            <div className="flex gap-1.5">
              {week.map((date, i) => {
                const isToday = sameDay(date, today)
                return (
                  <div
                    key={DAY_KEYS[i]}
                    aria-current={isToday ? 'date' : undefined}
                    className={
                      'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-2 ' +
                      (isToday ? 'bg-ink text-paper' : 'border border-line bg-white text-ink')
                    }
                  >
                    <span className={`text-[11px] ${isToday ? 'text-ink-mute' : 'text-muted-strong'}`}>
                      {titleCase(t(`common.days.short.${DAY_KEYS[i]}`))}
                    </span>
                    <span className="text-[15px] font-bold">{date.getDate()}</span>
                  </div>
                )
              })}
            </div>

            <SectionTitle href="/dashboard/plan" linkLabel={t('common.viewAll')}>
              {t('dashboard.home.yourPlan')}
            </SectionTitle>

            <Tile tone="clay" href="/dashboard/plan" className="flex items-end justify-between gap-3">
              <span className="flex flex-col gap-1">
                <span className="text-[15px] font-extrabold leading-tight tracking-[-0.01em]">
                  {t('dashboard.home.weekPlan.title')}
                </span>
                <span className="text-xs text-muted-strong">{t('dashboard.home.weekPlan.detail')}</span>
              </span>
              <ArrowBadge size="sm" />
            </Tile>
          </aside>

          {/* Stats bento */}
          <div className="order-3 grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3">
            <Tile tone="teal" className="col-span-2 flex flex-col justify-between gap-4 md:col-span-1">
              <span className="text-xs text-muted-strong">{t('dashboard.home.stats.courseProgress')}</span>
              <div className="flex flex-col gap-2">
                <span className="text-3xl font-extrabold leading-none tracking-[-0.02em] lg:text-4xl">
                  {courseStats.progress}%
                </span>
                <ProgressBar
                  value={courseStats.progress}
                  tone="tile"
                  label={t('dashboard.home.stats.courseProgress')}
                />
                <span className="text-xs text-muted-strong">
                  {t('dashboard.home.stats.modulesCompleteDetail', {
                    done: courseStats.modulesDone,
                    total: courseStats.modulesTotal,
                  })}
                </span>
              </div>
            </Tile>
            <Tile tone="ink" href="/dashboard/exercises" className="flex flex-col justify-between gap-4">
              <span className="text-xs text-muted-strong">{t('dashboard.home.stats.exercisesCompleted')}</span>
              <div className="flex items-end justify-between gap-2">
                <span className="text-3xl font-extrabold leading-none tracking-[-0.02em] lg:text-4xl">
                  {courseStats.exercisesDone}
                </span>
                <ArrowBadge size="sm" />
              </div>
            </Tile>
            <Tile tone="clay" className="flex flex-col justify-between gap-4">
              <span className="text-xs text-muted-strong">{t('dashboard.home.stats.averageQuizScore')}</span>
              <span className="text-3xl font-extrabold leading-none tracking-[-0.02em] lg:text-4xl">
                {courseStats.averageQuiz != null ? `${courseStats.averageQuiz}%` : t('dashboard.home.stats.noData')}
              </span>
            </Tile>
          </div>

          {/* Modules */}
          <div className="order-4 flex flex-col gap-3">
            <SectionTitle href="/dashboard/courses" linkLabel={t('common.viewAll')}>
              {t('dashboard.home.modulesEyebrow')}
            </SectionTitle>
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
      </div>
    </div>
  )
}

Home.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Home
