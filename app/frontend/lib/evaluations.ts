// Ratings, Profile Areas and Strokes as the Evaluation form and the
// Performance Profile show them (docs/specs/PlayerPerformanceProfile.md).
import type { TranslationKey } from '@/i18n/translations'
import type { RatedItem } from '../types/dashboard-data'

// A Rating runs from 1 to RATING_MAX (Rating::VALUES on the server).
export const RATING_MAX = 10
export const RATING_VALUES = Array.from({ length: RATING_MAX }, (_, index) => index + 1)

// A latest Rating at or below this is an item to improve
// (PerformanceProfile::TO_IMPROVE_AT on the server).
export const TO_IMPROVE_AT = 4

// The scale's five labels, each naming two steps: 1-2, 3-4, 5-6, 7-8, 9-10.
const SCALE_KEYS: TranslationKey[] = [
  'evaluations.scale.beginning',
  'evaluations.scale.developing',
  'evaluations.scale.consistent',
  'evaluations.scale.proficient',
  'evaluations.scale.mastered',
]

type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string

// "Consistent" for 5 or 6.
export function scaleLabel(t: Translate, value: number) {
  return t(SCALE_KEYS[Math.ceil(value / 2) - 1])
}

// An item's name in the Client's language: "Technique", "Bandeja".
export function itemName(t: Translate, item: RatedItem) {
  return item.kind === 'area' ? t(`evaluations.areas.${item.key}`) : t(`evaluations.strokes.${item.key}`)
}

// How an item is keyed, as the server keys previous Ratings: "area:technique".
export const itemId = (item: RatedItem) => `${item.kind}:${item.key}`

export interface Point {
  x: number
  y: number
}

// The corner of a radar chart's axis `index` of `count`, at `fraction` of
// `radius` from `center`. The first axis points straight up, and the rest
// follow clockwise.
export function radarPoint(index: number, count: number, fraction: number, center: Point, radius: number): Point {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count
  const round = (n: number) => Math.round(n * 100) / 100
  return {
    x: round(center.x + Math.cos(angle) * radius * fraction),
    y: round(center.y + Math.sin(angle) * radius * fraction),
  }
}

// The polygon of `values` (1-10, or null when unrated, drawn at the centre)
// on a radar chart, as an SVG points attribute.
export function radarPolygon(values: (number | null)[], center: Point, radius: number, max = RATING_MAX) {
  return values
    .map((value, index) => {
      const point = radarPoint(index, values.length, (value ?? 0) / max, center, radius)
      return `${point.x},${point.y}`
    })
    .join(' ')
}
