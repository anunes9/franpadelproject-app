import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/translations'

const CATEGORIES = ['All', 'Technical', 'Tactical'] as const

const CATEGORY_LABEL_KEY: Record<(typeof CATEGORIES)[number], TranslationKey> = {
  All: 'common.category.all',
  Technical: 'common.category.technical',
  Tactical: 'common.category.tactical',
}

export function CategoryFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex gap-2">
      {CATEGORIES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={
            'rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ' +
            (value === c ? 'border-ink bg-ink text-paper' : 'border-line bg-white text-[#56666F] hover:border-teal')
          }
        >
          {t(CATEGORY_LABEL_KEY[c])}
        </button>
      ))}
    </div>
  )
}
