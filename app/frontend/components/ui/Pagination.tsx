import { useTranslation } from '@/i18n/useTranslation'

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
        className="rounded-full border border-line bg-white px-4 py-2 text-[13px] font-semibold text-muted-strong shadow-card transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:border-teal hover:shadow-card-hover disabled:pointer-events-none disabled:opacity-40 motion-reduce:hover:translate-y-0"
      >
        {t('exercises.index.previousPage')}
      </button>
      <span className="text-[13px] font-medium text-muted-strong">
        {t('exercises.index.pageOf', { page, pages })}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        className="rounded-full border border-line bg-white px-4 py-2 text-[13px] font-semibold text-muted-strong shadow-card transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:border-teal hover:shadow-card-hover disabled:pointer-events-none disabled:opacity-40 motion-reduce:hover:translate-y-0"
      >
        {t('exercises.index.nextPage')}
      </button>
    </div>
  )
}
