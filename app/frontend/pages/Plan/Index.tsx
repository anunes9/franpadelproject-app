import { usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { AppShell, PageHeader } from '../../components/shell'
import type { Exercise } from '../../types/dashboard-data'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/translations'

interface Props {
  [key: string]: unknown
  days: string[]
  defaultPlan: Record<string, string[]>
  exercises: Exercise[]
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
        <PageHeader eyebrow={t('plan.index.eyebrow')} title={t('plan.index.title')} />
        <p className="text-[13px] text-muted lg:hidden">
          {picked ? t('plan.index.mobileHintPicked') : t('plan.index.mobileHintDefault')}
        </p>

        {/* Mobile: tap-to-assign tray */}
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:hidden">
          {exercises.map((e) => (
            <button
              key={e.ref}
              type="button"
              onClick={() => setPicked(picked === e.ref ? null : e.ref)}
              className={
                'whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-[transform,box-shadow] duration-150 ' +
                (picked === e.ref
                  ? 'border-teal-deep bg-teal-deep text-paper shadow-card-dark'
                  : 'border-line bg-white text-muted-strong shadow-card')
              }
            >
              {e.title}
            </button>
          ))}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">
          {/* Desktop: draggable library */}
          <div className="hidden flex-col gap-2 rounded-2xl border border-line bg-white p-4 shadow-card lg:flex">
            <span className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              {t('plan.index.exerciseLibrary')}
            </span>
            {exercises.map((e) => (
              <button
                key={e.ref}
                type="button"
                draggable
                onDragStart={() => setDragging(e.ref)}
                onDragEnd={() => setDragging(null)}
                className="cursor-grab rounded-[10px] border border-line px-3 py-2.5 text-left text-[13px] text-ink hover:border-teal hover:bg-paper"
              >
                {e.title}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-7 lg:gap-2.5">
            {days.map((day) => (
              // biome-ignore lint/a11y/useSemanticElements: also a drop target holding nested <button>s, can't itself be one
              <div
                key={day}
                role="button"
                tabIndex={0}
                onClick={() => {
                  add(day, picked)
                  setPicked(null)
                }}
                onKeyDown={(ev) => {
                  if (ev.key !== 'Enter' && ev.key !== ' ') return
                  ev.preventDefault()
                  add(day, picked)
                  setPicked(null)
                }}
                onDragOver={(ev) => ev.preventDefault()}
                onDrop={(ev) => {
                  ev.preventDefault()
                  add(day, dragging)
                  setDragging(null)
                }}
                className="flex flex-col gap-2 rounded-[14px] border border-line bg-white p-3 shadow-card lg:min-h-[320px]"
              >
                <span className="font-dash-mono text-[10px] tracking-[0.1em] text-muted">{t(SHORT_DAY_KEY[day])}</span>
                {plan[day].map((ref) => {
                  const e = getExercise(ref)
                  return (
                    <button
                      key={ref}
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation()
                        remove(day, ref)
                      }}
                      className="flex items-center justify-between gap-2 rounded-[10px] bg-mist p-2.5 text-left text-xs leading-snug text-ink shadow-[0_1px_3px_0_rgba(18,40,63,0.12)]"
                    >
                      <span>{e?.title ?? ref}</span>
                      <span className="text-muted">×</span>
                    </button>
                  )
                })}
                {plan[day].length === 0 ? (
                  <div className="rounded-[10px] border border-dashed border-line px-2 py-4 text-center text-[11px] text-muted-faint">
                    {t('plan.index.dropHere')}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

Index.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Index
