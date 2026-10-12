import type { ReactNode } from 'react'

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="font-dash-mono text-label uppercase text-muted">{children}</span>
}
