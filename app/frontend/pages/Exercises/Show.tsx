import { Link, usePage } from '@inertiajs/react'
import { Fragment } from 'react'
import type { ReactNode } from 'react'
import { AppShell } from '../../components/shell'
import { Eyebrow, MediaPlaceholder, Topic } from '../../components/ui'
import type { Exercise, Module } from '../../types/dashboard-data'
import { useTranslation } from '@/i18n/useTranslation'

interface Props {
  [key: string]: unknown
  exercise: Exercise
  courseModule: Module | null
}

function renderBoldText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const key = `${i}-${part}`
    return part.startsWith('**') && part.endsWith('**') ? (
      <strong key={key} className="font-semibold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={key}>{part}</Fragment>
    )
  })
}

function Show() {
  const { exercise, courseModule } = usePage<Props>().props
  const { t } = useTranslation()

  return (
    <div>
      <div className="relative">
        <MediaPlaceholder
          label={t('exercises.show.mediaPlaceholderSuffix', { media: exercise.media })}
          tone="dark"
          className="h-75 lg:h-115"
        />
        <Link
          href="/dashboard/exercises"
          className="absolute left-4 top-4 rounded-full bg-black/35 px-3 py-1.5 text-[13px] text-paper"
        >
          {t('common.back')}
        </Link>
      </div>

      <div className="px-5 py-5 lg:px-10 lg:py-8">
        <div className="mx-auto flex max-w-180 flex-col gap-4">
          <div>
            <div className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              {exercise.category} · {exercise.ref}
            </div>
            <h1 className="mt-1.5 text-2xl font-bold tracking-[-0.02em] text-ink lg:text-[32px]">{exercise.title}</h1>
          </div>

          <p className="text-[15px] leading-relaxed text-[#3B4B54]">{exercise.description}</p>

          <div className="flex gap-2">
            <Topic>{courseModule?.title ?? t('exercises.show.defaultModuleLabel')}</Topic>
            <Topic>{exercise.duration}</Topic>
          </div>

          {exercise.content && (
            <div className="flex flex-col gap-2">
              <Eyebrow>{t('exercises.show.detailsEyebrow')}</Eyebrow>
              <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-4">
                {exercise.content
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => (
                    <p key={line} className="text-[15px] leading-relaxed text-[#3B4B54]">
                      {renderBoldText(line)}
                    </p>
                  ))}
              </div>
            </div>
          )}

          <div className="mt-2 flex gap-2.5">
            <button
              type="button"
              className="flex-1 rounded-full bg-ink py-3.5 text-sm lg:text-base font-semibold text-paper"
            >
              {t('exercises.show.markComplete')}
            </button>

            <Link
              href="/dashboard/plan"
              className="rounded-full border border-line bg-white px-5 py-3.5 text-sm lg:text-base font-semibold text-ink"
            >
              {t('exercises.show.addToPlan')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

Show.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Show
