import { ProgressBar } from './ProgressBar'

export function Card({
  title,
  content,
  details,
  progress,
  tone = 'light',
}: {
  title?: string
  content: string | number
  details?: string
  progress?: number
  tone?: 'light' | 'dark'
}) {
  return (
    <div
      className={`flex flex-col justify-between gap-4 rounded-[18px] p-4 lg:p-6 ${tone === 'light' ? 'border-line bg-white' : 'bg-ink text-paper'}`}
    >
      <div className="flex flex-col gap-4">
        {title && <span className="font-dash-mono text-sm uppercase tracking-[0.12em] text-ink-mute">{title}</span>}

        <span
          className={`text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] ${tone === 'light' ? 'text-ink' : ''}`}
        >
          {content}
        </span>
      </div>

      {(details || progress) && (
        <div className="flex flex-col gap-4">
          {details && <span className="text-sm text-ink-mute">{details}</span>}

          {progress && <ProgressBar value={progress} tone="dark" />}
        </div>
      )}
    </div>
  )
}
