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
}: {
  href: string
  title: string
  description: string
  pill?: string
  progress?: number
  duration?: string
  topics?: string[]
}) {
  const bgColor = progress === 100 ? 'bg-gray-200' : 'bg-white'

  return (
    <Link
      href={href}
      className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 rounded-2xl border border-line p-4 transition-colors hover:border-teal ${bgColor}`}
    >
      <div className="flex justify-between items-center">
        <span className="min-w-24 font-dash-mono text-lg font-black uppercase text-ink">{title}</span>

        {pill && <Pill className="block md:hidden" text={pill} />}
      </div>

      <span className="flex-1 text-base  text-ink-soft mb-4 md:mb-0">{description}</span>

      <div className="flex flex-col gap-4 items-center">
        {pill && <Pill className="hidden md:block" text={pill} />}

        {topics ? (
          <div className="flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <Topic key={t}>{t}</Topic>
            ))}
          </div>
        ) : null}

        {progress ? (
          <span className="md:w-30 lg:w-block">
            <ProgressBar value={progress} />
          </span>
        ) : null}

        {duration && (
          <span className="w-21 text-right font-dash-mono text-xs text-muted hidden lg:block">{duration}</span>
        )}
      </div>
    </Link>
  )
}
