import { Link } from '@inertiajs/react'
import { useTranslation } from '@/i18n/useTranslation'
import { formatWeeklyTime, groupName } from '@/lib/classGroups'
import { classGroupPath } from '@/lib/paths'
import type { ClassGroupListItem } from '../types/dashboard-data'
import { FinishedPill } from './FinishedGroups'
import { ListRow } from './ui'

// A Class Group in a ListCard: its name (or Level), weekly time and Players,
// linking to its Training Plan, and whether it is finished. A named group
// shows its Level among the details. `withCoach` adds the Coach,
// for the Club overview.
export function ClassGroupRow({ group, withCoach = false }: { group: ClassGroupListItem; withCoach?: boolean }) {
  const { t, tn } = useTranslation()
  const details = [formatWeeklyTime(t, group), tn('classGroups.playersCount', group.playerCount)]
  if (group.name) details.unshift(t(`players.levelOption.${group.level}`))
  if (withCoach) details.unshift(group.coach)

  return (
    <ListRow>
      <Link
        href={classGroupPath(group.id)}
        className="-my-3.5 flex min-h-11 min-w-0 flex-1 flex-col justify-center py-3.5 hover:text-teal-deep"
      >
        <span className="truncate text-sm font-semibold text-ink">{groupName(t, group)}</span>
        <span className="text-meta text-muted">{details.join(' · ')}</span>
      </Link>
      {group.finished && <FinishedPill />}
    </ListRow>
  )
}
