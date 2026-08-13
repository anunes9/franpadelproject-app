import { Link } from '@inertiajs/react'
import { ProgressBar } from './ProgressBar'
import { Topic } from './Topic'
import { Pill } from './Pill'

export function ModuleCard({
  href,
  title,
  description,
  progress,
  duration,
  topics,
  pill,
  variant,
}: {
  href: string
  title: string
  description: string
  pill?: string
  progress?: number
  duration?: string
  topics?: string[]
  variant?: 'deafult' | 'index'
}) {
  const bgColor = progress === 100 ? 'bg-gray-200' : 'bg-white'

  if (variant === 'index') {
    return (
      <Link
        href={href}
        className={`flex flex-col gap-2 md:gap-4 rounded-2xl border border-line p-4 transition-colors hover:border-teal ${bgColor}`}
      >
        <div className="flex justify-between items-center">
          <span className="min-w-24 font-dash-mono text-lg font-black uppercase text-ink whitespace-nowrap">
            {title}
          </span>

          {pill && <Pill variant={progress === 100 ? 'full' : 'default'} text={pill} />}
        </div>

        <span className="flex text-sm  text-muted mb-4 md:mb-0">{description}</span>

        {topics ? (
          <div className="flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <Topic key={t}>{t}</Topic>
            ))}
          </div>
        ) : null}

        <div className="flex gap-4 items-center">
          <ProgressBar value={progress || 0} />

          {duration && (
            <span className="w-21 text-right font-dash-mono text-xs text-muted whitespace-nowrap">{duration}</span>
          )}
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 rounded-2xl border border-line p-4 transition-colors hover:border-teal ${bgColor}`}
    >
      <div className="flex md:flex-col justify-between items-center">
        <span className="min-w-24 font-dash-mono text-lg font-black uppercase text-ink whitespace-nowrap">{title}</span>

        {pill && <Pill variant={progress === 100 ? 'full' : 'default'} className="inline md:hidden" text={pill} />}
      </div>

      <div className="flex-1 flex-col">
        <span className="flex text-base  text-ink-soft mb-4 md:mb-0">{description}</span>

        {topics ? (
          <div className="flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <Topic key={t}>{t}</Topic>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 items-center">
        {pill && <Pill variant={progress === 100 ? 'full' : 'default'} className="hidden md:inline" text={pill} />}

        <ProgressBar value={progress || 0} />

        {duration && (
          <span className="w-21 text-right font-dash-mono text-xs text-muted whitespace-nowrap">{duration}</span>
        )}
      </div>
    </Link>
  )
}
