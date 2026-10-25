import { router, usePage } from '@inertiajs/react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { formatDate } from '@/lib/classGroups'
import { classGroupReassignmentPath } from '@/lib/paths'
import type { CoachOption } from '../types/dashboard-data'
import { buttonClass, type ErrorCopy, FieldError, INPUT_CLASS, LABEL_CLASS, SectionHeading } from './ui'

// Reassigning a Class Group to another Coach of its Club, for its Club
// Managers only (docs/adr/0006-manager-oversight.md). The plan is kept; the
// new Coach must have no Class at the same time as the group's upcoming ones.

// What the group's page holds for reassigning it (see ClassGroupsController
// and ClassGroupReassignmentsController): the Coaches it can go to, and after
// a refused reassignment, its errors and clashing dates, marked as such.
interface ReassignmentProps {
  [key: string]: unknown
  coachOptions: CoachOption[]
  errors: Record<string, unknown>
  clashDates: string[]
  refusedEdit: string | null
  reassignmentEdit: string
}

export function ReassignClassGroup({ classGroupId }: { classGroupId: string }) {
  const { t, locale } = useTranslation()
  const { coachOptions, errors, clashDates, refusedEdit, reassignmentEdit } = usePage<ReassignmentProps>().props
  const [coachId, setCoachId] = useState('')
  const [reassigning, setReassigning] = useState(false)
  // Club Managers only: anyone else is given no Coaches to choose from.
  if (!coachOptions || coachOptions.length === 0) return null

  const refused = refusedEdit === reassignmentEdit
  const dates = (clashDates ?? []).map((date) => formatDate(date, locale)).join(', ')
  const copy: Record<string, ErrorCopy> = {
    base: {
      clash: t('classGroups.reassignment.errors.clash', { dates }),
      not_saved: t('classGroups.reassignment.errors.notSaved'),
    },
    coach: {
      blank: t('classGroups.reassignment.errors.blank'),
      not_a_coach: t('classGroups.reassignment.errors.notACoach'),
      other_club: t('classGroups.reassignment.errors.otherClub'),
      removed: t('classGroups.reassignment.errors.removed'),
    },
  }
  function submit(event: FormEvent) {
    event.preventDefault()
    setReassigning(true)
    router.patch(
      classGroupReassignmentPath(classGroupId),
      { coach_id: coachId },
      {
        preserveScroll: true,
        preserveState: 'errors',
        onSuccess: () => setCoachId(''),
        onFinish: () => setReassigning(false),
      }
    )
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="reassign-group-title">
      <SectionHeading
        id="reassign-group-title"
        title={t('classGroups.reassignment.title')}
        hint={t('classGroups.reassignment.hint')}
      />

      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <label className={`${LABEL_CLASS} min-w-[220px] flex-1`}>
          {t('classGroups.reassignment.label')}
          <select className={INPUT_CLASS} value={coachId} onChange={(event) => setCoachId(event.target.value)} required>
            <option value="" disabled>
              {t('classGroups.reassignment.choose')}
            </option>
            {coachOptions.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={reassigning || coachId === ''} className={buttonClass('secondary')}>
          {reassigning ? t('classGroups.reassignment.reassigning') : t('classGroups.reassignment.button')}
        </button>
      </form>

      {refused && (
        <div className="flex flex-col gap-1">
          {Object.keys(errors ?? {}).map((field) => (
            <FieldError key={field} errors={errors ?? {}} field={field} copy={copy[field] ?? {}} />
          ))}
        </div>
      )}
    </section>
  )
}
