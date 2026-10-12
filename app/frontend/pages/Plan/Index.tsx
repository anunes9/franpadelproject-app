import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import type { TranslationKey } from '@/i18n/translations'
import { useTranslation } from '@/i18n/useTranslation'
import { AppShell, PageHeader } from '../../components/shell'
import { chipClass } from '../../components/ui'
import type { Exercise } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  days: string[]
  defaultPlan: Record<string, string[]>
  exercises: Pick<Exercise, 'ref' | 'title'>[]
  preselectedExercise: string | null
}

const SHORT_DAY_KEY: Record<string, TranslationKey> = {
  Monday: 'common.days.short.mon',
  Tuesday: 'common.days.short.tue',
  Wednesday: 'common.days.short.wed',
  Thursday: 'common.days.short.thu',
  Friday: 'common.days.short.fri',
  Saturday: 'common.days.short.sat',
  Sunday: 'common.days.short.sun',
}

const LONG_DAY_KEY: Record<string, TranslationKey> = {
  Monday: 'common.days.long.monday',
  Tuesday: 'common.days.long.tuesday',
  Wednesday: 'common.days.long.wednesday',
  Thursday: 'common.days.long.thursday',
  Friday: 'common.days.long.friday',
  Saturday: 'common.days.long.saturday',
  Sunday: 'common.days.long.sunday',
}

function Index() {
  const { days, defaultPlan, exercises, preselectedExercise } = usePage<Props>().props
  const { t } = useTranslation()
  const [plan, setPlan] = useState<Record<string, string[]>>(defaultPlan)
  const [dragging, setDragging] = useState<string | null>(null)
  const [picked, setPicked] = useState<string | null>(() =>
    preselectedExercise && exercises.some((e) => e.ref === preselectedExercise) ? preselectedExercise : null
  )

  const getExercise = (ref: string) => exercises.find((e) => e.ref === ref)

  const add = (day: string, ref: string | null) => {
    if (!ref || plan[day].includes(ref)) return
    setPlan({ ...plan, [day]: [...plan[day], ref] })
  }

  const remove = (day: string, ref: string) => setPlan({ ...plan, [day]: plan[day].filter((r) => r !== ref) })

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-5">
        <PageHeader title={t('plan.index.title')} />
        <div className="flex flex-col gap-1">
          <p className="text-meta text-muted-strong" aria-live="polite">
            {picked ? t('plan.index.hintPicked') : t('plan.index.hintDefault')}
          </p>
          <p className="text-meta text-muted-strong">{t('plan.index.notSaved')}</p>
        </div>

        {/* Mobile: tap-to-assign tray */}
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:hidden">
          {exercises.map((e) => (
            <button
              key={e.ref}
              type="button"
              onClick={() => setPicked(picked === e.ref ? null : e.ref)}
              aria-pressed={picked === e.ref}
              className={chipClass(picked === e.ref)}
            >
              {e.title}
            </button>
          ))}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">
          {/* Desktop: draggable library */}
          <div className="hidden flex-col gap-2 rounded-2xl border border-line bg-white p-4 shadow-card lg:flex">
            <span className="font-dash-mono text-label uppercase text-muted">{t('plan.index.exerciseLibrary')}</span>
            {exercises.map((e) => (
              <button
                key={e.ref}
                type="button"
                draggable
                onDragStart={() => setDragging(e.ref)}
                onDragEnd={() => setDragging(null)}
                onClick={() => setPicked(picked === e.ref ? null : e.ref)}
                aria-pressed={picked === e.ref}
                className={
                  'cursor-grab rounded-[10px] border px-3 py-2.5 text-left text-meta ' +
                  (picked === e.ref
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line text-ink hover:border-teal hover:bg-paper')
                }
              >
                {e.title}
              </button>
            ))}
          </div>

          <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))]">
            {days.map((day) => (
              // The whole cell is a drop target. Placing a picked Exercise goes
              // through a real <button> stretched under the cell's contents, a
              // sibling of the remove buttons rather than their parent.
              <section
                key={day}
                aria-labelledby={`day-${day}`}
                onDragOver={(ev) => ev.preventDefault()}
                onDrop={(ev) => {
                  ev.preventDefault()
                  add(day, dragging)
                  setDragging(null)
                }}
                className={
                  'relative flex min-w-0 flex-col gap-2 rounded-[14px] border bg-white p-3 shadow-card lg:min-h-40 ' +
                  (picked ? 'border-teal' : 'border-line')
                }
              >
                <button
                  type="button"
                  disabled={!picked}
                  onClick={() => {
                    add(day, picked)
                    setPicked(null)
                  }}
                  aria-label={t('plan.index.addToDay', { day: t(LONG_DAY_KEY[day]) })}
                  className="absolute inset-0 rounded-[14px] enabled:cursor-pointer enabled:hover:bg-paper disabled:cursor-default"
                />
                <h2 id={`day-${day}`} className="pointer-events-none relative font-dash-mono text-label text-muted">
                  <span aria-hidden>{t(SHORT_DAY_KEY[day])}</span>
                  <span className="sr-only">{t(LONG_DAY_KEY[day])}</span>
                </h2>
                {plan[day].map((ref) => {
                  const e = getExercise(ref)
                  return (
                    <button
                      key={ref}
                      type="button"
                      onClick={() => remove(day, ref)}
                      aria-label={t('plan.index.removeFromDay', {
                        exercise: e?.title ?? ref,
                        day: t(LONG_DAY_KEY[day]),
                      })}
                      className="relative flex items-start justify-between gap-2 rounded-[10px] bg-mist p-2.5 pointer-coarse:min-h-11 pointer-coarse:items-center text-left text-xs leading-snug text-ink shadow-chip"
                    >
                      <span className="min-w-0 break-words">{e?.title ?? ref}</span>
                      <HugeiconsIcon
                        icon={Cancel01Icon}
                        size={14}
                        strokeWidth={1.75}
                        className="shrink-0 text-muted-strong"
                        aria-hidden
                      />
                    </button>
                  )
                })}
                {plan[day].length === 0 ? (
                  <p className="pointer-events-none relative rounded-[10px] border border-dashed border-line px-2 py-4 text-center text-xs text-muted">
                    {t('plan.index.nothingPlanned')}
                  </p>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

Index.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Index
