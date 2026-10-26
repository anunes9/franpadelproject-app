import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { ModuleCard } from '@/components/ui/ModuleCard'
import type { TranslationKey } from '@/i18n/translations'
import { useTranslation } from '@/i18n/useTranslation'
import { formatTimeRange } from '@/lib/classGroups'
import { classGroupsPath, classPath, newClassGroupPath } from '@/lib/paths'
import { ClassGroupRow } from '../../components/ClassGroupRow'
import { AppShell } from '../../components/shell'
import {
  ArrowBadge,
  buttonClass,
  ListCard,
  ListRow,
  Pill,
  ProgressBar,
  SectionHeading,
  Tile,
} from '../../components/ui'
import type { ClassGroupListItem, DashboardUser, Module, ModuleStatus, TodayClass } from '../../types/dashboard-data'

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
  // A Coach's only: today's Classes (in Lisbon) by start time, skipped ones
  // left out, and their current Class Groups.
  todayClasses?: TodayClass[]
  classGroups?: ClassGroupListItem[]
}

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

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

// A section title's link to the full list, beside the title.
function SectionLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="flex min-h-11 items-center text-meta font-semibold text-muted-strong">
      {children}
    </Link>
  )
}

// Today's Classes of the Coach, each linking to its Class page.
function TodaySection({ classes }: { classes: TodayClass[] }) {
  const { t, tn } = useTranslation()

  return (
    <section className="flex flex-col gap-3" aria-labelledby="today-title">
      <SectionHeading id="today-title" title={t('dashboard.home.today.title')} />
      <ListCard
        count={classes.length}
        empty={t('dashboard.home.today.empty')}
        emptyAction={
          <Link
            href={classGroupsPath}
            className="text-meta font-semibold text-teal-deep underline-offset-2 hover:underline"
          >
            {t('dashboard.home.today.emptyLink')}
          </Link>
        }
      >
        {classes.map((trainingClass) => (
          <ListRow key={trainingClass.id}>
            <Link
              href={classPath(trainingClass.id)}
              className="-my-3.5 flex min-h-11 min-w-0 flex-1 flex-col justify-center gap-0.5 py-3.5 hover:text-teal-deep"
            >
              <span className="font-dash-mono text-sm font-semibold text-ink">
                {formatTimeRange(trainingClass.startTime, trainingClass.duration)}
              </span>
              <span className="text-meta text-muted">
                {t(`players.levelOption.${trainingClass.group.level}`)} ·{' '}
                {tn('classGroups.playersCount', trainingClass.group.playerCount)}
              </span>
              <span className="truncate text-meta text-muted">
                {trainingClass.module.title}
              </span>
              {trainingClass.kind === 'assessment' && (
                <span className="text-meta text-muted-strong">{t('dashboard.home.today.assessmentNote')}</span>
              )}
            </Link>
            {(trainingClass.kind === 'assessment' || trainingClass.done) && (
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                {trainingClass.kind === 'assessment' && <Pill text={t('dashboard.home.today.assessment')} />}
                {trainingClass.done && <Pill text={t('dashboard.home.today.done')} variant="full" />}
              </div>
            )}
          </ListRow>
        ))}
      </ListCard>
    </section>
  )
}

// The Coach's current Class Groups; finished ones are on the full list.
function MyGroupsSection({ groups }: { groups: ClassGroupListItem[] }) {
  const { t } = useTranslation()

  return (
    <section className="flex flex-col gap-3" aria-labelledby="my-groups-title">
      <SectionHeading
        id="my-groups-title"
        title={t('dashboard.home.myGroups.title')}
        action={<SectionLink href={classGroupsPath}>{t('dashboard.home.myGroups.allGroups')}</SectionLink>}
      />
      <ListCard
        count={groups.length}
        empty={t('dashboard.home.myGroups.empty')}
        emptyAction={
          <Link href={newClassGroupPath} className={buttonClass('primary')}>
            {t('dashboard.home.myGroups.create')}
          </Link>
        }
      >
        {groups.map((group) => (
          <ClassGroupRow key={group.id} group={group} />
        ))}
      </ListCard>
    </section>
  )
}

function Home() {
  const { courseStats, modules, dashboardUser, todayClasses, classGroups } = usePage<Props>().props
  const { t } = useTranslation()
  // The Module to continue: one already In Progress, else the next Available
  // one. None when every Module is completed, or there are no Modules at all.
  const current = modules.find((m) => m.status === 'in_progress') ?? modules.find((m) => m.status === 'available')
  const today = new Date()
  // A Coach's home starts from their day, then their own Course progress.
  const coachHome = todayClasses && classGroups ? { todayClasses, classGroups } : null

  return (
    <div className="px-5 pt-5 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 lg:gap-7">
        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-muted-strong">
            {t(greetingKey(today.getHours()))} {firstName(dashboardUser.name)}
          </p>
          <h1 className="text-balance text-[30px] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink lg:text-[38px]">
            {t(coachHome ? 'dashboard.home.coachHeading' : 'dashboard.home.heading')}
          </h1>
        </div>

        {coachHome && (
          <>
            <TodaySection classes={coachHome.todayClasses} />
            <MyGroupsSection groups={coachHome.classGroups} />
          </>
        )}

        <div className="flex flex-col gap-5">
          {coachHome && <SectionHeading title={t('dashboard.home.courseProgressTitle')} />}
          {/* Continue tile */}
          {current ? (
            <Tile tone="teal" href={`/dashboard/courses/${current.id}`} className="flex flex-col gap-4">
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
            <Tile className="text-sm text-muted-strong">
              {modules.length > 0 ? t('dashboard.home.allCompleted') : t('dashboard.home.noModules')}
            </Tile>
          )}

          {/* Stats bento */}
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3">
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
          <div className="flex flex-col gap-3">
            <SectionHeading
              title={t('dashboard.home.modulesEyebrow')}
              action={<SectionLink href="/dashboard/courses">{t('common.viewAll')}</SectionLink>}
            />
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
