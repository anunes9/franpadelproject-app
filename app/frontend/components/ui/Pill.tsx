import type { ReactNode } from 'react'

const VARIANT_CLASSES = {
  full: 'border-teal-deep bg-teal-deep text-white',
  default: 'border-teal-line text-teal-deep',
  muted: 'border-line text-muted-strong',
} as const

export function Pill({
  text,
  className = '',
  variant = 'default',
  icon,
}: {
  text: string
  className?: string
  variant?: keyof typeof VARIANT_CLASSES
  icon?: ReactNode
}) {
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-1 font-dash-mono text-label uppercase ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {icon}
      {text}
    </span>
  )
}
