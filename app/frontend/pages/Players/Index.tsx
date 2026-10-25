import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { AppShell, PageHeader } from '../../components/shell'
import { buttonClass, Eyebrow } from '../../components/ui'
import type { ClubSummary, Player } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  club: ClubSummary
  players: Player[]
}

function Index() {
  const { club, players } = usePage<Props>().props
  const { t } = useTranslation()

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[760px] flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Eyebrow>{club.name}</Eyebrow>
            <PageHeader title={t('players.index.title')} />
          </div>
          <Link href={`/dashboard/clubs/${club.id}/players/new`} className={buttonClass('primary')}>
            {t('players.index.add')}
          </Link>
        </div>

        {players.length === 0 ? (
          <p className="rounded-[18px] border border-line bg-white px-5 py-8 text-center text-sm text-muted shadow-card">
            {t('players.index.empty')}
          </p>
        ) : (
          <ul className="rounded-[18px] border border-line bg-white px-5 py-2 shadow-card">
            {players.map((player) => (
              <li
                key={player.id}
                className="flex items-center justify-between gap-4 border-b border-track py-3.5 last:border-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-ink">{player.name}</div>
                  <div className="text-meta text-muted">
                    {t(`players.levelOption.${player.level}`)} · {t('players.index.columns.position')}{' '}
                    {t(`players.positionOption.${player.position}`).toLowerCase()} · {t('players.index.columns.hand')}{' '}
                    {t(`players.handOption.${player.hand}`).toLowerCase()}
                  </div>
                </div>
                <Link
                  href={`/dashboard/players/${player.id}/edit`}
                  className="-my-2 flex min-h-11 shrink-0 items-center text-meta font-semibold text-teal-deep hover:text-ink"
                  aria-label={`${t('players.index.edit')} ${player.name}`}
                >
                  {t('players.index.edit')}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

Index.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Index
