import { Link } from '@inertiajs/react'
import type { Exercise } from '../../types/dashboard-data'
import { MediaPlaceholder } from './MediaPlaceholder'

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <Link
      href={'/dashboard/exercises/' + exercise.ref}
      className="overflow-hidden rounded-2xl border border-line bg-white transition-colors hover:border-teal"
    >
      <MediaPlaceholder label={exercise.media} reference={exercise.ref} className="h-24 lg:h-[140px]" />
      <div className="flex flex-col gap-1 px-3 pb-3 pt-2.5 lg:px-4 lg:pb-4">
        <div className="text-sm font-semibold leading-tight text-ink lg:text-[15px]">{exercise.title}</div>
        <div className="text-[11px] text-muted lg:text-xs">{exercise.category}</div>
      </div>
    </Link>
  )
}
