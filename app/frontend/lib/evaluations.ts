// Ratings, Profile Areas and Strokes as the Evaluation form and the
// Performance Profile show them (docs/specs/PlayerPerformanceProfile.md).
import type { TranslationKey } from '@/i18n/translations'
import type { RatedItem } from '../types/dashboard-data'

export const RATING_VALUES = [1, 2, 3, 4, 5] as const

const SCALE_KEYS: Record<number, TranslationKey> = {
  1: 'evaluations.scale.beginning',
  2: 'evaluations.scale.developing',
  3: 'evaluations.scale.consistent',
  4: 'evaluations.scale.proficient',
  5: 'evaluations.scale.mastered',
}

type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string

// "Consistent" for 3.
export function scaleLabel(t: Translate, value: number) {
  return t(SCALE_KEYS[value])
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

// The polygon of `values` (1-5, or null when unrated, drawn at the centre)
// on a radar chart, as an SVG points attribute.
export function radarPolygon(values: (number | null)[], center: Point, radius: number, max = 5) {
  return values
    .map((value, index) => {
      const point = radarPoint(index, values.length, (value ?? 0) / max, center, radius)
      return `${point.x},${point.y}`
    })
    .join(' ')
}
