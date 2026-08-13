import type { ReactNode } from 'react'

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="font-dash-mono text-xs uppercase tracking-[0.12em] text-muted">{children}</span>
}
