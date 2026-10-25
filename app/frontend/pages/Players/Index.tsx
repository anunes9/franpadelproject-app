import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { editPlayerPath, newClubPlayerPath } from '@/lib/paths'
import { AppShell, PageHeader } from '../../components/shell'
import { buttonClass, Eyebrow, ListCard, ListRow } from '../../components/ui'
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
      <div className="flex max-w-[760px] flex-col gap-6 lg:mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Eyebrow>{club.name}</Eyebrow>
            <PageHeader title={t('players.index.title')} />
          </div>
          <Link href={newClubPlayerPath(club.id)} className={buttonClass('primary')}>
            {t('players.index.add')}
          </Link>
        </div>

        <ListCard count={players.length} empty={t('players.index.empty')}>
          {players.map((player) => (
            <ListRow key={player.id}>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink">{player.name}</div>
                <div className="text-meta text-muted">
                  {t(`players.levelOption.${player.level}`)} · {t('players.index.columns.position')}{' '}
                  {t(`players.positionOption.${player.position}`).toLowerCase()} · {t('players.index.columns.hand')}{' '}
                  {t(`players.handOption.${player.hand}`).toLowerCase()}
                </div>
              </div>
              <Link
                href={editPlayerPath(player.id)}
                className="-my-2 flex min-h-11 shrink-0 items-center text-meta font-semibold text-teal-deep hover:text-ink"
                aria-label={`${t('players.index.edit')} ${player.name}`}
              >
                {t('players.index.edit')}
              </Link>
            </ListRow>
          ))}
        </ListCard>
      </div>
    </div>
  )
}

Index.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Index
