import { usePage } from '@inertiajs/react'
import type { TranslationKey } from './translations'
import { translations } from './translations'
import { getByPath, interpolate } from './utils'

export function useTranslation() {
  const { locale } = usePage().props
  const dict = translations[locale]

  function t(key: TranslationKey, vars?: Record<string, string | number>): string {
    const template = getByPath(dict, key)
    return vars ? interpolate(template, vars) : template
  }

  return { t, locale }
}
