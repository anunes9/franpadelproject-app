import { Link } from '@inertiajs/react'
import { useTranslation } from '@/i18n/useTranslation'
import { parseBoard } from '../../board/document'
import { BoardPreview } from '../../board/Preview'
import type { Exercise } from '../../types/dashboard-data'
import { CATEGORY_LABEL_KEY } from './CategoryFilter'
import { MediaPlaceholder } from './MediaPlaceholder'

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const { t } = useTranslation()
  const category = exercise.category ? t(CATEGORY_LABEL_KEY[exercise.category]) : ''
  const image = exercise.media.find((file) => file.contentType.startsWith('image/'))
  // Its Board, when it has one, is its court diagram in place of the image.
  const board = parseBoard(exercise.board)

  return (
    <Link
      href={`/dashboard/exercises/${exercise.ref}`}
      className="overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-teal hover:shadow-card-hover motion-reduce:transition-colors motion-reduce:hover:translate-y-0"
    >
      {board ? (
        <div className="h-24 bg-paper p-1 lg:h-[140px]">
          <BoardPreview
            doc={board}
            label={t('boards.viewer.label', { title: exercise.title, step: 1, count: board.steps.length })}
          />
        </div>
      ) : image ? (
        <img src={image.url} alt="" loading="lazy" className="h-24 w-full object-cover lg:h-[140px]" />
      ) : (
        <MediaPlaceholder className="h-24 lg:h-[140px]" />
      )}
      <div className="flex flex-col gap-1 px-3 pb-3 pt-2.5 lg:px-4 lg:pb-4">
        <div className="text-sm font-semibold leading-tight text-ink lg:text-base">{exercise.title}</div>
        {category && <div className="text-xs text-muted">{category}</div>}
      </div>
    </Link>
  )
}
