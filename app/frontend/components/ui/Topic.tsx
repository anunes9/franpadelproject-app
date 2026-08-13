import type { ReactNode } from 'react'

export function Topic({ children }: { children: ReactNode }) {
  return <span className="rounded-md bg-mist px-2 py-1 text-xs text-ink">{children}</span>
}
