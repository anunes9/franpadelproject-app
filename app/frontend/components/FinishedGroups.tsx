import { Link } from '@inertiajs/react'
import { useTranslation } from '@/i18n/useTranslation'
import { classGroupPath, newClassGroupFromPath } from '@/lib/paths'
import type { ClassGroupLink, PlayerLevel } from '../types/dashboard-data'
import { buttonClass, Pill } from './ui'

// Finished Class Groups, kept as history, and the group that continues one at
// the next Level (docs/adr/0007-finished-class-groups.md).

// Marks a finished group in a list or on its page.
export function FinishedPill() {
  const { t } = useTranslation()
  return <Pill text={t('classGroups.finishedGroups.pill')} variant="muted" />
}

// On a finished group's page, for its Coach: starting the next Level's group
// with its Players, through the normal create form.
export function StartNextLevelGroup({ classGroupId, nextLevel }: { classGroupId: string; nextLevel: PlayerLevel }) {
  const { t } = useTranslation()

  return (
    <section className="flex flex-col gap-3" aria-labelledby="next-level-title">
      <div className="flex flex-col gap-0.5">
        <h2 id="next-level-title" className="text-sm font-bold text-ink">
          {t('classGroups.finishedGroups.nextLevelTitle')}
        </h2>
        <p className="text-meta text-muted">
          {t('classGroups.finishedGroups.nextLevelHint', { level: t(`players.levelOption.${nextLevel}`) })}
        </p>
      </div>
      <Link href={newClassGroupFromPath(classGroupId)} className={buttonClass('primary', 'self-start')}>
        {t('classGroups.finishedGroups.nextLevelButton')}
      </Link>
    </section>
  )
}

// "Continues from the Beginner group", linking to the group continued.
export function ContinuesFrom({ group }: { group: ClassGroupLink }) {
  const { t } = useTranslation()

  return (
    <Link
      href={classGroupPath(group.id)}
      className="self-start text-meta font-semibold text-teal-deep underline-offset-2 hover:text-ink hover:underline"
    >
      {t('classGroups.finishedGroups.continuesFrom', { level: t(`players.levelOption.${group.level}`) })}
    </Link>
  )
}
