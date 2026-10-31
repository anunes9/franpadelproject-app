import { Link, usePage } from '@inertiajs/react'
import { type ReactNode, useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { editPlayerPath, newClubPlayerPath } from '@/lib/paths'
import { AppShell, PageHeader } from '../../components/shell'
import { buttonClass, chipClass, Eyebrow, INPUT_CLASS, ListCard, ListRow, SegmentedControl } from '../../components/ui'
import type { ClubSummary, Level, Player, PlayerPosition } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  club: ClubSummary
  players: Player[]
}

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced']
const POSITIONS: PlayerPosition[] = ['left', 'right', 'both']

// Lowercase and without accents, so "joao" finds "João".
function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

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
      normalize(player.name).includes(normalize(query.trim())) &&
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
