import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link, router, usePage } from '@inertiajs/react'
import { type FormEvent, type ReactNode, useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { groupName } from '@/lib/classGroups'
import { itemId, itemName } from '@/lib/evaluations'
import { classEvaluationPath, classPath } from '@/lib/paths'
import { RatingControl } from '../../components/Evaluation'
import { AppShell, PageHeader } from '../../components/shell'
import { BackLink, buttonClass, Eyebrow, FieldError, INPUT_CLASS } from '../../components/ui'
import type { Level, ProfileAreaKey, RatedItem, Rating, RosterPlayer, StrokeKey } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  trainingClass: {
    id: string
    number: number
    // ISO date (YYYY-MM-DD).
    date: string
    module: { number: number; title: string; strokes: StrokeKey[] }
  }
  classGroup: { id: string; name: string | null; level: Level }
  player: { id: string; name: string }
  areas: ProfileAreaKey[]
  strokes: StrokeKey[]
  evaluation: { comment: string | null; ratings: Rating[] } | null
  // The Player's latest Rating of each item before this Class, by itemId.
  previousRatings: Record<string, number>
  roster: RosterPlayer[]
  errors: Record<string, unknown>
}

interface Entry {
  value: number | null
  comment: string
}

type Entries = Record<string, Entry>

const EMPTY: Entry = { value: null, comment: '' }

