import { usePage } from '@inertiajs/react'
import type { PluralKey, TranslationKey } from './translations'
import { translations } from './translations'
import { getByPath, interpolate } from './utils'

const PLURAL_LOCALE = { pt: 'pt-PT', en: 'en' } as const

export function useTranslation() {
  const { locale } = usePage().props
  const dict = translations[locale]

  function t(key: TranslationKey, vars?: Record<string, string | number>): string {
    const template = getByPath(dict, key)
    return vars ? interpolate(template, vars) : template
  }

  // Picks the `one` or `other` form for `count` using the locale's plural
  // rules, and passes `count` through for interpolation.
  function tn(key: PluralKey, count: number, vars?: Record<string, string | number>): string {
    const form = new Intl.PluralRules(PLURAL_LOCALE[locale]).select(count) === 'one' ? 'one' : 'other'
    return t(`${key}.${form}` as TranslationKey, { count, ...vars })
  }

  return { t, tn, locale }
}
