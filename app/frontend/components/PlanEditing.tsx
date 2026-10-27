import { router, useForm, usePage } from '@inertiajs/react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { formatDate } from '@/lib/classGroups'
import { type ClassEdit, classGroupClassesPath, classPath } from '@/lib/paths'
import type { ModuleOption, TrainingClass } from '../types/dashboard-data'
import { buttonClass, FieldError, INPUT_CLASS, LABEL_CLASS, Pill, SectionHeading } from './ui'

// Editing a Training Plan on the group's page: each Class's row actions, and
// the form that adds a Class. The owning Coach and the Club Managers of the
// group's Club edit; nobody else sees the page.

// What the group's page holds after a refused edit (see
// TrainingClassesController): its errors, the clashing dates, and which edit
// it was, a Class's id or "new" for an added Class.
interface RefusalProps {
  [key: string]: unknown
  errors: Record<string, unknown>
  clashDates: string[]
  refusedEdit: string | null
}

const NEW_CLASS = 'new'

// Whether the last refused edit was adding a Class, so its form stays open.
export function useAddClassRefused() {
  return useRefusal(NEW_CLASS) !== null
}
const EDIT_OPTIONS = { preserveScroll: true, preserveState: 'errors' } as const

// The errors and clashing dates of the last refused edit, if it was `target`'s.
function useRefusal(target: string) {
  const { errors, clashDates, refusedEdit } = usePage<RefusalProps>().props
  return refusedEdit === target ? { errors: errors ?? {}, clashDates: clashDates ?? [] } : null
}

// Why an edit was refused: our copy for the codes we know, the clash with
// its dates.
function Refusal({ target }: { target: string }) {
  const { t, locale } = useTranslation()
  const refusal = useRefusal(target)
  if (!refusal) return null

  const { errors, clashDates } = refusal
  const dates = clashDates.map((date) => formatDate(date, locale)).join(', ')
  return (
    <>
      <FieldError errors={errors} field="date" copy={{ blank: t('classGroups.planEditing.errors.date') }} />
      <FieldError
        errors={errors}
        field="start_time"
        copy={{
          blank: t('classGroups.planEditing.errors.time'),
          crosses_midnight: t('classGroups.planEditing.errors.crossesMidnight'),
        }}
      />
      <FieldError
        errors={errors}
        field="course_module"
        copy={{
          required: t('classGroups.planEditing.errors.module'),
          other_course: t('classGroups.planEditing.errors.module'),
        }}
      />
      <FieldError errors={errors} field="done" copy={{ skipped: t('classGroups.planEditing.errors.doneSkipped') }} />
      <FieldError errors={errors} field="skipped" copy={{ done: t('classGroups.planEditing.errors.skippedDone') }} />
      <FieldError errors={errors} field="base" copy={{ clash: t('classGroups.planEditing.errors.clash', { dates }) }} />
    </>
  )
}

// The pill buttons of a Class's actions, on a light surface or on ink.
const ACTION =
  'inline-flex min-h-11 items-center justify-center rounded-full px-4 text-meta font-semibold disabled:opacity-50'
const ACTION_STYLES = {
  light: {
    primary: `${ACTION} bg-ink text-paper`,
    secondary: `${ACTION} border border-line bg-white text-ink hover:border-teal`,
    danger: `${ACTION} border border-line bg-white text-danger hover:border-teal`,
  },
  dark: {
    primary: `${ACTION} border border-ink-edge text-paper hover:border-paper`,
    secondary: `${ACTION} border border-ink-edge text-paper hover:border-paper`,
    danger: `${ACTION} border border-ink-edge text-paper hover:border-paper`,
  },
} as const

