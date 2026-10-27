import { Add01Icon, Calendar03Icon, LeftToRightListBulletIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link, usePage } from '@inertiajs/react'
import { type ReactNode, useEffect, useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { formatDate, formatShortDay, formatTimeRange, formatWeeklyTime } from '@/lib/classGroups'
import { classGroupsPath, classPath, clubPath, editClassGroupPath } from '@/lib/paths'
import { ReassignClassGroup } from '../../components/ClassGroupReassignment'
import { ContinuesFrom, FinishedPill, StartNextLevelGroup } from '../../components/FinishedGroups'
import { GroupNameEditor } from '../../components/GroupNameEditor'
import { AddClassForm, ClassActions, useAddClassRefused } from '../../components/PlanEditing'
import { ModuleLine, ModuleSegments } from '../../components/PlanProgress'
import { RegeneratePlan } from '../../components/PlanRegeneration'
import { PlanCalendar, PlanLegend, PlanList } from '../../components/PlanViews'
import { AppShell } from '../../components/shell'
import { BackLink, buttonClass, Detail, Eyebrow } from '../../components/ui'
import type {
  BreakPeriod,
  ClassGroup,
  Level,
  ModuleOption,
  PlanModule,
  PlanProgress,
  TrainingClass,
} from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  current_user: { role: string } | null
  // ISO date (YYYY-MM-DD) at the Academy.
  today: string
  classGroup: ClassGroup & { progress: PlanProgress }
  // The whole plan in order, each Class numbered.
  classes: TrainingClass[]
  // The Modules of the group's Course, with what each is about.
  modules: PlanModule[]
  // The Club's Break Periods, shown on the plan.
  breakPeriods: BreakPeriod[]
  nameMaxLength: number
  // The Modules a Class can be added for: those of the group's Course.
  moduleOptions: ModuleOption[]
  // For the owning Coach of a finished group: the Level a group continuing it
  // starts at; null otherwise, or after Advanced.
  nextLevel: Level | null
}

type PlanView = 'calendar' | 'list'

// The plan view in the URL (?view=list), so a reload or a shared link keeps it.
function viewFromUrl(): PlanView {
  if (typeof window === 'undefined') return 'calendar'
  return new URLSearchParams(window.location.search).get('view') === 'list' ? 'list' : 'calendar'
}

