'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { locales } from '@/i18n/config'

const localeNames: Record<string, string> = {
  en: 'English',
  pt: 'Português',
}

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <div className="flex items-center gap-2">
      {locales.map((loc) => (
        <Button
          key={loc}
          size="sm"
          variant="outline"
          onClick={() => handleLocaleChange(loc)}
          className={locale === loc ? 'bg-p-green/50' : ''}
        >
          {localeNames[loc]}
        </Button>
      ))}
    </div>
  )
}

