import { useTranslation } from '@/i18n/useTranslation'

export function ProgressBar({
  value,
  tone = 'light',
  label,
}: {
  value: number
  tone?: 'light' | 'dark'
  label?: string
}) {
  const { t } = useTranslation()
  const percent = Math.min(100, Math.max(0, Math.round(value)))

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={t('common.progress', { percent })}
      aria-label={label}
      className={`h-1 w-full overflow-hidden rounded-full ${tone === 'dark' ? 'bg-paper/15' : 'bg-track'}`}
    >
      <div className={`h-full ${tone === 'dark' ? 'bg-teal' : 'bg-teal-deep'}`} style={{ width: `${percent}%` }} />
    </div>
  )
}
