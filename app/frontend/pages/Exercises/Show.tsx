import { Link, router, usePage } from '@inertiajs/react'
import { Fragment, useState } from 'react'
import type { ReactNode } from 'react'
import { AppShell } from '../../components/shell'
import { DocumentViewerModal, Eyebrow, MediaPlaceholder, Topic } from '../../components/ui'
import type { CourseDocument, Exercise, Module } from '../../types/dashboard-data'
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
  const [completing, setCompleting] = useState(false)
  const [viewingImage, setViewingImage] = useState<CourseDocument | null>(null)

  function handleComplete() {
    setCompleting(true)
    router.patch(
      `/dashboard/exercises/${exercise.ref}/complete`,
      {},
      { preserveScroll: true, onFinish: () => setCompleting(false) }
    )
  }

  const images = exercise.media.filter((file) => file.contentType.startsWith('image/'))

  return (
    <div>
      <div className="bg-ink px-5 pb-6 pt-6 text-paper lg:px-10 lg:pb-10 lg:pt-9">
        <div className="mx-auto flex max-w-180 flex-col gap-3.5">
          <Link href="/dashboard/exercises" className="text-[13px] text-ink-mute hover:text-paper">
            {t('common.back')}
          </Link>
          <div>
            <div className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-teal">
              {exercise.category} · {exercise.ref}
            </div>
            <h1 className="mt-1.5 text-2xl font-bold tracking-[-0.02em] lg:text-[32px]">{exercise.title}</h1>
          </div>
          <div className="flex gap-2">
            <Topic tone="dark">{courseModule?.title ?? t('exercises.show.defaultModuleLabel')}</Topic>
            <Topic tone="dark">{exercise.duration}</Topic>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 lg:px-10 lg:py-8">
        <div className="mx-auto flex max-w-180 flex-col gap-4">
          {images.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {images.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setViewingImage(image)}
                  className="aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-white p-3 shadow-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-teal hover:shadow-card-hover motion-reduce:transition-colors motion-reduce:hover:translate-y-0"
                >
                  <img src={image.url} alt={exercise.title} className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          ) : (
            <MediaPlaceholder label={t('exercises.show.mediaPlaceholderSuffix')} className="aspect-[4/3]" />
          )}

          <p className="text-[15px] leading-relaxed text-ink-body">{exercise.description}</p>

          {exercise.content && (
            <div className="flex flex-col gap-2">
              <Eyebrow>{t('exercises.show.detailsEyebrow')}</Eyebrow>
              <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-4 shadow-card">
                {exercise.content
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => (
                    <p key={line} className="text-[15px] leading-relaxed text-ink-body">
                      {renderBoldText(line)}
                    </p>
                  ))}
              </div>
            </div>
          )}

          <div className="mt-2 flex gap-2.5">
            {exercise.completed ? (
              <div className="flex-1 rounded-full border border-line bg-white py-3.5 text-center text-sm font-semibold text-muted shadow-card lg:text-base">
                {t('exercises.show.completed')}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={completing}
                className="flex-1 rounded-full bg-ink py-3.5 text-sm lg:text-base font-semibold text-paper shadow-card-dark transition-[transform,opacity] duration-150 active:scale-[0.98] disabled:opacity-60 motion-reduce:active:scale-100"
              >
                {completing ? t('exercises.show.markingComplete') : t('exercises.show.markComplete')}
              </button>
            )}

            <Link
              href={`/dashboard/plan?exercise=${exercise.ref}`}
              className="rounded-full border border-line bg-white px-5 py-3.5 text-sm lg:text-base font-semibold text-ink shadow-card transition-transform duration-150 active:scale-[0.98] motion-reduce:active:scale-100"
            >
              {t('exercises.show.addToPlan')}
            </Link>
          </div>
        </div>
      </div>

      {viewingImage && (
        <DocumentViewerModal
          document={viewingImage}
          onClose={() => setViewingImage(null)}
          closeLabel={t('courses.show.closeDocument')}
        />
      )}
    </div>
  )
}

Show.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Show
