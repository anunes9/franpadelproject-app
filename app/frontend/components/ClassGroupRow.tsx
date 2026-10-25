import { Link } from '@inertiajs/react'
import { useTranslation } from '@/i18n/useTranslation'
import { formatSchedule } from '@/lib/classGroups'
import { classGroupPath } from '@/lib/paths'
import type { ClassGroupListItem } from '../types/dashboard-data'
import { ListRow } from './ui'

// A Class Group in a ListCard: its Level, schedule and Players, linking to
// its Training Plan. `withCoach` adds the Coach, for the Club overview.
export function ClassGroupRow({ group, withCoach = false }: { group: ClassGroupListItem; withCoach?: boolean }) {
  const { t, tn } = useTranslation()
  const details = [formatSchedule(t, group), tn('classGroups.playersCount', group.playerCount)]
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
    </ListRow>
  )
}
