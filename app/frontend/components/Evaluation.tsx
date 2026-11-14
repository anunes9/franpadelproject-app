import { ArrowDown01Icon, ArrowUp01Icon, MinusSignIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useTranslation } from '@/i18n/useTranslation'
import { RATING_VALUES, radarPoint, radarPolygon, scaleLabel } from '@/lib/evaluations'
import type { EvaluationStatus, ProfileItem } from '../types/dashboard-data'
import { Pill } from './ui'

// The pieces Player Evaluations are recorded and read with: the 1-5 rating
// control, a Rating's value as a row of pips, its trend, an Evaluation's
// status, and the radar chart of the Profile Areas.

// Picks a Rating from 1 to 5, each step with its label; picking the chosen
// value again leaves the item unrated.
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
      <div role="radiogroup" aria-label={label} className="grid grid-cols-5 gap-1.5">
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

// A value as five pips, the first `value` filled.
export function RatingPips({ value }: { value: number | null }) {
  return (
    <span className="inline-flex gap-1" aria-hidden>
      {RATING_VALUES.map((step) => (
        <span
          key={step}
          className={`h-2 w-4 rounded-full ${value !== null && step <= value ? (value <= 2 ? 'bg-clay' : 'bg-teal-deep') : 'bg-track'}`}
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
// ring per step of the scale, and the Player's polygon. Unrated Areas sit at
// the centre. Screen readers get the values as one label.
export function RadarChart({ axes, label }: { axes: { name: string; value: number | null }[]; label: string }) {
  const count = axes.length
  const rings = RATING_VALUES.map((step) => axes.map((_, index) => radarPoint(index, count, step / 5, CENTER, RADIUS)))
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
        const point = radarPoint(index, count, axis.value / 5, CENTER, RADIUS)
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
