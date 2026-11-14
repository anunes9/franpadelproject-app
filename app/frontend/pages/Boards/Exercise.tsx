// An Exercise's official Board, as an Admin edits it, with its words in
// Portuguese and English.
import { usePage } from '@inertiajs/react'
import { type BoardExercise, BoardScreen } from '../../board/BoardScreen'

interface Props {
  [key: string]: unknown
  exercise: BoardExercise
  // The Board's document, or null while the Exercise has none.
  document: unknown | null
}

export default function ExerciseBoard() {
  const { exercise, document } = usePage<Props>().props
  return <BoardScreen key={exercise.ref} mode={{ kind: 'exercise', exercise, document }} />
}
