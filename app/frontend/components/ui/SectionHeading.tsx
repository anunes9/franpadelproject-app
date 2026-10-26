import type { ReactNode } from 'react'

// A section's title, with an optional count beside it, a hint below, and an
// action (such as a link to the full list) on the right. `id` lets the
// section name itself with aria-labelledby.
export function SectionHeading({
  id,
  title,
  count,
  hint,
  action,
}: {
  id?: string
  title: ReactNode
  count?: ReactNode
  hint?: ReactNode
  action?: ReactNode
}) {
  const heading = (
    <div className="flex flex-col gap-0.5">
      <h2 id={id} className="text-sm font-bold text-ink">
        {title}
        {count !== undefined && (
          <>
            {' '}
            <span className="font-dash-mono text-meta font-semibold text-muted">{count}</span>
          </>
        )}
      </h2>
      {hint && <p className="text-meta text-muted">{hint}</p>}
    </div>
  )
  if (!action) return heading

  return (
    <div className="flex items-center justify-between gap-4">
      {heading}
      {action}
    </div>
  )
}
