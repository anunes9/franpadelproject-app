import { router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { formatDate } from '@/lib/classGroups'
import { classGroupRegenerationPath } from '@/lib/paths'
import { buttonClass, type ErrorCopy, FieldError } from './ui'

// Regenerating a group's Training Plan, only when asked and only after
// confirming (docs/adr/0005-regenerating-a-plan.md). Done Classes are kept;
// every other Class is replaced, with its picked Exercises.

// What the group's page holds after a refused regeneration (see
// PlanRegenerationsController): its errors and clashing dates, and the
// marker that says the refused edit was a regeneration.
interface RefusalProps {
  [key: string]: unknown
  errors: Record<string, unknown>
  clashDates: string[]
  refusedEdit: string | null
  regenerationEdit: string
}

// Fields whose refusal is about the plan rather than the group's settings.
const PLAN_FIELDS = ['base', 'level']

export function RegeneratePlan({ classGroupId }: { classGroupId: string }) {
  const { t, locale } = useTranslation()
  const { errors, clashDates, refusedEdit, regenerationEdit } = usePage<RefusalProps>().props
  const [confirming, setConfirming] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const refused = refusedEdit === regenerationEdit
  const dates = (clashDates ?? []).map((date) => formatDate(date, locale)).join(', ')

  // Regeneration validates the whole group first, so a refusal can name any
  // of its fields: our copy for the codes we know, the server's otherwise.
  const refusalFields = Object.keys(errors ?? {})
  const invalidGroup = refusalFields.some((field) => !PLAN_FIELDS.includes(field))
  const copy: Record<string, ErrorCopy> = {
    base: {
      clash: t('classGroups.planRegeneration.errors.clash', { dates }),
      plan_complete: t('classGroups.planRegeneration.errors.planComplete'),
      not_saved: t('classGroups.planRegeneration.errors.notSaved'),
    },
    level: { no_modules: t('classGroups.planRegeneration.errors.noModules') },
    players: {
      other_club: t('classGroups.planRegeneration.errors.playersOtherClub'),
      blank: t('classGroups.planRegeneration.errors.playersBlank'),
      too_many: t('classGroups.planRegeneration.errors.playersTooMany'),
    },
    weekdays: { cadence_mismatch: t('classGroups.planRegeneration.errors.weekdays') },
    start_time: {
      blank: t('classGroups.planRegeneration.errors.time'),
      crosses_midnight: t('classGroups.planRegeneration.errors.crossesMidnight'),
    },
    coach: { not_a_coach: t('classGroups.planRegeneration.errors.notACoach') },
  }

  function regenerate() {
    setRegenerating(true)
    router.post(
      classGroupRegenerationPath(classGroupId),
      {},
      {
        preserveScroll: true,
        preserveState: 'errors',
        onSuccess: () => setConfirming(false),
        onFinish: () => setRegenerating(false),
      }
    )
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="regenerate-plan-title">
      <div className="flex flex-col gap-0.5">
        <h2 id="regenerate-plan-title" className="text-sm font-bold text-ink">
          {t('classGroups.planRegeneration.title')}
        </h2>
        <p className="text-meta text-muted">{t('classGroups.planRegeneration.hint')}</p>
      </div>

      {confirming ? (
        <div
          role="alertdialog"
          aria-labelledby="regenerate-plan-confirm"
          className="flex flex-col gap-4 rounded-[18px] border border-line bg-white p-5 shadow-card"
        >
          <div className="flex flex-col gap-2 text-sm text-ink">
            <p id="regenerate-plan-confirm" className="font-semibold">
              {t('classGroups.planRegeneration.confirmTitle')}
            </p>
            <p>{t('classGroups.planRegeneration.confirmReplaced')}</p>
            <p>{t('classGroups.planRegeneration.confirmKept')}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setConfirming(false)} className={buttonClass('secondary')}>
              {t('classGroups.planRegeneration.cancel')}
            </button>
            <button type="button" disabled={regenerating} onClick={regenerate} className={buttonClass('danger')}>
              {regenerating
                ? t('classGroups.planRegeneration.regenerating')
                : t('classGroups.planRegeneration.confirm')}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className={buttonClass('secondary', 'self-start')}>
          {t('classGroups.planRegeneration.button')}
        </button>
      )}

      {refused && (
        <div className="flex flex-col gap-1">
          {invalidGroup && (
            <p role="alert" className="text-meta font-normal text-danger">
              {t('classGroups.planRegeneration.errors.invalidGroup')}
            </p>
          )}
          {refusalFields.map((field) => (
            <FieldError key={field} errors={errors ?? {}} field={field} copy={copy[field] ?? {}} />
          ))}
        </div>
      )}
    </section>
  )
}
