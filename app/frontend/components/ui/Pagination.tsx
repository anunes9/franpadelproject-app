import { useTranslation } from '@/i18n/useTranslation'
import { chipClass } from './styles'

export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number
  pages: number
  onChange: (page: number) => void
}) {
  const { t } = useTranslation()
  if (pages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={chipClass(false, 'disabled:pointer-events-none disabled:opacity-40')}
      >
        {t('exercises.index.previousPage')}
      </button>
      <span className="text-meta font-medium text-muted-strong tabular-nums">
        {t('exercises.index.pageOf', { page, pages })}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        className={chipClass(false, 'disabled:pointer-events-none disabled:opacity-40')}
      >
        {t('exercises.index.nextPage')}
      </button>
    </div>
  )
}
