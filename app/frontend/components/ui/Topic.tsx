import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  tone?: 'light' | 'dark'
}

export function Topic({ children, tone = 'light' }: Props) {
  const toneClasses = tone === 'dark' ? 'bg-paper/10 text-paper' : 'bg-mist text-ink'
  return <span className={`rounded-md px-2 py-1 text-xs ${toneClasses}`}>{children}</span>
}
