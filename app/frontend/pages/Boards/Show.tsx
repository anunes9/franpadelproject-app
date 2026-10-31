// A Board from the Coach's own library.
import { usePage } from '@inertiajs/react'
import { BoardScreen, type SavedBoard } from '../../board/BoardScreen'

interface Props {
  [key: string]: unknown
  board: SavedBoard
}

export default function ShowBoard() {
  const { board } = usePage<Props>().props
  return <BoardScreen key={board.id} saved={board} />
}
