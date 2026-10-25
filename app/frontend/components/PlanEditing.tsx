import { router, useForm, usePage } from '@inertiajs/react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { formatDate } from '@/lib/classGroups'
import { type ClassEdit, classGroupClassesPath, classPath } from '@/lib/paths'
import type { ModuleOption, TrainingClass } from '../types/dashboard-data'
import { buttonClass, chipClass, FieldError, INPUT_CLASS, LABEL_CLASS, Pill, SectionHeading } from './ui'

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

// A Class's row actions: mark it done, skip or unskip it, and move it to
// another date or start time.
export function ClassActions({ trainingClass }: { trainingClass: TrainingClass }) {
  const { t } = useTranslation()
  const [moving, setMoving] = useState(false)
  const [editing, setEditing] = useState(false)
  const form = useForm({ date: trainingClass.date, start_time: trainingClass.startTime })
  form.transform((fields) => ({ training_class: fields }))

  function edit(action: ClassEdit) {
    setEditing(true)
    router.patch(classPath(trainingClass.id, action), {}, { ...EDIT_OPTIONS, onFinish: () => setEditing(false) })
  }

  function move(event: FormEvent) {
    event.preventDefault()
    form.patch(classPath(trainingClass.id), { ...EDIT_OPTIONS, onSuccess: () => setMoving(false) })
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {trainingClass.coachAdded && <Pill text={t('classGroups.planEditing.coachAdded')} variant="muted" />}
        <button
          type="button"
          aria-pressed={trainingClass.done}
          title={t(trainingClass.done ? 'classGroups.planEditing.markUndone' : 'classGroups.planEditing.markDone')}
          disabled={editing || trainingClass.skipped}
          onClick={() => edit(trainingClass.done ? 'undone' : 'done')}
          className={chipClass(trainingClass.done, 'disabled:opacity-50')}
        >
          {t('classGroups.planEditing.done')}
        </button>
        <button
          type="button"
          aria-pressed={trainingClass.skipped}
          title={trainingClass.skipped ? t('classGroups.planEditing.unskip') : undefined}
          disabled={editing}
          onClick={() => edit(trainingClass.skipped ? 'unskip' : 'skip')}
          className={chipClass(trainingClass.skipped, 'disabled:opacity-50')}
        >
          {t(trainingClass.skipped ? 'classGroups.planEditing.skipped' : 'classGroups.planEditing.skip')}
        </button>
        <button type="button" aria-expanded={moving} onClick={() => setMoving(!moving)} className={chipClass(moving)}>
          {t('classGroups.planEditing.move')}
        </button>
      </div>

      {moving && (
        <form
          onSubmit={move}
          noValidate
          aria-label={t('classGroups.planEditing.moveTitle')}
          className="flex w-44 flex-col gap-2"
        >
          <label className={LABEL_CLASS}>
            {t('classGroups.planEditing.date')}
            <input
              type="date"
              value={form.data.date}
              onChange={(event) => form.setData('date', event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <label className={LABEL_CLASS}>
            {t('classGroups.planEditing.startTime')}
            <input
              type="time"
              step={300}
              value={form.data.start_time}
              onChange={(event) => form.setData('start_time', event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <div className="flex justify-end gap-1.5">
            <button type="button" onClick={() => setMoving(false)} className={chipClass(false)}>
              {t('classGroups.planEditing.cancel')}
            </button>
            <button type="submit" disabled={form.processing} className={chipClass(true)}>
              {form.processing ? t('classGroups.planEditing.saving') : t('classGroups.planEditing.save')}
            </button>
          </div>
        </form>
      )}

      <div className="flex max-w-60 flex-col items-end text-right">
        <Refusal target={trainingClass.id} />
      </div>
    </div>
  )
}

// Adds a regular Class of the Coach's own to the plan, for a Module of the
// group's Course. It lasts as long as the group's Classes.
export function AddClassForm({ classGroupId, moduleOptions }: { classGroupId: string; moduleOptions: ModuleOption[] }) {
  const { t } = useTranslation()
  const form = useForm({ date: '', start_time: '', course_module_id: moduleOptions[0]?.id ?? '' })
  form.transform((fields) => ({ training_class: fields }))

  function add(event: FormEvent) {
    event.preventDefault()
    form.post(classGroupClassesPath(classGroupId), { ...EDIT_OPTIONS, onSuccess: () => form.reset() })
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="add-class-title">
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
