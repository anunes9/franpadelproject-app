import type { Locale } from '@/types'
import { en } from './en'
import { pt } from './pt'

export const translations: Record<Locale, typeof en> = { en, pt }

type DotPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPaths<T[K]>}`
}[keyof T & string]

export type TranslationKey = DotPaths<typeof en>
