import { useTranslation } from '@/i18n/useTranslation'

export function ModuleFilter({
  modules,
  value,
  onChange,
}: {
  modules: { id: string; title: string }[]
  value: string
  onChange: (v: string) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange('All')}
        className={
          'rounded-full border px-4 py-2 text-[13px] font-semibold transition-[transform,box-shadow,border-color,background-color,color] duration-150 ' +
          (value === 'All'
            ? 'border-ink bg-ink text-paper shadow-card-dark'
            : 'border-line bg-white text-muted-strong shadow-card hover:-translate-y-0.5 hover:border-teal hover:shadow-card-hover motion-reduce:hover:translate-y-0')
        }
      >
        {t('exercises.index.allModules')}
      </button>
      {modules.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          className={
            'rounded-full border px-4 py-2 text-[13px] font-semibold transition-[transform,box-shadow,border-color,background-color,color] duration-150 ' +
            (value === m.id
              ? 'border-ink bg-ink text-paper shadow-card-dark'
              : 'border-line bg-white text-muted-strong shadow-card hover:-translate-y-0.5 hover:border-teal hover:shadow-card-hover motion-reduce:hover:translate-y-0')
          }
        >
          {m.title}
        </button>
      ))}
    </div>
  )
}
