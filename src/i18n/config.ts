export const locales = ['en', 'pt'] as const
export const defaultLocale = 'en' as const

export type Locale = (typeof locales)[number]

// Map next-intl locales to Contentful locales
export const contentfulLocaleMap: Record<Locale, string> = {
  en: 'en-US',
  pt: 'pt',
}

