import type { Locale } from '@/types'
import { en } from './en'
import { pt } from './pt'

export const translations: Record<Locale, typeof en> = { en, pt }

type DotPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPaths<T[K]>}`
}[keyof T & string]

export type TranslationKey = DotPaths<typeof en>

// A key whose value is a { one, other } pair, for useTranslation's `tn`.
export type PluralKey = {
  [K in TranslationKey]: K extends `${infer Base}.other` ? (`${Base}.one` extends TranslationKey ? Base : never) : never
}[TranslationKey]