// One Player's Evaluation in an Assessment Class, one Player at a time: a
// 1-10 Rating for each Profile Area and for the Strokes of the Module (plus any
// other Stroke the Coach adds), each with an optional comment, and an overall
// comment. Saving sends the whole Evaluation, so an item left unrated has no
// Rating. The group's other Players are a tap away.
function EvaluationForm() {
  const { trainingClass, classGroup, player, areas, strokes, evaluation, previousRatings, roster, errors } =
    usePage<Props>().props
  const { t } = useTranslation()
  const [entries, setEntries] = useState<Entries>(() =>
    Object.fromEntries(
      (evaluation?.ratings ?? []).map((rating) => [
        itemId(rating),
        { value: rating.value, comment: rating.comment ?? '' },
      ])
    )
  )
  // Strokes outside the Module's that the Coach rates, those rated before first.
  const [extraStrokes, setExtraStrokes] = useState<StrokeKey[]>(() =>
    (evaluation?.ratings ?? [])
      .filter((rating) => rating.kind === 'stroke' && !trainingClass.module.strokes.includes(rating.key))
      .map((rating) => rating.key as StrokeKey)
  )
  const [comment, setComment] = useState(evaluation?.comment ?? '')
  const [saving, setSaving] = useState(false)

  const index = roster.findIndex((entry) => entry.id === player.id)
  const nextPlayer = index >= 0 ? roster[index + 1] : undefined
  const shownStrokes = [...trainingClass.module.strokes, ...extraStrokes]
  const addable = strokes.filter((stroke) => !shownStrokes.includes(stroke))

  function update(item: RatedItem, change: Partial<Entry>) {
    setEntries((current) => ({ ...current, [itemId(item)]: { ...(current[itemId(item)] ?? EMPTY), ...change } }))
  }

  function removeStroke(stroke: StrokeKey) {
    setExtraStrokes((current) => current.filter((key) => key !== stroke))
    setEntries((current) => {
      const { [`stroke:${stroke}`]: _removed, ...rest } = current
      return rest
    })
  }

  // Sends the whole Evaluation, then goes on to `next` when given.
  function save(next?: RosterPlayer) {
    const items: RatedItem[] = [
      ...areas.map((key) => ({ kind: 'area' as const, key })),
      ...shownStrokes.map((key) => ({ kind: 'stroke' as const, key })),
    ]
    const ratings = items.flatMap((item) => {
      const entry = entries[itemId(item)]
      return entry?.value ? [{ ...item, value: entry.value, comment: entry.comment }] : []
    })
    router.put(
      classEvaluationPath(trainingClass.id, player.id),
      { evaluation: { comment, ratings }, next_player_id: next?.id ?? null },
      { preserveScroll: 'errors', onStart: () => setSaving(true), onFinish: () => setSaving(false) }
    )
  }

  return (
    <div className="px-5 pt-6 pb-14 lg:px-10 lg:pt-8">
      <form
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault()
          save()
        }}
        className="flex max-w-[760px] flex-col gap-6 lg:mx-auto"
      >
        <BackLink label={t('evaluations.form.backToClass')} href={classPath(trainingClass.id)} />

        <div className="flex flex-col gap-1.5">
          <Eyebrow>
            {groupName(t, classGroup)} ·{' '}
            {t('evaluations.form.eyebrow', { module: trainingClass.module.number, n: trainingClass.number })}
          </Eyebrow>
          <PageHeader title={player.name} />
          {index >= 0 && (
            <span className="font-dash-mono text-meta text-muted">
              {t('evaluations.form.position', { n: index + 1, total: roster.length })}
            </span>
          )}
        </div>

        <nav aria-label={t('evaluations.section.title')} className="-mx-5 overflow-x-auto px-5 lg:mx-0 lg:px-0">
          <ul className="flex gap-2">
            {roster.map((entry) => (
              <li key={entry.id} className="shrink-0">
                <Link
                  href={classEvaluationPath(trainingClass.id, entry.id)}
                  aria-current={entry.id === player.id ? 'page' : undefined}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-meta font-semibold ${
                    entry.id === player.id
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line bg-white text-ink hover:border-teal'
                  }`}
                >
                  {entry.name}
                  {entry.id !== player.id && <StatusDot status={entry.status} />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <FieldError
          errors={errors ?? {}}
          field="player"
          copy={{ not_in_group: t('evaluations.form.errors.notInGroup') }}
        />
        <FieldError errors={errors ?? {}} field="ratings" copy={{}} />

        <Section title={t('evaluations.form.areas')} intro={t('evaluations.form.areasIntro')}>
          {areas.map((key) => (
            <ItemRating
              key={key}
              item={{ kind: 'area', key }}
              entry={entries[`area:${key}`] ?? EMPTY}
              previous={previousRatings[`area:${key}`]}
              onChange={(change) => update({ kind: 'area', key }, change)}
            />
          ))}
        </Section>

        <Section
          title={t('evaluations.form.strokes')}
          intro={
            trainingClass.module.strokes.length > 0
              ? t('evaluations.form.strokesIntro')
              : t('evaluations.form.noModuleStrokes')
          }
        >
          {shownStrokes.map((key) => (
            <ItemRating
              key={key}
              item={{ kind: 'stroke', key }}
              entry={entries[`stroke:${key}`] ?? EMPTY}
              previous={previousRatings[`stroke:${key}`]}
              onChange={(change) => update({ kind: 'stroke', key }, change)}
              onRemove={trainingClass.module.strokes.includes(key) ? undefined : () => removeStroke(key)}
            />
          ))}
          {addable.length > 0 && (
            <li className="pt-4">
              <label className="flex flex-col gap-1.5 text-meta font-semibold text-ink">
                {t('evaluations.form.addStroke')}
                <select
                  value=""
                  onChange={(event) => {
                    const stroke = event.target.value as StrokeKey
                    if (stroke) setExtraStrokes((current) => [...current, stroke])
                  }}
                  className={INPUT_CLASS}
                >
                  <option value="">{t('evaluations.form.addStrokePlaceholder')}</option>
                  {addable.map((stroke) => (
                    <option key={stroke} value={stroke}>
                      {t(`evaluations.strokes.${stroke}`)}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          )}
        </Section>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
          {t('evaluations.form.overallComment')}
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            maxLength={2000}
            className={INPUT_CLASS}
          />
          <FieldError errors={errors ?? {}} field="comment" copy={{ too_long: t('evaluations.form.errors.comment') }} />
        </label>

        {/* On phones the actions stay in reach above the tab bar (about 3.9rem tall). */}
        <div className="sticky bottom-[calc(3.9rem+env(safe-area-inset-bottom))] z-10 -mx-5 flex gap-2 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0">
          {nextPlayer && (
            <button
              type="button"
              disabled={saving}
              onClick={() => save(nextPlayer)}
              className={buttonClass('primary', 'min-w-0 flex-1')}
            >
              <span className="truncate">
                {saving
                  ? t('evaluations.form.saving')
                  : t('evaluations.form.saveNext', { name: nextPlayer.name.split(' ')[0] })}
              </span>
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className={buttonClass(nextPlayer ? 'secondary' : 'primary', nextPlayer ? 'shrink-0' : 'flex-1')}
          >
            {saving ? t('evaluations.form.saving') : t('evaluations.form.save')}
          </button>
        </div>
      </form>
    </div>
  )
}

// The form starts from each Player's own Evaluation: Inertia keeps the page
// mounted when moving between Players, so it is keyed by the Player.
function Edit() {
  const { player } = usePage<Props>().props
  return <EvaluationForm key={player.id} />
}

function Section({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-5 shadow-card">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-extrabold text-ink">{title}</h2>
        <p className="text-meta text-muted-strong">{intro}</p>
      </div>
      <ul className="flex flex-col">{children}</ul>
    </section>
  )
}

// One item to rate: its name, its previous Rating, the 1-10 control and, once
// rated, its comment. A Stroke the Coach added can be taken away again.
function ItemRating({
  item,
  entry,
  previous,
  onChange,
  onRemove,
}: {
  item: RatedItem
  entry: Entry
  previous: number | undefined
  onChange: (change: Partial<Entry>) => void
  onRemove?: () => void
}) {
  const { t } = useTranslation()
  const name = itemName(t, item)
  return (
    <li className="flex flex-col gap-2.5 border-b border-mist py-4 first:pt-1 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <span className="flex flex-wrap items-baseline gap-x-2.5">
          <span className="text-[15px] font-bold text-ink">{name}</span>
          {previous !== undefined && (
            <span className="font-dash-mono text-label text-muted">
              {t('evaluations.form.previously', { value: previous })}
            </span>
          )}
        </span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={t('evaluations.form.removeStroke', { name })}
            className="-my-2 flex size-11 items-center justify-center rounded-full text-muted hover:text-ink"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.75} aria-hidden />
          </button>
        )}
      </div>
      <RatingControl label={name} value={entry.value} onChange={(value) => onChange({ value })} />
      {entry.value !== null && (
        <input
          type="text"
          value={entry.comment}
          onChange={(event) => onChange({ comment: event.target.value })}
          maxLength={1000}
          placeholder={t('evaluations.form.commentOn', { name })}
          aria-label={t('evaluations.form.commentOn', { name })}
          className={INPUT_CLASS}
        />
      )}
    </li>
  )
}

// A small mark for another Player's status in the switcher.
function StatusDot({ status }: { status: RosterPlayer['status'] }) {
  const { t } = useTranslation()
  const tone = status === 'evaluated' ? 'bg-teal-deep' : status === 'partial' ? 'bg-teal-line' : 'bg-track'
  return (
    <span className={`size-2 rounded-full ${tone}`} role="img" aria-label={t(`evaluations.section.status.${status}`)} />
  )
}

Edit.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Edit
