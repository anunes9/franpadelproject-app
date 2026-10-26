import type { ReactNode } from 'react'

const CARD = 'rounded-[18px] border border-line bg-white px-5 shadow-card'

// A white card listing rows; with none, a single line of `empty` copy (and
// `emptyAction` below it, what to do next), or nothing without it.
export function ListCard({
  count,
  empty,
  emptyAction,
  children,
}: {
  count: number
  empty?: string
  emptyAction?: ReactNode
  children?: ReactNode
}) {
  if (count === 0) {
    if (!empty) return null
    if (!emptyAction) return <p className={`${CARD} py-8 text-center text-sm text-muted`}>{empty}</p>

    return (
      <div className={`${CARD} flex flex-col items-center gap-3 py-8 text-center`}>
        <p className="text-sm text-muted">{empty}</p>
        {emptyAction}
      </div>
    )
  }

  return <ul className={`${CARD} py-2`}>{children}</ul>
}

// One row of a ListCard: its details on the left and an optional action on
// the right.
export function ListRow({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-4 border-b border-track py-3.5 last:border-0">{children}</li>
  )
}
