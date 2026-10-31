// A new, scratch Board, or a copy of an Exercise's Board to adapt: kept in
// this browser until the Coach saves or closes it.
import { usePage } from '@inertiajs/react'
import { BoardScreen, type ExerciseCopy } from '../../board/BoardScreen'

interface Props {
  [key: string]: unknown
  from?: ExerciseCopy
}

export default function NewBoard() {
  const { from } = usePage<Props>().props
  return <BoardScreen key={from?.ref ?? 'new'} mode={{ kind: 'scratch', from: from ?? null }} />
}
