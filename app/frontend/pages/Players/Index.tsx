import { Link, usePage } from '@inertiajs/react'
import { type ReactNode, useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { editPlayerPath, newClubPlayerPath } from '@/lib/paths'
import { LEVELS, nameMatches } from '@/lib/players'
import { AppShell, PageHeader } from '../../components/shell'
import { buttonClass, chipClass, Eyebrow, INPUT_CLASS, ListCard, ListRow } from '../../components/ui'
import type { ClubSummary, Level, Player, PlayerPosition } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  club: ClubSummary
  players: Player[]
}

const POSITIONS: PlayerPosition[] = ['left', 'right', 'both']

function Index() {
  const { club, players } = usePage<Props>().props
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
            <fieldset className="flex flex-wrap gap-2" aria-label={t('players.index.columns.level')}>
              <button
                type="button"
                onClick={() => setLevel('all')}
                aria-pressed={level === 'all'}
                className={chipClass(level === 'all')}
              >
                {t('players.index.filter.allLevels')}
              </button>
              {LEVELS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLevel(option)}
                  aria-pressed={level === option}
                  className={chipClass(level === option)}
                >
                  {t(`players.levelOption.${option}`)}
                </button>
              ))}
            </fieldset>
            <fieldset className="flex flex-wrap gap-2" aria-label={t('players.index.columns.position')}>
              <button
                type="button"
                onClick={() => setPosition('all')}
                aria-pressed={position === 'all'}
                className={chipClass(position === 'all')}
              >
                {t('players.index.filter.allPositions')}
              </button>
              {POSITIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPosition(option)}
                  aria-pressed={position === option}
                  className={chipClass(position === option)}
                >
                  {t(`players.positionOption.${option}`)}
                </button>
              ))}
            </fieldset>
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
        )}
      </div>
    </div>
  )
}

Index.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Index
