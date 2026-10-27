import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  MoreHorizontalIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link } from '@inertiajs/react'
import { useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import {
  addDays,
  formatDayMonth,
  formatDuration,
  formatLongDay,
  formatMonth,
  formatShortDay,
  formatTimeRange,
  weekdayIndex,
  weekdayNames,
} from '@/lib/classGroups'
import { classPath } from '@/lib/paths'
import type { BreakPeriod, PlanModule, TrainingClass } from '../types/dashboard-data'
import { ClassActions } from './PlanEditing'
import { Topic } from './ui'

// A Training Plan's two views on its group's page: a month calendar with the
// selected day beside it, and a list of its Modules, each opening onto its
// Classes. Both number the Classes in plan order and show the Club's Break
// Periods.

export interface PlanViewProps {
  classes: TrainingClass[]
  modules: PlanModule[]
  breakPeriods: BreakPeriod[]
  // ISO date (YYYY-MM-DD) at the Academy.
  today: string
  // Minutes, and how many Exercises each Class has.
  duration: number
  exercisesPerClass: number
}

type Status = 'done' | 'skipped' | 'today' | 'toMark' | 'scheduled'

function statusOf(trainingClass: TrainingClass, today: string): Status {
  if (trainingClass.done) return 'done'
  if (trainingClass.skipped) return 'skipped'
  if (trainingClass.date === today) return 'today'
  return trainingClass.date < today ? 'toMark' : 'scheduled'
}

const STATUS_TONE: Record<Status, string> = {
  done: 'bg-tint-teal text-teal-ink',
  skipped: 'bg-mist text-muted-strong line-through',
  today: 'bg-ink text-paper',
  toMark: 'bg-tint-clay text-clay-ink',
  scheduled: 'bg-mist text-muted-strong',
}

const TAG = 'rounded-full px-2 py-0.5 font-dash-mono text-[10px] uppercase tracking-[0.08em]'

function StatusTag({ status }: { status: Status }) {
  const { t } = useTranslation()
  return <span className={`${TAG} ${STATUS_TONE[status]}`}>{t(`classGroups.show.status.${status}`)}</span>
}

function AssessmentTag() {
  const { t } = useTranslation()
  return <span className={`${TAG} bg-tint-clay text-clay-ink`}>{t('classGroups.assessmentTag')}</span>
}

// The Break Period holding `date`, if any.
function breakOn(breakPeriods: BreakPeriod[], date: string) {
  return breakPeriods.find((period) => date >= period.startsOn && date <= period.endsOn)
}

// A Class's chip colour: clay for an Assessment Class, else alternating by Module.
function chipTone(trainingClass: TrainingClass) {
  if (trainingClass.kind === 'assessment') return 'border-clay-line bg-tint-clay text-clay-ink'
  return trainingClass.module.number % 2 === 1
    ? 'border-teal-line bg-tint-teal text-teal-ink'
    : 'border-tint-ink-line bg-tint-ink text-ink'
}

const BREAK_STRIPES = 'repeating-linear-gradient(135deg, var(--color-paper) 0 6px, var(--color-mist) 6px 12px)'

// The legend both views share.
export function PlanLegend() {
  const { t } = useTranslation()
  const swatch = 'size-3 rounded border'
  return (
    <ul aria-label={t('classGroups.show.legendLabel')} className="flex flex-wrap gap-4 text-xs text-muted-strong">
      <li className="inline-flex items-center gap-1.5">
        <span className={`${swatch} border-teal-line bg-tint-teal`} />
        {t('classGroups.show.legendOdd')}
      </li>
      <li className="inline-flex items-center gap-1.5">
        <span className={`${swatch} border-tint-ink-line bg-tint-ink`} />
        {t('classGroups.show.legendEven')}
      </li>
      <li className="inline-flex items-center gap-1.5">
        <span className={`${swatch} border-clay-line bg-tint-clay`} />
        {t('classGroups.show.legendAssessment')}
      </li>
      <li className="inline-flex items-center gap-1.5">
        <HugeiconsIcon icon={Tick02Icon} size={14} strokeWidth={2.5} className="text-teal-deep" aria-hidden />
        {t('classGroups.show.legendDone')}
      </li>
      <li className="inline-flex items-center gap-1.5">
        <span className="size-3 rounded" style={{ backgroundImage: BREAK_STRIPES }} />
        {t('classGroups.show.legendBreak')}
      </li>
    </ul>
  )
}

// The months the plan spans, as "YYYY-MM", today's month included.
function planMonths(classes: TrainingClass[], today: string) {
  const dates = [...classes.map((c) => c.date), today].sort()
  const months: string[] = []
  let month = dates[0].slice(0, 7)
  const last = dates[dates.length - 1].slice(0, 7)
  while (month <= last) {
    months.push(month)
    const [year, m] = month.split('-').map(Number)
    month = m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, '0')}`
  }
  return months
}

// The month calendar and, beside it, the selected day: its Class, with what
// its Module is about, its Exercises and its actions. Starts on `initialDay`.
export function PlanCalendar({
  classes,
  modules,
  breakPeriods,
  today,
  duration,
  exercisesPerClass,
  initialDay,
  onAddOnDay,
}: PlanViewProps & { initialDay: string; onAddOnDay: (date: string) => void }) {
  const { t, tn, locale } = useTranslation()
  const months = planMonths(classes, today)
  const [selected, setSelected] = useState(initialDay)
  const [monthIndex, setMonthIndex] = useState(Math.max(0, months.indexOf(initialDay.slice(0, 7))))
  const month = months[Math.min(monthIndex, months.length - 1)]
  const firstDay = `${month}-01`
  const offset = weekdayIndex(firstDay)
  const daysInMonth = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate()
  const cellCount = Math.ceil((offset + daysInMonth) / 7) * 7
  const monthClasses = classes.filter((c) => c.date.startsWith(month))
  const names = weekdayNames(t)

  const selectedClasses = classes.filter((c) => c.date === selected)
  const selectedBreak = breakOn(breakPeriods, selected)
  const upNext = classes.filter((c) => c.date > selected && !c.done && !c.skipped).slice(0, 3)

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="min-w-0 flex-[999_1_620px] overflow-hidden rounded-[18px] border border-line bg-white shadow-card">
        <div className="flex items-center justify-between gap-3 border-b border-mist px-4 py-3">
          <button
            type="button"
            onClick={() => setMonthIndex(Math.max(0, monthIndex - 1))}
            disabled={monthIndex === 0}
            aria-label={t('classGroups.show.previousMonth')}
            className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-white text-ink hover:border-teal disabled:opacity-40"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} aria-hidden />
          </button>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-base font-extrabold" aria-live="polite">
              {formatMonth(month, locale)}
            </span>
            <span className="font-dash-mono text-xs text-muted">
              {tn('classGroups.show.classesCount', monthClasses.length)} ·{' '}
              {t('classGroups.show.monthDone', { count: monthClasses.filter((c) => c.done).length })}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMonthIndex(Math.min(months.length - 1, monthIndex + 1))}
            disabled={monthIndex >= months.length - 1}
            aria-label={t('classGroups.show.nextMonth')}
            className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-white text-ink hover:border-teal disabled:opacity-40"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <div className="grid grid-cols-7 border-b border-mist bg-paper">
          {names.map((name) => (
            <span
              key={name}
              className="px-1 py-2 text-center font-dash-mono text-label uppercase text-muted sm:px-2.5 sm:text-left"
            >
              {name}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: cellCount }, (_, i) => {
            const day = i - offset + 1
            // A day of the next or previous month, left blank.
            const date = addDays(firstDay, day - 1)
            if (day < 1 || day > daysInMonth) {
              return (
                <div key={date} className="min-h-14 border-r border-b border-mist bg-paper-blank sm:min-h-[104px]" />
              )
            }
            return (
              <CalendarDay
                key={date}
                date={date}
                classes={monthClasses.filter((c) => c.date === date)}
                breakName={breakOn(breakPeriods, date)?.name}
                isToday={date === today}
                isPast={date < today}
                isSelected={date === selected}
                onSelect={() => setSelected(date)}
              />
            )
          })}
        </div>
      </div>

      <aside
        aria-label={t('classGroups.show.selectedDay')}
        className="flex flex-[1_1_300px] flex-col gap-4 rounded-[18px] border border-line bg-white p-5 shadow-card"
      >
        <div className="flex flex-col gap-1">
          <span className="font-dash-mono text-label uppercase text-muted">{t('classGroups.show.selectedDay')}</span>
          <span className="text-lg font-extrabold">{formatLongDay(selected, locale)}</span>
        </div>
        {selectedClasses.map((trainingClass) => (
          <DayClass
            key={trainingClass.id}
            trainingClass={trainingClass}
            module={modules.find((m) => m.slug === trainingClass.module.slug)}
            today={today}
            duration={duration}
            exercisesPerClass={exercisesPerClass}
          />
        ))}
        {selectedClasses.length === 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-strong">
              {selectedBreak
                ? t('classGroups.show.breakDay', { name: selectedBreak.name })
                : t('classGroups.show.noClassDay')}
            </p>
            {!selectedBreak && (
              <button
                type="button"
                onClick={() => onAddOnDay(selected)}
                className="inline-flex min-h-11 items-center self-start rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-teal"
              >
                {t('classGroups.show.addClassOnDay')}
              </button>
            )}
          </div>
        )}
      </aside>

      {upNext.length > 0 && (
        <section aria-labelledby="up-next-title" className="flex w-full flex-col gap-2.5 sm:hidden">
          <h3 id="up-next-title" className="text-sm font-bold text-ink">
            {t('classGroups.show.upNext')}
          </h3>
          <ul className="overflow-hidden rounded-[18px] border border-line bg-white">
            {upNext.map((trainingClass) => (
              <li key={trainingClass.id} className="border-b border-mist last:border-b-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelected(trainingClass.date)
                    setMonthIndex(Math.max(0, months.indexOf(trainingClass.date.slice(0, 7))))
                  }}
                  className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span
                    className={`flex size-10 shrink-0 flex-col items-center justify-center rounded-[10px] border font-dash-mono text-label font-semibold leading-tight ${chipTone(trainingClass)}`}
                  >
                    {names[weekdayIndex(trainingClass.date)]}
                    <span className="text-sm">{Number(trainingClass.date.slice(8))}</span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-bold">
                      {t('classGroups.classNumber', { n: trainingClass.number })} ·{' '}
                      {t('classGroups.show.module', { n: trainingClass.module.number })}
                    </span>
                    <span className="font-dash-mono text-xs text-muted">
                      {trainingClass.startTime} ·{' '}
                      {t('classGroups.show.exercisesOf', {
                        count: trainingClass.exercises.length,
                        suggested: exercisesPerClass,
                      })}
                    </span>
                  </span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={16}
                    strokeWidth={2}
                    className="text-muted-strong"
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

// One day of the month: its number, a Break Period's name, and its Classes as
// chips (a dot on narrow screens), selecting the day when pressed.
function CalendarDay({
  date,
  classes,
  breakName,
  isToday,
  isPast,
  isSelected,
  onSelect,
}: {
  date: string
  classes: TrainingClass[]
  breakName?: string
  isToday: boolean
  isPast: boolean
  isSelected: boolean
  onSelect: () => void
}) {
  const { t, locale } = useTranslation()
  const dateText = formatLongDay(date, locale)
  const label =
    classes.length > 0
      ? classes
          .map((c) =>
            [
              t('classGroups.show.dayLabelClass', {
                date: dateText,
                n: c.number,
                module: c.module.number,
                time: c.startTime,
              }),
              c.kind === 'assessment' ? t('classGroups.assessmentTag') : null,
              c.done ? t('classGroups.show.status.done') : c.skipped ? t('classGroups.show.status.skipped') : null,
            ]
              .filter(Boolean)
              .join(', ')
          )
          .join('; ')
      : breakName
        ? t('classGroups.show.dayLabelBreak', { date: dateText, name: breakName })
        : t('classGroups.show.dayLabelEmpty', { date: dateText })

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={label}
      aria-pressed={isSelected}
      className={`flex min-h-14 flex-col items-center gap-1 border-r border-b border-mist p-1 text-ink sm:min-h-[104px] sm:items-start sm:gap-1.5 sm:p-2 ${isSelected ? 'shadow-[inset_0_0_0_2px_var(--color-teal-deep)]' : ''}`}
      style={breakName ? { backgroundImage: BREAK_STRIPES } : { backgroundColor: 'white' }}
    >
      <span
        className={
          isToday
            ? 'inline-flex size-6 items-center justify-center rounded-full bg-ink text-xs font-bold text-paper'
            : `text-meta font-bold ${isPast ? 'text-muted' : 'text-ink'}`
        }
      >
        {Number(date.slice(8))}
      </span>
      {breakName && <span className="hidden text-label font-semibold text-muted-strong sm:block">{breakName}</span>}
      {classes.map((trainingClass) => (
        <span key={trainingClass.id} className="contents">
          <span
            aria-hidden
            className={`size-1.5 rounded-full sm:hidden ${trainingClass.done ? 'bg-teal-deep' : trainingClass.kind === 'assessment' ? 'bg-clay' : 'bg-line-strong/50'}`}
          />
          <span
            className={`hidden items-center gap-1 self-stretch overflow-hidden rounded-lg border px-1.5 py-1 font-dash-mono text-label font-semibold tracking-normal whitespace-nowrap sm:inline-flex ${chipTone(trainingClass)} ${trainingClass.skipped ? 'line-through opacity-60' : ''}`}
          >
            {trainingClass.done && (
              <HugeiconsIcon icon={Tick02Icon} size={12} strokeWidth={3} className="text-teal-deep" aria-hidden />
            )}
            {t('classGroups.moduleShort', { n: trainingClass.module.number })} ·{' '}
            {t('classGroups.classNumber', { n: trainingClass.number })}
          </span>
          {trainingClass.kind === 'assessment' && (
            <span className="hidden font-dash-mono text-[10px] uppercase tracking-[0.08em] text-clay-ink sm:block">
              {t('classGroups.assessmentTag')}
            </span>
          )}
        </span>
      ))}
    </button>
  )
}

// The selected day's Class: its time and status, Module, Exercises and actions.
function DayClass({
  trainingClass,
  module,
  today,
  duration,
  exercisesPerClass,
}: {
  trainingClass: TrainingClass
  module?: PlanModule
  today: string
  duration: number
  exercisesPerClass: number
}) {
  const { t } = useTranslation()
  const count = trainingClass.exercises.length

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-dash-mono text-sm font-semibold">
          {formatTimeRange(trainingClass.startTime, duration)}
        </span>
        <StatusTag status={statusOf(trainingClass, today)} />
        {trainingClass.kind === 'assessment' && <AssessmentTag />}
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">
          {t('classGroups.classNumber', { n: trainingClass.number })} ·{' '}
          {t('classGroups.show.module', { n: trainingClass.module.number })}
        </span>
        {module?.description && <span className="text-meta text-muted-strong">{module.description}</span>}
        {trainingClass.module.topics.length > 0 && (
          <ul aria-label={t('classGroups.show.moduleTopics')} className="flex flex-wrap gap-1.5">
            {trainingClass.module.topics.map((topic) => (
              <li key={topic}>
                <Topic>{topic}</Topic>
              </li>
            ))}
          </ul>
        )}
      </div>
      {trainingClass.kind === 'assessment' && (
        <p className="text-meta text-muted-strong">{t('classGroups.show.assessmentNote')}</p>
      )}
      <div className="flex flex-col gap-2 border-t border-mist pt-3.5">
        <span className="text-meta font-bold">
          {t('trainingClasses.show.exercises')}{' '}
          <span className="font-dash-mono font-medium text-muted">
            {count}/{exercisesPerClass}
          </span>
        </span>
        {count > 0 ? (
          <ol className="flex list-decimal flex-col gap-1 pl-4 text-meta">
            {trainingClass.exercises.map((exercise) => (
              <li key={exercise.ref}>{exercise.title}</li>
            ))}
          </ol>
        ) : (
          <span className="text-meta text-muted-strong">
            {t('classGroups.show.noExercisesYet', {
              duration: formatDuration(duration),
              count: exercisesPerClass,
              minutes: 8,
            })}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Link
          href={classPath(trainingClass.id)}
          className="inline-flex min-h-11 items-center self-start rounded-full bg-ink px-4 text-sm font-bold text-paper"
        >
          {count === 0 && !trainingClass.done ? t('classGroups.show.chooseExercises') : t('classGroups.show.openClass')}
        </Link>
        <ClassActions key={trainingClass.id} trainingClass={trainingClass} />
      </div>
    </div>
  )
}

type ModuleState = 'done' | 'current' | 'upcoming'

// The plan as its Modules, each with its topics, progress and dates, opening
// onto its Classes with the Club's Break Periods between them. The Module
// being taught starts open.
export function PlanList({
  classes,
  modules,
  breakPeriods,
  today,
  duration,
  exercisesPerClass,
  currentModule,
}: PlanViewProps & { currentModule: number | null }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState<Record<string, boolean>>({})

  return (
    <div className="flex flex-col gap-2">
      {modules.map((module) => {
        const own = classes.filter((c) => c.module.slug === module.slug)
        if (own.length === 0) return null
        const taught = own.filter((c) => !c.skipped)
        const done = taught.filter((c) => c.done).length
        const state: ModuleState =
          done === taught.length ? 'done' : module.number === currentModule ? 'current' : 'upcoming'
        const isOpen = open[module.slug] ?? module.number === currentModule
        const title = t('classGroups.show.module', { n: module.number })

        return (
          <section
            key={module.slug}
            aria-label={title}
            className="overflow-hidden rounded-[14px] border border-line bg-white"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen({ ...open, [module.slug]: !isOpen })}
              className="flex min-h-14 w-full flex-wrap items-center gap-x-3.5 gap-y-2 bg-white px-4 py-2 text-left text-ink"
            >
              <span
                className={`inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] font-dash-mono text-meta font-semibold ${module.number % 2 === 1 ? 'bg-tint-teal text-teal-ink' : 'bg-tint-ink text-ink'}`}
              >
                {t('classGroups.moduleShort', { n: module.number })}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-[15px] font-extrabold">{title}</span>
                <span
                  className={`${TAG} ${state === 'done' ? 'bg-tint-teal text-teal-ink' : state === 'current' ? 'bg-ink text-paper' : 'bg-mist text-muted-strong'}`}
                >
                  {t(`classGroups.show.moduleState.${state}`)}
                </span>
              </span>
              <span className="flex min-w-0 flex-[1_1_200px] flex-wrap gap-1">
                {module.topics.map((topic) => (
                  <Topic key={topic}>{topic}</Topic>
                ))}
              </span>
              <span className="ml-auto flex items-center gap-3 font-dash-mono text-xs">
                <span className="font-semibold">
                  {t('classGroups.show.moduleDone', { done, total: taught.length })}
                </span>
                <span className="text-muted">
                  {formatDayMonth(own[0].date)} – {formatDayMonth(own[own.length - 1].date)}
                </span>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={18}
                  strokeWidth={2}
                  aria-hidden
                  className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </span>
            </button>
            {isOpen && (
              <>
                {module.description && (
                  <p className="border-t border-mist px-4 py-2 text-meta text-muted-strong">{module.description}</p>
                )}
                <ul className="border-t border-mist">
                  {own.map((trainingClass, i) => {
                    const previous = own[i - 1]
                    const pause =
                      previous &&
                      breakPeriods.find(
                        (period) => period.startsOn > previous.date && period.startsOn < trainingClass.date
                      )
                    return (
                      <ListClass
                        key={trainingClass.id}
                        trainingClass={trainingClass}
                        pause={pause}
                        today={today}
                        duration={duration}
                        exercisesPerClass={exercisesPerClass}
                      />
                    )
                  })}
                </ul>
              </>
            )}
          </section>
        )
      })}
    </div>
  )
}

// One Class in the list, after the Break Period before it if any: whether it
// is done, its number, date, time and Exercises, and its actions behind "…"
// (open from the start for today's Class).
function ListClass({
  trainingClass,
  pause,
  today,
  duration,
  exercisesPerClass,
}: {
  trainingClass: TrainingClass
  pause?: BreakPeriod
  today: string
  duration: number
  exercisesPerClass: number
}) {
  const { t, locale } = useTranslation()
  const isToday = trainingClass.date === today
  const [actionsOpen, setActionsOpen] = useState(isToday && !trainingClass.done)
  const status = statusOf(trainingClass, today)

  return (
    <>
      {pause && (
        <li
          className="border-b border-mist px-4 py-1.5 text-xs font-semibold text-muted-strong"
          style={{ backgroundImage: BREAK_STRIPES }}
        >
          {t('classGroups.show.breakRow', {
            name: pause.name,
            from: formatDayMonth(pause.startsOn),
            to: formatDayMonth(pause.endsOn),
          })}
        </li>
      )}
      <li
        className={`border-b border-mist last:border-b-0 ${isToday ? 'bg-today-wash shadow-[inset_3px_0_0_var(--color-ink)]' : ''}`}
      >
        <div className="flex min-h-12 flex-wrap items-center gap-x-3 py-0.5 pr-2 pl-4">
          <span className="inline-flex w-[18px] shrink-0 justify-center">
            {trainingClass.done ? (
              <HugeiconsIcon
                icon={Tick02Icon}
                size={16}
                strokeWidth={2.5}
                className="text-teal-deep"
                aria-label={t('classGroups.show.status.done')}
              />
            ) : (
              <span className="box-border size-2.5 rounded-full border-2 border-ring-muted" />
            )}
          </span>
          <Link
            href={classPath(trainingClass.id)}
            className={`w-16 shrink-0 font-dash-mono text-meta font-semibold text-ink underline-offset-2 hover:underline ${trainingClass.skipped ? 'line-through' : ''}`}
          >
            {t('classGroups.classNumber', { n: trainingClass.number })}
          </Link>
          <span className="w-[92px] shrink-0 text-sm font-bold">{formatShortDay(trainingClass.date, t)}</span>
          <span className="w-24 shrink-0 font-dash-mono text-xs text-muted-strong">
            {formatTimeRange(trainingClass.startTime, duration)}
          </span>
          <span className="flex min-w-0 flex-[1_1_140px] flex-wrap items-center gap-1.5 text-xs text-muted-strong">
            {t('classGroups.show.exercisesOf', { count: trainingClass.exercises.length, suggested: exercisesPerClass })}
            {(status === 'today' || status === 'skipped' || status === 'toMark') && <StatusTag status={status} />}
            {trainingClass.kind === 'assessment' && <AssessmentTag />}
          </span>
          <button
            type="button"
            aria-expanded={actionsOpen}
            onClick={() => setActionsOpen(!actionsOpen)}
            aria-label={t('classGroups.show.moreActions', {
              n: trainingClass.number,
              date: formatLongDay(trainingClass.date, locale),
            })}
            className="ml-auto inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-mist"
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} size={16} strokeWidth={2} aria-hidden />
          </button>
        </div>
        {actionsOpen && (
          <div className="px-4 pb-3 sm:pl-[118px]">
            <ClassActions trainingClass={trainingClass} />
          </div>
        )}
      </li>
    </>
  )
}
