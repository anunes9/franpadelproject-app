import { useTranslation } from '@/i18n/useTranslation'
import { chipClass } from './styles'

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
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0">
      <button
        type="button"
        onClick={() => onChange('All')}
        aria-pressed={value === 'All'}
        className={chipClass(value === 'All')}
      >
        {t('exercises.index.allModules')}
      </button>
      {modules.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          aria-pressed={value === m.id}
          className={chipClass(value === m.id)}
        >
          {m.title}
        </button>
      ))}
    </div>
  )
}
