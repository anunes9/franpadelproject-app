import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link } from '@inertiajs/react'
import type { ReactNode } from 'react'

export type TileTone = 'teal' | 'ink' | 'clay' | 'outline'

const TONE: Record<TileTone, string> = {
  teal: 'bg-tint-teal',
  ink: 'bg-tint-ink',
  clay: 'bg-tint-clay',
  outline: 'border border-line bg-white',
}

/**
 * Soft rounded tile — the basic surface of the dashboard. Tinted tones take
 * ink text directly; `outline` is the neutral white card. Pass `href` to make
 * the whole tile a link.
 */
export function Tile({
  tone = 'outline',
  href,
  className = '',
  children,
}: {
  tone?: TileTone
  href?: string
  className?: string
  children: ReactNode
}) {
  const classes = `rounded-[22px] p-4 text-ink lg:p-5 ${TONE[tone]} ${className}`
  if (href) {
    return (
      <Link
        href={href}
        className={`${classes} transition-transform duration-150 active:scale-[0.99] motion-reduce:active:scale-100`}
      >
        {children}
      </Link>
    )
  }
  return <div className={classes}>{children}</div>
}

/** Ink circle with an outward arrow — marks a tile as a destination. */
export function ArrowBadge({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  return (
    <span className={`flex ${dim} shrink-0 items-center justify-center rounded-full bg-ink text-paper`}>
      <HugeiconsIcon icon={ArrowUpRight01Icon} size={size === 'sm' ? 15 : 18} strokeWidth={1.8} />
    </span>
  )
}

/** 44px outlined circle holding one icon, as a link or a button. */
export function RoundIcon({
  icon,
  label,
  href,
  onClick,
  className = '',
}: {
  icon: typeof ArrowUpRight01Icon
  label: string
  href?: string
  onClick?: () => void
  className?: string
}) {
  const classes = `flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink ${className}`
  const glyph = <HugeiconsIcon icon={icon} size={20} strokeWidth={1.7} />
  if (href) {
    return (
      <Link href={href} aria-label={label} className={classes}>
        {glyph}
      </Link>
    )
  }
  return (
    <button type="button" aria-label={label} onClick={onClick} className={classes}>
      {glyph}
    </button>
  )
}

/** Small white pill used for a category or a count inside a tinted tile. */
export function TilePill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`w-fit whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-ink ${className}`}
    >
      {children}
    </span>
  )
}
