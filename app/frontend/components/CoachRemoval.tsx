import { router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { clubCoachPath } from '@/lib/paths'
import type { ClubCoach } from '../types/dashboard-data'
import { buttonClass, FieldError } from './ui'

// Removing a Coach from the Club overview, after confirming. Removing deletes
// the Coach's account; it is refused while they own Class Groups, which the
// Club Manager reassigns first (docs/adr/0006-manager-oversight.md).

// What the overview holds after a refused removal (see ClubCoachesController):
// its errors, and which Coach it was.
interface RefusalProps {
  [key: string]: unknown
  errors: Record<string, unknown>
  refusedCoachId: string | null
}

export function RemoveCoach({ clubId, coach }: { clubId: string; coach: ClubCoach }) {
  const { t } = useTranslation()
  const { errors, refusedCoachId } = usePage<RefusalProps>().props
  const [confirming, setConfirming] = useState(false)
  const [removing, setRemoving] = useState(false)
  const refused = refusedCoachId === coach.id

  function remove() {
    setRemoving(true)
    router.delete(clubCoachPath(clubId, coach.id), {
      preserveScroll: true,
      onFinish: () => {
        setRemoving(false)
        setConfirming(false)
      },
    })
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {confirming ? (
        <div role="alertdialog" aria-label={t('clubs.coachRemoval.confirmButton')} className="flex flex-col gap-2">
          <p className="text-meta text-ink">{t('clubs.coachRemoval.confirm', { name: coach.name })}</p>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setConfirming(false)} className={buttonClass('secondary')}>
              {t('clubs.coachRemoval.cancel')}
            </button>
            <button type="button" disabled={removing} onClick={remove} className={buttonClass('danger')}>
              {removing ? t('clubs.coachRemoval.removing') : t('clubs.coachRemoval.confirmButton')}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className={buttonClass('danger')}>
          {t('clubs.coachRemoval.remove')}
        </button>
      )}
      {refused && (
        <FieldError
          errors={errors ?? {}}
          field="base"
          copy={{ has_class_groups: t('clubs.coachRemoval.hasClassGroups', { name: coach.name }) }}
        />
      )}
    </div>
  )
}
