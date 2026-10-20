import { useTranslation } from '@/i18n/useTranslation'

const TRACK = {
  light: 'h-1 bg-track',
  dark: 'h-1 bg-paper/15',
  // Thick bar for tinted tiles: white track, ink fill.
  tile: 'h-2.5 bg-white',
} as const

const FILL = {
  light: 'bg-teal-deep',
  dark: 'bg-teal',
  tile: 'rounded-full bg-ink',
} as const

export function ProgressBar({
  value,
  tone = 'light',
  label,
}: {
  value: number
  tone?: 'light' | 'dark' | 'tile'
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
      className={`w-full overflow-hidden rounded-full ${TRACK[tone]}`}
    >
      <div className={`h-full ${FILL[tone]}`} style={{ width: `${percent}%` }} />
    </div>
  )
}
