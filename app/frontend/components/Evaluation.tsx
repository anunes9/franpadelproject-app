import { ArrowDown01Icon, ArrowUp01Icon, MinusSignIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useTranslation } from '@/i18n/useTranslation'
import {
  itemName,
  RATING_MAX,
  RATING_VALUES,
  radarPoint,
  radarPolygon,
  scaleLabel,
  TO_IMPROVE_AT,
} from '@/lib/evaluations'
import type { EvaluationStatus, ProfileItem } from '../types/dashboard-data'
import { Pill } from './ui'

// The pieces Player Evaluations are recorded and read with: the 1-10 rating
// control, a Rating's value as a row of pips, its trend, an Evaluation's
// status, and the radar chart of the Profile Areas.

// Picks a Rating from 1 to 10, each step with its label; picking the chosen
// value again leaves the item unrated. Two rows of five on phones, so every
// step keeps a full-size tap target; one row of ten from small tablets up.
export function RatingControl({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (value: number | null) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1.5">
      <div role="radiogroup" aria-label={label} className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
        {RATING_VALUES.map((option) => {
          const active = option === value
          return (
            // biome-ignore lint/a11y/useSemanticElements: a row of buttons reads better than radio inputs here, and keeps a second tap to unrate.
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={t('evaluations.form.ratingOption', { value: option, label: scaleLabel(t, option) })}
              onClick={() => onChange(active ? null : option)}
              className={`flex min-h-11 items-center justify-center rounded-xl border font-dash-mono text-base font-semibold transition-colors duration-150 ${
                active
                  ? 'border-ink bg-ink text-paper shadow-card-dark'
                  : value !== null && option < value
                    ? 'border-teal-line bg-tint-teal text-teal-ink'
                    : 'border-line bg-white text-muted-strong hover:border-teal'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>
      <span className="text-meta text-muted-strong" aria-hidden>
        {value === null ? t('evaluations.form.unrated') : scaleLabel(t, value)}
      </span>
    </div>
  )
}

// A value as ten pips, the first `value` filled; clay when it is an item to
// improve.
export function RatingPips({ value }: { value: number | null }) {
  return (
    <span className="inline-flex gap-0.5" aria-hidden>
      {RATING_VALUES.map((step) => (
        <span
          key={step}
          className={`h-2 w-2 rounded-full ${value !== null && step <= value ? (value <= TO_IMPROVE_AT ? 'bg-clay' : 'bg-teal-deep') : 'bg-track'}`}
        />
      ))}
    </span>
  )
}

// How an item moved since its previous Rating.
export function Trend({ item }: { item: ProfileItem }) {
  const { t } = useTranslation()
  if (!item.trend || item.previous === null) return null
  const icon = item.trend === 'up' ? ArrowUp01Icon : item.trend === 'down' ? ArrowDown01Icon : MinusSignIcon
  const tone = item.trend === 'up' ? 'text-teal-deep' : item.trend === 'down' ? 'text-clay-ink' : 'text-muted'
  const text =
    item.trend === 'same'
      ? t('evaluations.profile.trend.same')
      : t(`evaluations.profile.trend.${item.trend}`, { previous: item.previous })
  return (
    <span className={`inline-flex items-center gap-0.5 text-meta ${tone}`}>
      <HugeiconsIcon icon={icon} size={14} strokeWidth={2} aria-hidden />
      {text}
    </span>
  )
}

export function StatusPill({ status }: { status: EvaluationStatus }) {
  const { t } = useTranslation()
  const variant = status === 'evaluated' ? 'full' : status === 'partial' ? 'default' : 'muted'
  return <Pill text={t(`evaluations.section.status.${status}`)} variant={variant} />
}

const SIZE = 280
const CENTER = { x: SIZE / 2, y: SIZE / 2 }
const RADIUS = 92
// Room either side for the Areas' names, which run outwards from the chart.
const LABEL_ROOM = 64

// The Profile Areas' latest values as a radar chart: one axis per Area, a
// ring every two steps of the scale, and the Player's polygon. Unrated Areas sit at
// the centre. Screen readers get the values as one label.
export function RadarChart({ axes, label }: { axes: { name: string; value: number | null }[]; label: string }) {
  const count = axes.length
  // A ring every two steps, at each label's top: 2, 4, 6, 8, 10.
  const rings = RATING_VALUES.filter((step) => step % 2 === 0).map((step) =>
    axes.map((_, index) => radarPoint(index, count, step / RATING_MAX, CENTER, RADIUS))
  )
  const rated = axes.some((axis) => axis.value !== null)

  return (
    <svg
      viewBox={`${-LABEL_ROOM} -12 ${SIZE + 2 * LABEL_ROOM} ${SIZE + 12}`}
      role="img"
      aria-label={label}
      className="mx-auto block w-full max-w-[400px]"
    >
      {rings.map((points, step) => (
        <polygon
          // biome-ignore lint/suspicious/noArrayIndexKey: rings are fixed, one per step of the scale.
          key={step}
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          fill={step === rings.length - 1 ? 'var(--color-paper)' : 'none'}
          stroke="var(--color-line)"
          strokeWidth={1}
        />
      ))}
      {axes.map((axis, index) => {
        const end = radarPoint(index, count, 1, CENTER, RADIUS)
        return <line key={axis.name} x1={CENTER.x} y1={CENTER.y} x2={end.x} y2={end.y} stroke="var(--color-line)" />
      })}
      {rated && (
        <polygon
          points={radarPolygon(
            axes.map((axis) => axis.value),
            CENTER,
            RADIUS
          )}
          fill="var(--color-teal)"
          fillOpacity={0.28}
          stroke="var(--color-teal-deep)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      )}
      {axes.map((axis, index) => {
        if (axis.value === null) return null
        const point = radarPoint(index, count, axis.value / RATING_MAX, CENTER, RADIUS)
        return <circle key={axis.name} cx={point.x} cy={point.y} r={3.5} fill="var(--color-teal-deep)" />
      })}
      {axes.map((axis, index) => {
        const point = radarPoint(index, count, 1.22, CENTER, RADIUS)
        const anchor = Math.abs(point.x - CENTER.x) < 4 ? 'middle' : point.x > CENTER.x ? 'start' : 'end'
        return (
          <text
            key={axis.name}
            x={point.x}
            y={point.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="fill-ink text-[12px] font-semibold"
          >
            {axis.name}
            <tspan className="fill-muted font-dash-mono" dx={4}>
              {axis.value ?? '–'}
            </tspan>
          </text>
        )
      })}
    </svg>
  )
}

// A bar chart row's columns: name and value over the bar on phones, then
// name, bar and value side by side.
const ROW_GRID = 'grid grid-cols-[minmax(0,1fr)_2rem] gap-x-3 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_2rem]'

// The axis steps a bar chart of Ratings marks: 0, 2, 4, 6, 8, 10.
const AXIS_STEPS = [0, ...RATING_VALUES.filter((step) => step % 2 === 0)]

// Rated items as a horizontal bar chart on the 0-10 scale: one bar per item
// at its latest Rating (clay at TO_IMPROVE_AT or below, as an item to
// improve, else teal), a thin tick at its previous Rating, the value printed
// beside it and the trend under its name, so nothing rests on colour alone.
// Each row is a list item with its own label, for screen readers. On phones
// a row stacks its name and value over a full-width bar; from small tablets
// up, name, bar and value share one line.
export function RatingBars({ items, label }: { items: ProfileItem[]; label: string }) {
  const { t } = useTranslation()
  const percent = (value: number) => `${(value / RATING_MAX) * 100}%`

  return (
    <figure className="flex flex-col gap-1">
      <ul aria-label={label} className="flex flex-col">
        {items.map((item) => {
          const name = itemName(t, item)
          const value = item.value ?? 0
          const previous =
            item.previous === null ? '' : ` ${t('evaluations.profile.previousValue', { value: item.previous })}`
          return (
            <li
              key={`${item.kind}:${item.key}`}
              aria-label={`${name}: ${value}${previous}`}
              className={`${ROW_GRID} items-center gap-y-1 border-b border-mist py-2.5 last:border-b-0`}
            >
              <span className="order-1 flex min-w-0 flex-col" aria-hidden>
                <span className="truncate text-sm font-semibold text-ink">{name}</span>
                <Trend item={item} />
              </span>
              <span className="relative order-3 col-span-2 h-6 sm:order-2 sm:col-span-1" aria-hidden>
                {AXIS_STEPS.slice(1, -1).map((step) => (
                  <span key={step} className="absolute inset-y-0 w-px bg-mist" style={{ left: percent(step) }} />
                ))}
                <span
                  className={`absolute top-1/2 left-0 h-2.5 -translate-y-1/2 rounded-r ${
                    value <= TO_IMPROVE_AT ? 'bg-clay' : 'bg-teal-deep'
                  }`}
                  style={{ width: percent(value) }}
                />
                {item.previous !== null && (
                  <span
                    className="absolute inset-y-0.5 w-0.5 -translate-x-1/2 rounded-full bg-ink-mute ring-2 ring-white"
                    style={{ left: percent(item.previous) }}
                  />
                )}
              </span>
              <span className="order-2 text-right font-dash-mono text-sm font-semibold text-ink sm:order-3" aria-hidden>
                {item.value ?? '–'}
              </span>
            </li>
          )
        })}
      </ul>
      <div className={`${ROW_GRID} gap-y-1.5`} aria-hidden>
        <span className="order-2 col-span-2 font-dash-mono text-label text-muted sm:order-1 sm:col-span-1">
          <span className="inline-block h-2.5 w-0.5 rounded-full bg-ink-mute align-middle" />{' '}
          {t('evaluations.profile.previousLegend')}
        </span>
        <span className="relative order-1 col-span-2 h-4 font-dash-mono text-label text-muted sm:order-2 sm:col-span-1">
          {AXIS_STEPS.map((step) => (
            <span
              key={step}
              className={`absolute ${step === 0 ? '' : step === RATING_MAX ? '-translate-x-full' : '-translate-x-1/2'}`}
              style={{ left: percent(step) }}
            >
              {step}
            </span>
          ))}
        </span>
      </div>
    </figure>
  )
}
