import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link } from '@inertiajs/react'
import { useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { addDays, formatDayMonth, groupName, mondayOf, weekdayNames } from '@/lib/classGroups'
import { classGroupsWeekPath, classPath } from '@/lib/paths'
import type { WeekClass } from '../types/dashboard-data'

// A day shows this many Classes, then "+N more".
const SHOWN_PER_DAY = 3

const ROUND_BUTTON =
  'inline-flex size-11 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:border-teal'

// A Coach's week of Classes across their groups, Monday to Sunday, with the
// previous and next weeks a click away. A Coach never has two Classes at the
// same time, so each day's Classes read in start-time order.
export function WeekStrip({ startsOn, classes, today }: { startsOn: string; classes: WeekClass[]; today: string }) {
  const { t, tn } = useTranslation()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const names = weekdayNames(t)
  const days = Array.from({ length: 7 }, (_, i) => addDays(startsOn, i))
  const isThisWeek = mondayOf(today) === startsOn
  const visit = { preserveScroll: true, preserveState: true, only: ['week'] }

  return (
    <section aria-labelledby="week-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="week-title" className="text-sm font-bold text-ink">
          {isThisWeek
            ? t('classGroups.index.weekTitle')
            : t('classGroups.index.weekOf', { date: formatDayMonth(startsOn) })}{' '}
          <span className="font-dash-mono text-meta font-medium text-muted">
            {formatDayMonth(days[0])} – {formatDayMonth(days[6])} ·{' '}
            {tn('classGroups.show.classesCount', classes.length)}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {!isThisWeek && (
            <Link
              href={classGroupsWeekPath(today)}
              {...visit}
              className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-4 text-meta font-semibold text-ink hover:border-teal"
            >
              {t('classGroups.index.backToThisWeek')}
            </Link>
          )}
          <Link
            href={classGroupsWeekPath(addDays(startsOn, -7))}
            {...visit}
            aria-label={t('classGroups.index.previousWeek')}
            className={ROUND_BUTTON}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} aria-hidden />
          </Link>
          <Link
            href={classGroupsWeekPath(addDays(startsOn, 7))}
            {...visit}
            aria-label={t('classGroups.index.nextWeek')}
            className={ROUND_BUTTON}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} aria-hidden />
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[18px] border border-line bg-white shadow-card">
        <div className="grid min-w-[770px] grid-cols-7">
          {days.map((day, i) => {
            const dayClasses = classes.filter((c) => c.date === day)
            const isOpen = expanded[day] ?? false
            const hidden = dayClasses.length - SHOWN_PER_DAY
            const shown = isOpen || hidden <= 0 ? dayClasses : dayClasses.slice(0, SHOWN_PER_DAY)
            const isToday = day === today

            return (
              <div
                key={day}
                className={`flex min-h-[150px] flex-col gap-2 px-2.5 py-3.5 ${i < 6 ? 'border-r border-mist' : ''} ${isToday ? 'bg-today-wash' : ''}`}
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="font-dash-mono text-label uppercase text-muted">{names[i]}</span>
                  <span
                    className={
                      isToday
                        ? 'inline-flex h-[26px] min-w-[26px] items-center justify-center rounded-full bg-ink text-meta font-bold text-paper'
                        : 'text-[15px] font-bold text-ink'
                    }
                  >
                    {Number(day.slice(8))}
                  </span>
                </div>
                {dayClasses.length > 1 && (
                  <span className="font-dash-mono text-label text-muted-strong">
                    {tn('classGroups.show.classesCount', dayClasses.length)}
                  </span>
                )}
                {shown.map((weekClass) => (
                  <WeekItem key={weekClass.id} weekClass={weekClass} isToday={isToday} />
                ))}
                {hidden > 0 && (
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setExpanded({ ...expanded, [day]: !isOpen })}
                    className="min-h-11 self-start rounded-full border border-line bg-white px-3 text-xs font-bold text-ink hover:border-teal"
                  >
                    {isOpen ? t('classGroups.index.showLess') : t('classGroups.index.moreClasses', { count: hidden })}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
      {classes.length === 0 && <p className="text-meta text-muted">{t('classGroups.index.weekEmpty')}</p>}
    </section>
  )
}

// One Class in its day: its time, group, Module and number, linking to it.
function WeekItem({ weekClass, isToday }: { weekClass: WeekClass; isToday: boolean }) {
  const { t } = useTranslation()
  const name = groupName(t, weekClass.group)
  const assessment = weekClass.kind === 'assessment'
  const tone = assessment ? 'border-clay-line bg-clay-wash' : 'border-line bg-mist'

  return (
    <Link
      href={classPath(weekClass.id)}
      aria-label={t('classGroups.index.weekClassLabel', {
        time: weekClass.startTime,
        group: name,
        module: weekClass.moduleNumber,
        n: weekClass.number,
      })}
      className={`flex flex-col gap-0.5 rounded-[10px] border px-2 py-1.5 text-ink transition-colors hover:border-teal ${tone} ${isToday ? 'shadow-[inset_0_0_0_2px_var(--color-ink)]' : ''} ${weekClass.done ? 'opacity-70' : ''}`}
    >
      <span className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="font-dash-mono text-xs font-semibold">{weekClass.startTime}</span>
        <span className="text-meta font-semibold leading-tight">{name}</span>
      </span>
      <span className="text-xs">
        {t('classGroups.show.module', { n: weekClass.moduleNumber })} ·{' '}
        {t('classGroups.classNumber', { n: weekClass.number })}
      </span>
      {assessment && (
        <span className="mt-0.5 self-start rounded-full bg-tint-clay px-2 py-0.5 font-dash-mono text-[10px] uppercase tracking-[0.08em] text-clay-ink">
          {t('classGroups.assessmentTag')}
        </span>
      )}
    </Link>
  )
}
