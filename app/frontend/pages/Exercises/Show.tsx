import { Add01Icon, ArrowLeft01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link, router, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { Fragment, useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { AppShell } from '../../components/shell'
import {
  buttonClass,
  DocumentViewerModal,
  Eyebrow,
  MediaPlaceholder,
  RoundIcon,
  Tile,
  TilePill,
} from '../../components/ui'
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
  const [hero, ...thumbnails] = images
  const imageAlt = (n: number) => t('exercises.show.imageAlt', { title: exercise.title, n, total: images.length })

  return (
    <div className="px-5 pt-5 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-180 flex-col gap-4 lg:gap-5">
        <div className="flex items-center justify-between gap-3">
          <RoundIcon icon={ArrowLeft01Icon} label={t('common.back')} href="/dashboard/exercises" />
          {exercise.category && (
            <span className="truncate text-sm font-semibold text-ink">{t(CATEGORY_LABEL_KEY[exercise.category])}</span>
          )}
          <span className="h-11 w-11 shrink-0" aria-hidden="true" />
        </div>

        {hero ? (
          <button
            type="button"
            onClick={() => setViewingImage(hero)}
            className="relative aspect-[3/2] w-full overflow-hidden rounded-[22px] bg-tint-teal p-3 pt-12 transition-transform duration-150 active:scale-[0.99] motion-reduce:active:scale-100"
          >
            <img src={hero.url} alt={imageAlt(1)} className="h-full w-full object-contain" />
            {images.length > 1 && (
              <TilePill className="absolute left-3.5 top-3.5 font-dash-mono text-[10px] tracking-[0.06em]">
                {t('exercises.show.imageCounter', { index: 1, total: images.length })}
              </TilePill>
            )}
          </button>
        ) : (
          <MediaPlaceholder label={t('exercises.show.noImages')} className="aspect-[4/3] rounded-[22px]" />
        )}

        {thumbnails.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {thumbnails.map((image, i) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setViewingImage(image)}
                className="aspect-[4/3] overflow-hidden rounded-xl bg-tint-ink p-1.5"
              >
                <img src={image.url} alt={imageAlt(i + 2)} loading="lazy" className="h-full w-full object-contain" />
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <h1 className="text-balance text-2xl font-extrabold leading-[1.1] tracking-[-0.02em] text-ink lg:text-[30px]">
            {exercise.title}
          </h1>
          <div className="flex flex-wrap gap-2">
            {exercise.duration && (
              <span className="rounded-full bg-tint-clay px-3 py-1.5 text-xs font-semibold text-ink">
                {exercise.duration}
              </span>
            )}
            <span className="rounded-full bg-tint-ink px-3 py-1.5 text-xs font-semibold text-ink">
              {courseModule?.title ?? t('exercises.show.defaultModuleLabel')}
            </span>
            <span className="rounded-full bg-tint-teal px-3 py-1.5 font-dash-mono text-xs font-medium text-ink">
              {exercise.ref.replace(/^exercise-/, '')}
            </span>
          </div>
        </div>

        <p className="max-w-[68ch] text-base leading-relaxed text-ink-body">{exercise.description}</p>

        {exercise.content && (
          <div className="flex flex-col gap-2">
            <Eyebrow>{t('exercises.show.detailsEyebrow')}</Eyebrow>
            <Tile tone="outline" className="flex flex-col gap-1.5">
              {exercise.content
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => (
                  <p key={line} className="text-base leading-relaxed text-ink-body">
                    {renderBoldText(line)}
                  </p>
                ))}
            </Tile>
          </div>
        )}

        <div className="mt-1 flex gap-2.5">
          {exercise.completed ? (
            <div className={buttonClass('done', 'min-h-14 flex-1')}>
              <HugeiconsIcon icon={Tick02Icon} size={18} strokeWidth={2} className="text-teal-deep" aria-hidden />
              {t('exercises.show.completed')}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={completing}
              className={buttonClass('primary', 'min-h-14 flex-1')}
            >
              {completing ? t('exercises.show.markingComplete') : t('exercises.show.markComplete')}
            </button>
          )}

          <Link
            href={`/dashboard/plan?exercise=${exercise.ref}`}
            aria-label={t('exercises.show.addToPlan')}
            className={buttonClass('secondary', 'min-h-14')}
          >
            <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={1.8} aria-hidden />
            {t('exercises.show.planShort')}
          </Link>
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

Show.layout = (page: ReactNode) => <AppShell mobileHeader={false}>{page}</AppShell>

export default Show
