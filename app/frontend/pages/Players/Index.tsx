import { Link, usePage } from '@inertiajs/react'
import { type ReactNode, useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { editPlayerPath, newClubPlayerPath, playerPath } from '@/lib/paths'
import { LEVELS, nameMatches } from '@/lib/players'
import { AppShell, PageHeader } from '../../components/shell'
import { buttonClass, chipClass, Eyebrow, INPUT_CLASS, ListCard, ListRow, SegmentedControl } from '../../components/ui'
import type { ClubSummary, Level, Player, PlayerPosition } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  club: ClubSummary
  players: Player[]
  current_user: { role: string } | null
}

const POSITIONS: PlayerPosition[] = ['left', 'right', 'both']

function Index() {
  const { club, players, current_user } = usePage<Props>().props
  // A Club Manager reads every Player's Performance Profile; a Coach reads
  // those of their groups' Players, from their groups.
  const showProfile = current_user?.role === 'club_manager'
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<Level | 'all'>('all')
  const [position, setPosition] = useState<PlayerPosition | 'all'>('all')

  // The whole roster is on the page, so filtering happens here.
  const filtering = query.trim() !== '' || level !== 'all' || position !== 'all'
  const shown = players.filter(
    (player) =>
      nameMatches(player.name, query) &&
      (level === 'all' || player.level === level) &&
      (position === 'all' || player.position === position)
  )

  function clearFilters() {
    setQuery('')
    setLevel('all')
    setPosition('all')
  }

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

        {players.length > 0 && (
          <div className="flex flex-col gap-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('players.index.filter.search')}
              aria-label={t('players.index.filter.search')}
              className={INPUT_CLASS}
            />
            <div className="grid gap-3 sm:grid-cols-[3fr_2fr]">
              <SegmentedControl
                label={t('players.index.columns.level')}
                value={level}
                onChange={setLevel}
                options={[
                  { value: 'all', label: t('players.index.filter.all') },
                  ...LEVELS.map((option) => ({ value: option, label: t(`players.levelOption.${option}`) })),
                ]}
              />
              <SegmentedControl
                label={t('players.index.columns.position')}
                value={position}
                onChange={setPosition}
                options={[
                  { value: 'all', label: t('players.index.filter.all') },
                  ...POSITIONS.map((option) => ({ value: option, label: t(`players.positionOption.${option}`) })),
                ]}
              />
            </div>
          </div>
        )}

        {filtering && shown.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong/40 px-4 py-10 text-center">
            <p className="text-sm text-muted-strong">{t('players.index.filter.noResults')}</p>
            <button type="button" onClick={clearFilters} className={chipClass(false)}>
              {t('players.index.filter.clear')}
            </button>
          </div>
        ) : (
          <ListCard count={shown.length} empty={t('players.index.empty')}>
            {shown.map((player) => (
              <ListRow key={player.id}>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-ink">{player.name}</div>
                  <div className="text-meta text-muted">
                    {t(`players.levelOption.${player.level}`)} · {t('players.index.columns.position')}{' '}
                    {t(`players.positionOption.${player.position}`).toLowerCase()} · {t('players.index.columns.hand')}{' '}
                    {t(`players.handOption.${player.hand}`).toLowerCase()}
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-4">
                  {showProfile && (
                    <Link
                      href={playerPath(player.id)}
                      className="-my-2 flex min-h-11 items-center text-meta font-semibold text-teal-deep hover:text-ink"
                      aria-label={`${t('players.index.profile')} ${player.name}`}
                    >
                      {t('players.index.profile')}
                    </Link>
                  )}
                  <Link
                    href={editPlayerPath(player.id)}
                    className="-my-2 flex min-h-11 items-center text-meta font-semibold text-teal-deep hover:text-ink"
                    aria-label={`${t('players.index.edit')} ${player.name}`}
                  >
                    {t('players.index.edit')}
                  </Link>
                </span>
              </ListRow>
            ))}
          </ListCard>
        )}
      </div>
    </div>
  )
}

Index.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Index
