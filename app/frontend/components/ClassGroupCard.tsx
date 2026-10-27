import { Calendar03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link } from '@inertiajs/react'
import { useTranslation } from '@/i18n/useTranslation'
import { formatShortDay, formatWeeklyTime, groupName } from '@/lib/classGroups'
import { classGroupPath } from '@/lib/paths'
import type { ClassGroupCard as Card } from '../types/dashboard-data'
import { ModuleLine, ModuleSegments } from './PlanProgress'

// A Class Group on the Coach's Class Groups page: its name and Level, weekly
// time, Players, how far its plan has got and its next Class, linking to it.
export function ClassGroupCard({ group, today }: { group: Card; today: string }) {
  const { t, tn } = useTranslation()
  const next = group.progress.nextClass
  const nextDay = next && (next.date === today ? t('classGroups.today') : formatShortDay(next.date, t))

  return (
    <Link
      href={classGroupPath(group.id)}
      className="flex flex-col gap-4 rounded-[18px] border border-line bg-white p-5 text-ink shadow-card transition-[border-color,box-shadow] duration-150 hover:border-teal hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-lg font-extrabold tracking-tight">{groupName(t, group)}</span>
          <span className="w-fit rounded-full bg-mist px-2 py-0.5 font-dash-mono text-label uppercase text-muted-strong">
            {t(`players.levelOption.${group.level}`)}
          </span>
          <span className="font-dash-mono text-meta text-muted-strong">{formatWeeklyTime(t, group)}</span>
        </div>
        <span className="whitespace-nowrap text-meta text-muted-strong">
          {tn('classGroups.playersCount', group.playerCount)}
        </span>
      </div>

      {group.playerNames.length > 0 && (
        <ul aria-label={t('classGroups.show.players')} className="flex flex-wrap gap-1.5">
          {group.playerNames.map((name) => (
            <li key={name} className="rounded-full border border-line bg-paper px-2.5 py-1 text-xs text-ink">
              {name}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <ModuleLine progress={group.progress} />
        <ModuleSegments progress={group.progress} />
      </div>

      <div className="flex items-center gap-2.5 border-t border-mist pt-3.5 text-meta">
        <HugeiconsIcon icon={Calendar03Icon} size={16} strokeWidth={1.75} className="text-teal-deep" aria-hidden />
        <span className="text-muted-strong">{t('classGroups.index.nextClass')}</span>
        <span className="font-bold">
          {next
            ? `${nextDay}, ${next.startTime} · ${t('classGroups.classNumber', { n: next.number })}`
            : t('classGroups.index.noNextClass')}
        </span>
      </div>
    </Link>
  )
}
