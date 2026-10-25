import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { AppShell, PageHeader } from '../../components/shell'
import { buttonClass, chipClass, Eyebrow } from '../../components/ui'
import type { ClassGroupSummary, ClubCoach, ClubSummary, DashboardUser, Player } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  dashboardUser: DashboardUser
  // Null while the Manager is not linked to any Club.
  club: ClubSummary | null
  coaches: ClubCoach[]
  classGroups: ClassGroupSummary[]
  players: Player[]
}

const cardClass = 'rounded-[18px] border border-line bg-white px-5 py-2 shadow-card'

function Section({
  title,
  count,
  empty,
  action,
  children,
}: {
  title: string
  count: number
  empty: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold text-ink">
          {title} <span className="font-dash-mono text-meta font-semibold text-muted">{count}</span>
        </h2>
        {action}
      </div>
      {count === 0 ? (
        <p className="rounded-[18px] border border-line bg-white px-5 py-6 text-center text-sm text-muted shadow-card">
          {empty}
        </p>
      ) : (
        <ul className={cardClass}>{children}</ul>
      )}
    </section>
  )
}

function ClubSwitcher({ clubs, current }: { clubs: ClubSummary[]; current: ClubSummary }) {
  const { t } = useTranslation()
  if (clubs.length < 2) return null

  return (
    <nav aria-label={t('clubs.overview.switcherLabel')} className="flex flex-wrap gap-2">
      {clubs.map((club) => {
        const on = club.id === current.id
        return (
          <Link
            key={club.id}
            href={`/dashboard/clubs/${club.id}`}
            aria-current={on ? 'page' : undefined}
            className={chipClass(on)}
          >
            {club.name}
          </Link>
        )
      })}
    </nav>
  )
}

const rowClass = 'flex items-center justify-between gap-4 border-b border-track py-3.5 last:border-0'

function Show() {
  const { dashboardUser, club, coaches, classGroups, players } = usePage<Props>().props
  const { t } = useTranslation()

  if (!club) {
    return (
      <div className="px-5 pt-6 lg:px-10 lg:pt-9">
        <div className="mx-auto flex max-w-[760px] flex-col gap-3">
          <PageHeader title={t('clubs.overview.noClubsTitle')} />
          <p className="text-sm text-muted">{t('clubs.overview.noClubs')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[760px] flex-col gap-6">
        <div className="flex flex-col gap-1">
          <Eyebrow>{t('clubs.overview.eyebrow')}</Eyebrow>
          <PageHeader title={club.name} />
        </div>

        <ClubSwitcher clubs={dashboardUser.clubs} current={club} />

        <Section title={t('clubs.overview.coaches')} count={coaches.length} empty={t('clubs.overview.coachesEmpty')}>
          {coaches.map((coach) => (
            <li key={coach.id} className={rowClass}>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink">{coach.name}</div>
                <div className="truncate text-meta text-muted">{coach.email}</div>
              </div>
            </li>
          ))}
        </Section>

        <Section
          title={t('clubs.overview.classGroups')}
          count={classGroups.length}
          empty={t('clubs.overview.classGroupsEmpty')}
        >
          {classGroups.map((group) => (
            <li key={group.id} className={rowClass}>
              <div className="truncate text-sm font-semibold text-ink">{group.name}</div>
            </li>
          ))}
        </Section>

        <Section
          title={t('clubs.overview.players')}
          count={players.length}
          empty={t('clubs.overview.playersEmpty')}
          action={
            <Link href={`/dashboard/clubs/${club.id}/players`} className={buttonClass('secondary')}>
              {t('clubs.overview.manageRoster')}
            </Link>
          }
        >
          {players.map((player) => (
            <li key={player.id} className={rowClass}>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink">{player.name}</div>
                <div className="text-meta text-muted">{t(`players.levelOption.${player.level}`)}</div>
              </div>
            </li>
          ))}
        </Section>
      </div>
    </div>
  )
}

Show.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Show
