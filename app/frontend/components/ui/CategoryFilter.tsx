import type { TranslationKey } from '@/i18n/translations'
import { useTranslation } from '@/i18n/useTranslation'
import { chipClass } from './styles'

const CATEGORIES = ['All', 'Technical', 'Tactical'] as const

export const CATEGORY_LABEL_KEY: Record<(typeof CATEGORIES)[number], TranslationKey> = {
  All: 'common.category.all',
  Technical: 'common.category.technical',
  Tactical: 'common.category.tactical',
}

export function CategoryFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-pressed={value === c}
          className={chipClass(value === c)}
        >
          {t(CATEGORY_LABEL_KEY[c])}
        </button>
      ))}
    </div>
  )
}
