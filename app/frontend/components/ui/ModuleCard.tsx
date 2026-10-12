import { LockIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link } from '@inertiajs/react'
import type { TranslationKey } from '@/i18n/translations'
import { useTranslation } from '@/i18n/useTranslation'
import type { ModuleStatus } from '../../types/dashboard-data'
import { Pill } from './Pill'
import { ProgressBar } from './ProgressBar'
import { Topic } from './Topic'

const STATUS_LABEL_KEY: Record<ModuleStatus, TranslationKey> = {
  locked: 'common.status.locked',
  available: 'common.status.available',
  in_progress: 'common.status.inProgress',
  completed: 'common.status.completed',
}

const CARD_BASE = 'flex flex-col gap-2 md:gap-4 rounded-2xl border p-4'

export function ModuleCard({
  href,
  title,
  description,
  status,
  progress,
  duration,
  topics,
}: {
  href: string
  title: string
  description: string
  status: ModuleStatus
  progress: number
  duration?: string
  topics?: string[]
}) {
  const { t } = useTranslation()
  const locked = status === 'locked'

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={`min-w-0 break-words font-dash-mono text-lg font-semibold uppercase ${locked ? 'text-muted-strong' : 'text-ink'}`}
        >
          {title}
        </span>

        <Pill
          variant={status === 'completed' ? 'full' : locked ? 'muted' : 'default'}
          text={t(STATUS_LABEL_KEY[status])}
          icon={locked ? <HugeiconsIcon icon={LockIcon} size={11} strokeWidth={2} aria-hidden /> : undefined}
        />
      </div>

      <span className={`mb-4 flex text-sm md:mb-0 ${locked ? 'text-muted-strong' : 'text-muted'}`}>{description}</span>

      {topics && topics.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {topics.map((topic) => (
            <Topic key={topic}>{topic}</Topic>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-4">
        <ProgressBar value={progress} label={title} />

        {duration && <span className="whitespace-nowrap text-right font-dash-mono text-xs text-muted">{duration}</span>}
      </div>
    </>
  )

  // A Locked Module can't be opened (the server redirects too), so it isn't a
  // link at all -- the card still shows where it sits in the Course.
  if (locked) {
    return <div className={`${CARD_BASE} border-dashed border-line-strong/40 bg-paper`}>{body}</div>
  }

  return (
    <Link
      href={href}
      className={`${CARD_BASE} border-line shadow-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-teal hover:shadow-card-hover motion-reduce:transition-colors motion-reduce:hover:translate-y-0 bg-white`}
    >
      {body}
    </Link>
  )
}
