import type { ReactNode } from 'react'

// A section's title, with an optional count beside it and a hint below. `id`
// lets the section name itself with aria-labelledby.
export function SectionHeading({
  id,
  title,
  count,
  hint,
}: {
  id?: string
  title: ReactNode
  count?: ReactNode
  hint?: ReactNode
}) {
  return (
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
}
