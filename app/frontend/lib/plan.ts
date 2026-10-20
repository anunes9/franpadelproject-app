import { router } from '@inertiajs/react'
import type { TranslationKey } from '@/i18n/translations'
import { CATEGORY_LABEL_KEY } from '../components/ui/CategoryFilter'
import type { PlanEntry } from '../types/dashboard-data'

export type PlanItem = Pick<PlanEntry, 'kind' | 'key'>

/** "exercise-1.6" → "1.6" */
export const exerciseNumber = (ref: string) => ref.replace(/^exercise-/, '')

/** Exercise titles repeat their number ("Exercício 1.6 – …"); the pill shows it instead. */
export const shortTitle = (title: string) => title.replace(/^exerc[ií]cio\s+(?:[ivx]+\s*)?[\d.()]+\s*[–—-]\s*/i, '')

/** An Exercise entry's detail is its category ("Technical"); show it in the Client's language. */
export function entryDetail(entry: PlanEntry, t: (key: TranslationKey) => string) {
  const { detail } = entry
  if (entry.kind === 'exercise' && detail && detail in CATEGORY_LABEL_KEY) {
    return t(CATEGORY_LABEL_KEY[detail as keyof typeof CATEGORY_LABEL_KEY])
  }
  return detail
}

export const isInDay = (entries: PlanEntry[], item: PlanItem) =>
  entries.some((e) => e.kind === item.kind && e.key === item.key)

export function addPlanEntry(day: string, item: PlanItem) {
  router.post('/dashboard/plan/entries', { day, ...item }, { preserveScroll: true, preserveState: true })
}

export function removePlanEntry(id: string) {
  router.delete(`/dashboard/plan/entries/${id}`, { preserveScroll: true, preserveState: true })
}
