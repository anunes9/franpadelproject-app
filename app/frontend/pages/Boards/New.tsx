// A new, scratch Board: kept in this browser until the Coach saves or
// closes it.
import { BoardScreen } from '../../board/BoardScreen'

export default function NewBoard() {
  return <BoardScreen saved={null} />
}