// A Class Group and its whole Training Plan, for its Coach and the Club
// Managers of its Club: who and when, how far the plan has got and its next
// Class, its Players, then the plan as a calendar or a list.
function Show() {
  const { current_user, today, classGroup, classes, modules, breakPeriods, nameMaxLength, moduleOptions, nextLevel } =
    usePage<Props>().props
  const { t, tn, locale } = useTranslation()
  const isManager = current_user?.role === 'club_manager'
  const progress = classGroup.progress
  const nextClass = classes.find((c) => c.id === progress.nextClass?.id)
  const addRefused = useAddClassRefused()
  const [view, setView] = useState<PlanView>(viewFromUrl)
  const [addingOn, setAddingOn] = useState<string | null>(addRefused ? '' : null)

  useEffect(() => {
    const url = new URL(window.location.href)
    if (view === 'list') url.searchParams.set('view', 'list')
    else url.searchParams.delete('view')
    window.history.replaceState(window.history.state, '', url)
  }, [view])

  function addClass(date: string) {
    setAddingOn(date)
    requestAnimationFrame(() => document.getElementById('add-class')?.scrollIntoView({ behavior: 'smooth' }))
  }

  const planProps = {
    classes,
    modules,
    breakPeriods,
    today,
    duration: classGroup.duration,
    exercisesPerClass: classGroup.exercisesPerClass,
  }

  return (
    <div className="px-5 pt-6 pb-14 lg:px-10 lg:pt-8">
      <div className="flex max-w-[1120px] flex-col gap-6 lg:mx-auto">
        {isManager ? (
          <BackLink label={t('classGroups.show.backToClub')} href={clubPath(classGroup.club.id)} />
        ) : (
          <BackLink label={t('classGroups.show.backToGroups')} href={classGroupsPath} />
        )}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Eyebrow>
              {t('classGroups.show.eyebrow')} · {t(`players.levelOption.${classGroup.level}`)} · {classGroup.club.name}
            </Eyebrow>
            <div className="flex flex-wrap items-center gap-3">
              <GroupNameEditor key={classGroup.name ?? ''} group={classGroup} maxLength={nameMaxLength} />
              {classGroup.finished && <FinishedPill />}
            </div>
            {classGroup.previousGroup && <ContinuesFrom group={classGroup.previousGroup} />}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={editClassGroupPath(classGroup.id)}
              className={buttonClass('secondary', 'min-h-11 py-0 text-sm')}
            >
              {t('classGroups.edit.link')}
            </Link>
            <a href="#regenerate-plan-title" className={buttonClass('secondary', 'min-h-11 py-0 text-sm')}>
              {t('classGroups.planRegeneration.button')}
            </a>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <dl className="grid flex-[2_1_420px] grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4 rounded-[18px] border border-line bg-white p-5 shadow-card">
            <Detail label={t('classGroups.show.when')}>{formatWeeklyTime(t, classGroup)}</Detail>
            <Detail label={t('classGroups.show.startsOn')}>{formatDate(classGroup.startsOn, locale, false)}</Detail>
            <Detail label={t('classGroups.show.coach')}>{classGroup.coach}</Detail>
            <Detail label={t('classGroups.show.players')}>
              <a href="#players" className="text-ink underline-offset-2 hover:underline">
                {tn('classGroups.show.playersLink', classGroup.players.length)}
              </a>
            </Detail>
            <div className="col-span-full flex flex-col gap-2 border-t border-mist pt-3.5">
              <ModuleLine progress={progress} />
              <ModuleSegments progress={progress} labelled />
            </div>
          </dl>

          <NextClassCard
            trainingClass={nextClass}
            today={today}
            duration={classGroup.duration}
            exercisesPerClass={classGroup.exercisesPerClass}
          />
        </div>

        {nextLevel && <StartNextLevelGroup classGroupId={classGroup.id} nextLevel={nextLevel} />}

        <section id="players" aria-labelledby="players-title" className="flex scroll-mt-6 flex-col gap-2.5">
          <h2 id="players-title" className="text-sm font-bold text-ink">
            {t('classGroups.show.players')}{' '}
            <span className="font-dash-mono text-meta font-medium text-muted">{classGroup.players.length}</span>
          </h2>
          <ul className="flex flex-wrap gap-2">
            {classGroup.players.map((player) => (
              <li key={player.id} className="rounded-full border border-line bg-white px-3.5 py-2 text-meta text-ink">
                {player.name}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="plan-title" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="plan-title" className="text-lg font-extrabold text-ink">
              {t('classGroups.show.plan')}{' '}
              <span className="font-dash-mono text-meta font-medium text-muted">
                {tn('classGroups.show.classesCount', classes.length)}
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <fieldset className="inline-flex rounded-full bg-track p-1">
                <legend className="sr-only">{t('classGroups.show.viewLabel')}</legend>
                <ViewButton active={view === 'calendar'} onClick={() => setView('calendar')} icon={Calendar03Icon}>
                  {t('classGroups.show.calendar')}
                </ViewButton>
                <ViewButton active={view === 'list'} onClick={() => setView('list')} icon={LeftToRightListBulletIcon}>
                  {t('classGroups.show.list')}
                </ViewButton>
              </fieldset>
              <button
                type="button"
                onClick={() => (addingOn === null ? addClass('') : setAddingOn(null))}
                aria-expanded={addingOn !== null}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-paper"
              >
                <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} aria-hidden />
                {t('classGroups.show.addClass')}
              </button>
            </div>
          </div>

          <PlanLegend />

          {view === 'calendar' ? (
            <PlanCalendar {...planProps} initialDay={nextClass?.date ?? today} onAddOnDay={addClass} />
          ) : (
            <PlanList {...planProps} currentModule={progress.currentModule} />
          )}
        </section>

        {addingOn !== null && (
          <AddClassForm
            key={addingOn}
            classGroupId={classGroup.id}
            moduleOptions={moduleOptions}
            initialDate={addingOn}
            initialStartTime={addingOn ? classGroup.startTime : ''}
          />
        )}

        <RegeneratePlan classGroupId={classGroup.id} />

        <ReassignClassGroup classGroupId={classGroup.id} />
      </div>
    </div>
  )
}

function ViewButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: typeof Calendar03Icon
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${active ? 'bg-white text-ink shadow-chip' : 'text-muted-strong'}`}
    >
      <HugeiconsIcon icon={icon} size={16} strokeWidth={2} aria-hidden />
      {children}
    </button>
  )
}

// The next Class to teach, on ink: when, what it covers, how many Exercises
// are chosen, and opening it or marking it done.
function NextClassCard({
  trainingClass,
  today,
  duration,
  exercisesPerClass,
}: {
  trainingClass?: TrainingClass
  today: string
  duration: number
  exercisesPerClass: number
}) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-[1_1_280px] flex-col justify-between gap-4 rounded-[18px] bg-ink p-5 text-paper shadow-card-dark">
      {trainingClass ? (
        <>
          <div className="flex flex-col gap-1.5">
            <span className="font-dash-mono text-label uppercase text-teal-line">
              {trainingClass.date === today
                ? t('classGroups.show.nextClassToday')
                : `${t('classGroups.show.nextClassTitle')} · ${formatShortDay(trainingClass.date, t)}`}
            </span>
            <span className="text-[22px] font-extrabold tracking-tight">
              {formatTimeRange(trainingClass.startTime, duration)}
            </span>
            <span className="text-sm text-paper/85">
              {t('classGroups.classNumber', { n: trainingClass.number })} ·{' '}
              {t('classGroups.show.module', { n: trainingClass.module.number })}
              {trainingClass.module.topics.length > 0 && ` · ${trainingClass.module.topics.slice(0, 3).join(', ')}`}
            </span>
            <span className="text-meta text-teal-line">
              {t('classGroups.show.exercisesOf', {
                count: trainingClass.exercises.length,
                suggested: exercisesPerClass,
              })}
            </span>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            <Link
              href={classPath(trainingClass.id)}
              className="inline-flex min-h-11 items-center rounded-full bg-paper px-4 text-sm font-bold text-ink"
            >
              {trainingClass.exercises.length === 0
                ? t('classGroups.show.chooseExercises')
                : t('classGroups.show.openClass')}
            </Link>
            <ClassActions trainingClass={trainingClass} tone="dark" doneOnly />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-1.5">
          <span className="font-dash-mono text-label uppercase text-teal-line">
            {t('classGroups.show.nextClassTitle')}
          </span>
          <span className="text-sm text-paper/85">{t('classGroups.show.noNextClass')}</span>
        </div>
      )}
    </div>
  )
}

Show.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Show
