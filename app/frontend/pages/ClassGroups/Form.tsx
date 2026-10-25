import { Link, useForm, usePage } from '@inertiajs/react'
import type { FormEvent, ReactNode } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { formatDate, formatDuration } from '@/lib/classGroups'
import { classGroupPath, classGroupsPath, newClubPlayerPath } from '@/lib/paths'
import { AppShell, PageHeader } from '../../components/shell'
import { BackLink, buttonClass, chipClass, Eyebrow, FieldError, INPUT_CLASS, LABEL_CLASS } from '../../components/ui'
import type { ClassGroup, ClubSummary, Player, PlayerLevel, Weekday } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  club: ClubSummary
  // The Club roster.
  players: Player[]
  // Only when creating: an edited group keeps its Level.
  levelOptions?: PlayerLevel[]
  // The group being edited, if editing one.
  classGroup?: ClassGroup
  cadenceOptions: number[]
  weekdayOptions: Weekday[]
  durationOptions: number[]
  maxPlayers: number
  // The dates on which the last refused plan clashed, if it clashed.
  clashDates: string[]
}

const CADENCE_KEY = { 1: 'once', 2: 'twice' } as const

const LEGEND = 'mb-1.5 text-sm font-medium text-ink'

// A Coach creates a Class Group for themselves; its whole Training Plan is
// generated on creation, or nothing is created and the form says why.
//
// The same form edits a group's Players and schedule (not its Level or start
// date), for its Coach and the Club Managers of its Club. The plan keeps its
// Classes until it is regenerated, except that they all take a new duration.
function Form() {
  const {
    club,
    players,
    levelOptions = [],
    classGroup,
    cadenceOptions,
    weekdayOptions,
    durationOptions,
    maxPlayers,
    clashDates,
  } = usePage<Props>().props
  const { t, tn, locale } = useTranslation()
  const editing = classGroup !== undefined
  // Creating and editing word the same parts of the form differently.
  const scope = editing ? 'classGroups.edit' : 'classGroups.form'
  const own = (
    key: 'title' | 'planNote' | 'save' | 'saving' | 'errors.clashTitle' | 'errors.clash' | 'errors.notSaved'
  ) => t(`${scope}.${key}` as const)

  const { data, setData, post, patch, transform, processing, errors } = useForm({
    level: classGroup?.level ?? '',
    starts_on: classGroup?.startsOn ?? '',
    cadence: classGroup?.cadence ?? cadenceOptions[0],
    weekdays: classGroup?.weekdays ?? ([] as Weekday[]),
    start_time: classGroup?.startTime ?? '',
    duration: classGroup?.duration ?? durationOptions[0],
    player_ids: classGroup?.players.map((player) => player.id) ?? ([] as string[]),
  })
  transform(({ level, starts_on, ...schedule }) => ({
    class_group: editing ? schedule : { level, starts_on, ...schedule },
  }))

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (classGroup) patch(classGroupPath(classGroup.id))
    else post(classGroupsPath)
  }

  function chooseCadence(cadence: number) {
    setData((current) => ({ ...current, cadence, weekdays: current.weekdays.slice(-cadence) }))
  }

  // One weekday per weekly Class: choosing one more than the cadence allows
  // replaces the earliest choice.
  function toggleWeekday(day: Weekday) {
    const chosen = data.weekdays.includes(day)
      ? data.weekdays.filter((d) => d !== day)
      : [...data.weekdays, day].slice(-data.cadence)
    setData('weekdays', chosen)
  }

  function togglePlayer(id: string) {
    const ids = data.player_ids.includes(id) ? data.player_ids.filter((p) => p !== id) : [...data.player_ids, id]
    setData('player_ids', ids)
  }

  const choose = t('classGroups.form.errors.choose')
  const full = data.player_ids.length >= maxPlayers

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="flex max-w-[640px] flex-col gap-6 lg:mx-auto">
        {classGroup ? (
          <BackLink label={t('classGroups.edit.backToGroup')} href={classGroupPath(classGroup.id)} />
        ) : (
          <BackLink label={t('classGroups.form.backToGroups')} href={classGroupsPath} />
        )}
        <div className="flex flex-col gap-1">
          <Eyebrow>
            {classGroup
              ? `${club.name} · ${t(`players.levelOption.${classGroup.level}`)} · ${formatDate(classGroup.startsOn, locale, false)}`
              : club.name}
          </Eyebrow>
          <PageHeader title={own('title')} />
        </div>

        {clashDates.length > 0 && (
          <div
            role="alert"
            className="flex flex-col gap-2 rounded-[18px] border border-danger/40 bg-white p-5 shadow-card"
          >
            <h2 className="text-sm font-bold text-danger">{own('errors.clashTitle')}</h2>
            <p className="text-meta text-muted-strong">{own('errors.clash')}</p>
            <ul className="flex flex-wrap gap-1.5">
              {clashDates.map((date) => (
                <li key={date} className="rounded-full border border-line px-2.5 py-1 text-meta text-ink">
                  {formatDate(date, locale)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-5 rounded-[18px] border border-line bg-white p-5 shadow-card"
        >
          {!editing && (
            <>
              <label className={LABEL_CLASS}>
                {t('classGroups.form.level')}
                <select
                  value={data.level}
                  onChange={(event) => setData('level', event.target.value)}
                  aria-invalid={errors.level ? true : undefined}
                  className={`${INPUT_CLASS} min-h-11`}
                >
                  <option value="" disabled />
                  {levelOptions.map((level) => (
                    <option key={level} value={level}>
                      {t(`players.levelOption.${level}`)}
                    </option>
                  ))}
                </select>
                <span className="text-meta font-normal text-muted">{t('classGroups.form.levelHint')}</span>
                <FieldError
                  errors={errors}
                  field="level"
                  copy={{ blank: choose, inclusion: choose, no_modules: t('classGroups.form.errors.noModules') }}
                />
              </label>

              <label className={LABEL_CLASS}>
                {t('classGroups.form.startsOn')}
                <input
                  type="date"
                  value={data.starts_on}
                  onChange={(event) => setData('starts_on', event.target.value)}
                  aria-invalid={errors.starts_on ? true : undefined}
                  className={`${INPUT_CLASS} min-h-11`}
                />
                <span className="text-meta font-normal text-muted">{t('classGroups.form.startsOnHint')}</span>
                <FieldError errors={errors} field="starts_on" copy={{ blank: t('classGroups.form.errors.date') }} />
              </label>
            </>
          )}

          <fieldset>
            <legend className={LEGEND}>{t('classGroups.form.cadence')}</legend>
            <div className="flex flex-wrap gap-2">
              {cadenceOptions.map((cadence) => (
                <button
                  key={cadence}
                  type="button"
                  aria-pressed={data.cadence === cadence}
                  onClick={() => chooseCadence(cadence)}
                  className={chipClass(data.cadence === cadence)}
                >
                  {t(`classGroups.cadenceOption.${CADENCE_KEY[cadence as 1 | 2]}`)}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className={LEGEND}>{t('classGroups.form.weekdays')}</legend>
            <div className="flex flex-wrap gap-2">
              {weekdayOptions.map((day) => (
                <button
                  key={day}
                  type="button"
                  aria-pressed={data.weekdays.includes(day)}
                  aria-label={t(`classGroups.weekday.${day}`)}
                  onClick={() => toggleWeekday(day)}
                  className={chipClass(data.weekdays.includes(day))}
                >
                  {t(`classGroups.weekdayShort.${day}`)}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-meta text-muted">{tn('classGroups.form.weekdaysHint', data.cadence)}</p>
            <FieldError
              errors={errors}
              field="weekdays"
              copy={{ cadence_mismatch: t('classGroups.form.errors.weekdays') }}
            />
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className={LABEL_CLASS}>
              {t('classGroups.form.startTime')}
              <input
                type="time"
                step={300}
                value={data.start_time}
                onChange={(event) => setData('start_time', event.target.value)}
                aria-invalid={errors.start_time ? true : undefined}
                className={`${INPUT_CLASS} min-h-11`}
              />
              <FieldError
                errors={errors}
                field="start_time"
                copy={{
                  blank: t('classGroups.form.errors.time'),
                  crosses_midnight: t('classGroups.form.errors.crossesMidnight'),
                }}
              />
            </label>

            <fieldset>
              <legend className={LEGEND}>{t('classGroups.form.duration')}</legend>
              <div className="flex flex-wrap gap-2">
                {durationOptions.map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    aria-pressed={data.duration === duration}
                    onClick={() => setData('duration', duration)}
                    className={chipClass(data.duration === duration)}
                  >
                    {formatDuration(duration)}
                  </button>
                ))}
              </div>
              <FieldError
                errors={errors}
                field="duration"
                copy={{ crosses_midnight: t('classGroups.edit.errors.crossesMidnight') }}
              />
            </fieldset>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className={LEGEND}>{t('classGroups.form.players')}</legend>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-meta text-muted">
                {t('classGroups.form.playersHint', { max: maxPlayers, club: club.name })}
              </p>
              <p className="font-dash-mono text-meta text-muted-strong" aria-live="polite">
                {t('classGroups.form.playersChosen', { count: data.player_ids.length, max: maxPlayers })}
              </p>
            </div>
            {players.length === 0 ? (
              <p className="text-sm text-muted">
                {t('classGroups.form.noPlayers')}{' '}
                <Link href={newClubPlayerPath(club.id)} className="font-semibold text-teal-deep hover:text-ink">
                  {t('classGroups.form.addPlayers')}
                </Link>
              </p>
            ) : (
              <ul className="flex flex-col rounded-lg border border-line">
                {players.map((player) => {
                  const checked = data.player_ids.includes(player.id)
                  return (
                    <li key={player.id} className="border-b border-track last:border-0">
                      <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 text-sm text-ink has-disabled:cursor-not-allowed has-disabled:opacity-50">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!checked && full}
                          onChange={() => togglePlayer(player.id)}
                          className="h-4 w-4 accent-teal-deep"
                        />
                        <span className="min-w-0 flex-1 truncate font-medium">{player.name}</span>
                        <span className="text-meta text-muted">{t(`players.levelOption.${player.level}`)}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
            <FieldError
              errors={errors}
              field="players"
              copy={{
                blank: t('classGroups.form.errors.playersBlank'),
                too_many: t('classGroups.form.errors.playersTooMany', { max: maxPlayers }),
                other_club: t('classGroups.form.errors.playersOtherClub'),
              }}
            />
          </fieldset>

          <p className="text-meta text-muted">{own('planNote')}</p>

          {/* A clash is shown with its dates above the form. */}
          {clashDates.length === 0 && (
            <FieldError
              errors={errors}
              field="base"
              copy={{
                not_saved: own('errors.notSaved'),
              }}
            />
          )}

          <button type="submit" disabled={processing} className={buttonClass('primary', 'mt-1')}>
            {own(processing ? 'saving' : 'save')}
          </button>
        </form>
      </div>
    </div>
  )
}

Form.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Form
