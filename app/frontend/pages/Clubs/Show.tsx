import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { clubBreakPeriodsPath, clubPath, clubPlayersPath, newClubCoachInvitationPath } from '@/lib/paths'
import { ClassGroupRow } from '../../components/ClassGroupRow'
import { RemoveCoach } from '../../components/CoachRemoval'
import { AppShell, PageHeader } from '../../components/shell'
import { buttonClass, chipClass, Eyebrow, ListCard, ListRow, Pill } from '../../components/ui'
import type {
  ClassGroupListItem,
  ClubCoach,
  ClubSummary,
  DashboardUser,
  PendingCoachInvitation,
  Player,
} from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  dashboardUser: DashboardUser
  // Null while the Club Manager is not linked to any Club.
  club: ClubSummary | null
  coaches: ClubCoach[]
  classGroups: ClassGroupListItem[]
  players: Player[]
  // Absent on the empty Club Manager home.
  pendingInvitations?: PendingCoachInvitation[]
}

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
  children?: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold text-ink">
          {title} <span className="font-dash-mono text-meta font-semibold text-muted">{count}</span>
        </h2>
        {action}
      </div>
      <ListCard count={count} empty={empty}>
        {children}
      </ListCard>
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
          <Link key={club.id} href={clubPath(club.id)} aria-current={on ? 'page' : undefined} className={chipClass(on)}>
            {club.name}
          </Link>
        )
      })}
    </nav>
  )
}

function Show() {
  const { dashboardUser, club, coaches, classGroups, players, pendingInvitations = [] } = usePage<Props>().props
  const { t } = useTranslation()

  if (!club) {
    return (
      <div className="px-5 pt-6 lg:px-10 lg:pt-9">
        <div className="flex max-w-[760px] flex-col gap-3 lg:mx-auto">
          <PageHeader title={t('clubs.overview.noClubsTitle')} />
          <p className="text-sm text-muted">{t('clubs.overview.noClubs')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="flex max-w-[760px] flex-col gap-6 lg:mx-auto">
        <div className="flex flex-col gap-1">
          <Eyebrow>{t('clubs.overview.eyebrow')}</Eyebrow>
          <PageHeader title={club.name} />
        </div>

        <ClubSwitcher clubs={dashboardUser.clubs} current={club} />

        <Section
          title={t('clubs.overview.coaches')}
          count={coaches.length + pendingInvitations.length}
          empty={t('clubs.overview.coachesEmpty')}
          action={
            <Link href={newClubCoachInvitationPath(club.id)} className={buttonClass('secondary')}>
              {t('coachInvitations.overview.invite')}
            </Link>
          }
        >
          {coaches.map((coach) => (
            <ListRow key={coach.id}>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink">{coach.name}</div>
                <div className="truncate text-meta text-muted">{coach.email}</div>
              </div>
              <RemoveCoach clubId={club.id} coach={coach} />
            </ListRow>
          ))}
          {pendingInvitations.map((invitation) => (
            <ListRow key={invitation.id}>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink">{invitation.name}</div>
                <div className="truncate text-meta text-muted">{invitation.email}</div>
              </div>
              <Pill text={t('coachInvitations.overview.pending')} variant="muted" />
            </ListRow>
          ))}
        </Section>

        <Section
          title={t('clubs.overview.classGroups')}
          count={classGroups.length}
          empty={t('clubs.overview.classGroupsEmpty')}
        >
          {classGroups.map((group) => (
            <ClassGroupRow key={group.id} group={group} withCoach />
          ))}
        </Section>

        <Section
          title={t('clubs.overview.players')}
          count={players.length}
          empty={t('clubs.overview.playersEmpty')}
          action={
            <Link href={clubPlayersPath(club.id)} className={buttonClass('secondary')}>
              {t('clubs.overview.managePlayers')}
            </Link>
          }
        >
          {players.map((player) => (
            <ListRow key={player.id}>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink">{player.name}</div>
                <div className="text-meta text-muted">{t(`players.levelOption.${player.level}`)}</div>
              </div>
            </ListRow>
          ))}
        </Section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-bold text-ink">{t('breakPeriods.overview.title')}</h2>
            <Link href={clubBreakPeriodsPath(club.id)} className={buttonClass('secondary')}>
              {t('breakPeriods.overview.manage')}
            </Link>
          </div>
          <p className="text-sm text-muted">{t('breakPeriods.overview.description')}</p>
        </section>
      </div>
    </div>
  )
}

Show.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Show
