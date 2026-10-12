import { Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link, router, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { Fragment, useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { AppShell } from '../../components/shell'
import { BackLink, buttonClass, DocumentViewerModal, Eyebrow, MediaPlaceholder, Topic } from '../../components/ui'
import { CATEGORY_LABEL_KEY } from '../../components/ui/CategoryFilter'
import type { CourseDocument, Exercise, Module } from '../../types/dashboard-data'

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
          <BackLink href="/dashboard/exercises" label={t('common.back')} tone="dark" />
          <h1 className="text-balance text-title font-bold lg:text-title-lg">{exercise.title}</h1>
          <div className="flex flex-wrap gap-2">
            {exercise.category && <Topic tone="dark">{t(CATEGORY_LABEL_KEY[exercise.category])}</Topic>}
            <Topic tone="dark">{courseModule?.title ?? t('exercises.show.defaultModuleLabel')}</Topic>
            {exercise.duration && <Topic tone="dark">{exercise.duration}</Topic>}
          </div>
        </div>
      </div>

      <div className="px-5 py-5 lg:px-10 lg:py-8">
        <div className="mx-auto flex max-w-180 flex-col gap-4">
          {images.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {images.map((image, i) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setViewingImage(image)}
                  className="aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-white p-3 shadow-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-teal hover:shadow-card-hover motion-reduce:transition-colors motion-reduce:hover:translate-y-0"
                >
                  <img
                    src={image.url}
                    alt={t('exercises.show.imageAlt', { title: exercise.title, n: i + 1, total: images.length })}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          ) : (
            <MediaPlaceholder label={t('exercises.show.noImages')} className="aspect-[4/3]" />
          )}

          <p className="max-w-[68ch] text-base leading-relaxed text-ink-body">{exercise.description}</p>

          {exercise.content && (
            <div className="flex flex-col gap-2">
              <Eyebrow>{t('exercises.show.detailsEyebrow')}</Eyebrow>
              <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-4 shadow-card">
                {exercise.content
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => (
                    <p key={line} className="text-base leading-relaxed text-ink-body">
                      {renderBoldText(line)}
                    </p>
                  ))}
              </div>
            </div>
          )}

          <div className="mt-2 flex gap-2.5">
            {exercise.completed ? (
              <div className={buttonClass('done', 'flex-1')}>
                <HugeiconsIcon icon={Tick02Icon} size={18} strokeWidth={2} className="text-teal-deep" aria-hidden />
                {t('exercises.show.completed')}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={completing}
                className={buttonClass('primary', 'flex-1')}
              >
                {completing ? t('exercises.show.markingComplete') : t('exercises.show.markComplete')}
              </button>
            )}

            <Link href={`/dashboard/plan?exercise=${exercise.ref}`} className={buttonClass('secondary')}>
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
