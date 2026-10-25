import { useForm, usePage } from '@inertiajs/react'
import type { FormEvent, ReactNode } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { AppShell, PageHeader } from '../../components/shell'
import { BackLink, buttonClass, Eyebrow } from '../../components/ui'
import type { ClubSummary, Player, PlayerHand, PlayerLevel, PlayerPosition } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  club: ClubSummary
  player: Player | null
  positionOptions: PlayerPosition[]
  handOptions: PlayerHand[]
  levelOptions: PlayerLevel[]
}

type Field = 'name' | 'position' | 'hand' | 'level'

const INPUT_CLASS =
  'rounded-lg border border-line bg-white px-3 py-2.5 text-base text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30'

function Form() {
  const { club, player, positionOptions, handOptions, levelOptions } = usePage<Props>().props
  const { t } = useTranslation()
  const rosterHref = `/dashboard/clubs/${club.id}/players`

  const { data, setData, post, patch, transform, processing, errors } = useForm({
    name: player?.name ?? '',
    position: player?.position ?? '',
    hand: player?.hand ?? '',
    level: player?.level ?? '',
  })
  transform((fields) => ({ player: fields }))

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (player) {
      patch(`/dashboard/players/${player.id}`)
    } else {
      post(rosterHref)
    }
  }

  // The server's messages are in English; show our own, in the Client's
  // language, for whichever fields it rejected.
  function errorFor(field: Field) {
    if (!errors[field]) return null
    return (
      <span role="alert" className="text-meta font-normal text-danger">
        {field === 'name' ? t('players.form.errors.name') : t('players.form.errors.choose')}
      </span>
    )
  }

  const selects: Array<{ field: Exclude<Field, 'name'>; label: string; options: Array<[string, string]> }> = [
    {
      field: 'position',
      label: t('players.form.position'),
      options: positionOptions.map((o) => [o, t(`players.positionOption.${o}`)]),
    },
    {
      field: 'hand',
      label: t('players.form.hand'),
      options: handOptions.map((o) => [o, t(`players.handOption.${o}`)]),
    },
    {
      field: 'level',
      label: t('players.form.level'),
      options: levelOptions.map((o) => [o, t(`players.levelOption.${o}`)]),
    },
  ]

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6">
        <BackLink label={t('players.form.backToRoster')} href={rosterHref} />
        <div className="flex flex-col gap-1">
          <Eyebrow>{club.name}</Eyebrow>
          <PageHeader title={player ? t('players.form.editTitle') : t('players.form.newTitle')} />
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4 rounded-[18px] border border-line bg-white p-5 shadow-card"
        >
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            {t('players.form.name')}
            <input
              type="text"
              value={data.name}
              onChange={(event) => setData('name', event.target.value)}
              aria-invalid={errors.name ? true : undefined}
              autoComplete="off"
              className={INPUT_CLASS}
            />
            {errorFor('name')}
          </label>

          {selects.map(({ field, label, options }) => (
            <label key={field} className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              {label}
              <select
                value={data[field]}
                onChange={(event) => setData(field, event.target.value)}
                aria-invalid={errors[field] ? true : undefined}
                className={`${INPUT_CLASS} min-h-11`}
              >
                <option value="" disabled />
                {options.map(([value, optionLabel]) => (
                  <option key={value} value={value}>
                    {optionLabel}
                  </option>
                ))}
              </select>
              {errorFor(field)}
            </label>
          ))}

          <p className="text-meta text-muted">{t('players.form.noLogin')}</p>

          <button type="submit" disabled={processing} className={buttonClass('primary', 'mt-2')}>
            {processing ? t('players.form.saving') : t('players.form.save')}
          </button>
        </form>
      </div>
    </div>
  )
}

Form.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Form