// A Class's actions: mark it done or not done, skip or unskip it, and move it
// to another date or start time. `doneOnly` keeps just the first, and `tone`
// sets the surface they sit on.
export function ClassActions({
  trainingClass,
  tone = 'light',
  doneOnly = false,
  align = 'start',
}: {
  trainingClass: Pick<TrainingClass, 'id' | 'date' | 'startTime' | 'done' | 'skipped' | 'coachAdded'>
  tone?: keyof typeof ACTION_STYLES
  doneOnly?: boolean
  align?: 'start' | 'end'
}) {
  const { t } = useTranslation()
  const [moving, setMoving] = useState(false)
  const [editing, setEditing] = useState(false)
  const form = useForm({ date: trainingClass.date, start_time: trainingClass.startTime })
  form.transform((fields) => ({ training_class: fields }))
  const styles = ACTION_STYLES[tone]
  const justify = align === 'end' ? 'justify-end' : 'justify-start'

  function edit(action: ClassEdit) {
    setEditing(true)
    router.patch(classPath(trainingClass.id, action), {}, { ...EDIT_OPTIONS, onFinish: () => setEditing(false) })
  }

  function move(event: FormEvent) {
    event.preventDefault()
    form.patch(classPath(trainingClass.id), { ...EDIT_OPTIONS, onSuccess: () => setMoving(false) })
  }

  return (
    <div className={`flex flex-col gap-2 ${align === 'end' ? 'items-end' : 'items-start'}`}>
      <div className={`flex flex-wrap items-center gap-2 ${justify}`}>
        {!doneOnly && trainingClass.coachAdded && (
          <Pill text={t('classGroups.planEditing.coachAdded')} variant="muted" />
        )}
        {!trainingClass.skipped && (
          <button
            type="button"
            disabled={editing}
            onClick={() => edit(trainingClass.done ? 'undone' : 'done')}
            className={trainingClass.done ? styles.secondary : styles.primary}
          >
            {t(trainingClass.done ? 'classGroups.planEditing.markUndone' : 'classGroups.planEditing.markDone')}
          </button>
        )}
        {!doneOnly && (
          <>
            {!trainingClass.skipped && (
              <button
                type="button"
                aria-expanded={moving}
                onClick={() => setMoving(!moving)}
                className={styles.secondary}
              >
                {t('classGroups.planEditing.move')}
              </button>
            )}
            {!trainingClass.done && (
              <button
                type="button"
                disabled={editing}
                onClick={() => edit(trainingClass.skipped ? 'unskip' : 'skip')}
                className={trainingClass.skipped ? styles.secondary : styles.danger}
              >
                {t(trainingClass.skipped ? 'classGroups.planEditing.unskip' : 'classGroups.planEditing.skip')}
              </button>
            )}
          </>
        )}
      </div>

      {moving && (
        <form
          onSubmit={move}
          noValidate
          aria-label={t('classGroups.planEditing.moveTitle')}
          className="flex flex-wrap items-end gap-2"
        >
          <label className={`${LABEL_CLASS} ${tone === 'dark' ? 'text-paper' : ''}`}>
            {t('classGroups.planEditing.date')}
            <input
              type="date"
              value={form.data.date}
              onChange={(event) => form.setData('date', event.target.value)}
              className={`${INPUT_CLASS} min-h-11`}
            />
          </label>
          <label className={`${LABEL_CLASS} ${tone === 'dark' ? 'text-paper' : ''}`}>
            {t('classGroups.planEditing.startTime')}
            <input
              type="time"
              step={300}
              value={form.data.start_time}
              onChange={(event) => form.setData('start_time', event.target.value)}
              className={`${INPUT_CLASS} min-h-11`}
            />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setMoving(false)} className={styles.secondary}>
              {t('classGroups.planEditing.cancel')}
            </button>
            <button type="submit" disabled={form.processing} className={ACTION_STYLES.light.primary}>
              {form.processing ? t('classGroups.planEditing.saving') : t('classGroups.planEditing.save')}
            </button>
          </div>
        </form>
      )}

      <div className={`flex max-w-80 flex-col ${align === 'end' ? 'items-end text-right' : ''}`}>
        <Refusal target={trainingClass.id} />
      </div>
    </div>
  )
}

// Adds a regular Class of the Coach's own to the plan, for a Module of the
// group's Course. It lasts as long as the group's Classes.
// `initialDate` prefills its date, `initialStartTime` its start time.
export function AddClassForm({
  classGroupId,
  moduleOptions,
  initialDate = '',
  initialStartTime = '',
}: {
  classGroupId: string
  moduleOptions: ModuleOption[]
  initialDate?: string
  initialStartTime?: string
}) {
  const { t } = useTranslation()
  const form = useForm({
    date: initialDate,
    start_time: initialStartTime,
    course_module_id: moduleOptions[0]?.id ?? '',
  })
  form.transform((fields) => ({ training_class: fields }))

  function add(event: FormEvent) {
    event.preventDefault()
    form.post(classGroupClassesPath(classGroupId), { ...EDIT_OPTIONS, onSuccess: () => form.reset() })
  }

  return (
    <section id="add-class" className="flex scroll-mt-6 flex-col gap-3" aria-labelledby="add-class-title">
      <SectionHeading
        id="add-class-title"
        title={t('classGroups.planEditing.addTitle')}
        hint={t('classGroups.planEditing.addHint')}
      />
      <form
        onSubmit={add}
        noValidate
        className="flex flex-col gap-4 rounded-[18px] border border-line bg-white p-5 shadow-card"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <label className={LABEL_CLASS}>
            {t('classGroups.planEditing.date')}
            <input
              type="date"
              value={form.data.date}
              onChange={(event) => form.setData('date', event.target.value)}
              className={`${INPUT_CLASS} min-h-11`}
            />
          </label>
          <label className={LABEL_CLASS}>
            {t('classGroups.planEditing.startTime')}
            <input
              type="time"
              step={300}
              value={form.data.start_time}
              onChange={(event) => form.setData('start_time', event.target.value)}
              className={`${INPUT_CLASS} min-h-11`}
            />
          </label>
          <label className={LABEL_CLASS}>
            {t('classGroups.planEditing.module')}
            <select
              value={form.data.course_module_id}
              onChange={(event) => form.setData('course_module_id', event.target.value)}
              className={`${INPUT_CLASS} min-h-11`}
            >
              {moduleOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.number}. {option.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Refusal target={NEW_CLASS} />
        <button type="submit" disabled={form.processing} className={buttonClass('primary')}>
          {form.processing ? t('classGroups.planEditing.saving') : t('classGroups.planEditing.add')}
        </button>
      </form>
    </section>
  )
}
