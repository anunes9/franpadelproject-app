import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { GENDERS, LEVELS, nameMatches } from '@/lib/players'
import type { Level, Player, PlayerGender } from '../types/dashboard-data'
import { chipClass, INPUT_CLASS } from './ui'

// At most this many matches are listed; a narrower search finds the rest.
const RESULTS_LIMIT = 8

interface Props {
  // The Club roster.
  players: Player[]
  chosenIds: string[]
  // Whether the group has as many Players as it can take.
  full: boolean
  onToggle: (id: string) => void
}

// Choosing a Class Group's Players from a Club roster too long to list at
// once: the chosen Players are shown, and the rest are found by name, Level
// and gender. Nothing is listed until the Coach searches or filters.
export function PlayerPicker({ players, chosenIds, full, onToggle }: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<Level | 'all'>('all')
  const [gender, setGender] = useState<PlayerGender | 'all'>('all')

  const chosen = chosenIds.flatMap((id) => players.find((player) => player.id === id) ?? [])
  const searching = query.trim() !== '' || level !== 'all' || gender !== 'all'
  const matches = players.filter(
    (player) =>
      !chosenIds.includes(player.id) &&
      nameMatches(player.name, query) &&
      (level === 'all' || player.level === level) &&
      (gender === 'all' || player.gender === gender)
  )
  const shown = matches.slice(0, RESULTS_LIMIT)

  // The typed name has found its Player; the filters stay for the next one.
  function add(id: string) {
    onToggle(id)
    setQuery('')
  }

  function clearSearch() {
    setQuery('')
    setLevel('all')
    setGender('all')
  }

  return (
    <div className="flex flex-col gap-3">
      {chosen.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong/40 px-3 py-3 text-meta text-muted">
          {t('classGroups.form.picker.noneChosen')}
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2" aria-label={t('classGroups.form.picker.chosen')}>
          {chosen.map((player) => (
            <li
              key={player.id}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-teal-deep/40 bg-white py-1 pr-1 pl-3.5 text-sm text-ink"
            >
              <span className="font-medium">{player.name}</span>
              <span className="text-meta text-muted">{t(`players.levelOption.${player.level}`)}</span>
              <button
                type="button"
                onClick={() => onToggle(player.id)}
                aria-label={t('classGroups.form.picker.remove', { name: player.name })}
                className="inline-flex size-9 items-center justify-center rounded-full text-muted-strong transition-colors hover:bg-track hover:text-ink"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-line p-3">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('classGroups.form.picker.search')}
          aria-label={t('classGroups.form.picker.search')}
          className={`${INPUT_CLASS} min-h-11`}
        />
        <fieldset className="flex flex-wrap gap-2" aria-label={t('classGroups.form.picker.level')}>
          <button
            type="button"
            onClick={() => setLevel('all')}
            aria-pressed={level === 'all'}
            className={chipClass(level === 'all')}
          >
            {t('classGroups.form.picker.allLevels')}
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
        <fieldset className="flex flex-wrap gap-2" aria-label={t('classGroups.form.picker.gender')}>
          <button
            type="button"
            onClick={() => setGender('all')}
            aria-pressed={gender === 'all'}
            className={chipClass(gender === 'all')}
          >
            {t('classGroups.form.picker.allGenders')}
          </button>
          {GENDERS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setGender(option)}
              aria-pressed={gender === option}
              className={chipClass(gender === option)}
            >
              {t(`players.genderOption.${option}`)}
            </button>
          ))}
        </fieldset>

        {!searching ? (
          <p className="text-meta text-muted">{t('classGroups.form.picker.prompt')}</p>
        ) : matches.length === 0 ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-meta text-muted-strong">{t('classGroups.form.picker.noResults')}</p>
            <button type="button" onClick={clearSearch} className={chipClass(false)}>
              {t('classGroups.form.picker.clear')}
            </button>
          </div>
        ) : (
          <>
            <ul className="flex flex-col rounded-lg border border-line">
              {shown.map((player) => (
                <li
                  key={player.id}
                  className="flex min-h-11 items-center gap-3 border-b border-track px-3 py-1.5 text-sm text-ink last:border-0"
                >
                  <span className="min-w-0 flex-1 truncate font-medium">{player.name}</span>
                  <span className="text-meta text-muted">{t(`players.levelOption.${player.level}`)}</span>
                  <button
                    type="button"
                    onClick={() => add(player.id)}
                    disabled={full}
                    aria-label={t('classGroups.form.picker.add', { name: player.name })}
                    className="min-h-9 rounded-full border border-teal-deep px-3.5 text-meta font-semibold text-teal-deep transition-colors hover:bg-teal-deep hover:text-paper disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-teal-deep"
                  >
                    {t('classGroups.form.picker.addShort')}
                  </button>
                </li>
              ))}
            </ul>
            {matches.length > shown.length && (
              <p className="text-meta text-muted">
                {t('classGroups.form.picker.more', { shown: shown.length, count: matches.length })}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
