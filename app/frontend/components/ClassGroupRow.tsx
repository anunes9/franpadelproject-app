import { Link } from '@inertiajs/react'
import { useTranslation } from '@/i18n/useTranslation'
import { formatWeeklyTime } from '@/lib/classGroups'
import { classGroupPath } from '@/lib/paths'
import type { ClassGroupListItem } from '../types/dashboard-data'
import { FinishedPill } from './FinishedGroups'
import { ListRow } from './ui'

// A Class Group in a ListCard: its Level, weekly time and Players, linking to
// its Training Plan, and whether it is finished. `withCoach` adds the Coach,
// for the Club overview.
export function ClassGroupRow({ group, withCoach = false }: { group: ClassGroupListItem; withCoach?: boolean }) {
  const { t, tn } = useTranslation()
  const details = [formatWeeklyTime(t, group), tn('classGroups.playersCount', group.playerCount)]
  if (withCoach) details.unshift(group.coach)

  return (
    <ListRow>
      <Link
        href={classGroupPath(group.id)}
        className="-my-3.5 flex min-h-11 min-w-0 flex-1 flex-col justify-center py-3.5 hover:text-teal-deep"
      >
        <span className="truncate text-sm font-semibold text-ink">{t(`players.levelOption.${group.level}`)}</span>
        <span className="text-meta text-muted">{details.join(' · ')}</span>
      </Link>
      {group.finished && <FinishedPill />}
    </ListRow>
  )
}
