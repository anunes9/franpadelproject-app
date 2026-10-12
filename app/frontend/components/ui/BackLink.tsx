import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link } from '@inertiajs/react'

const TONE = {
  light: 'text-muted hover:text-ink',
  dark: 'text-ink-mute hover:text-paper',
} as const

// "Back" with a drawn arrow; a link when given `href`, otherwise a button.
export function BackLink({
  label,
  href,
  onClick,
  tone = 'light',
}: {
  label: string
  href?: string
  onClick?: () => void
  tone?: keyof typeof TONE
}) {
  const className = `-my-2 -ml-1 flex min-h-11 w-fit items-center gap-1 text-meta transition-colors ${TONE[tone]}`
  const content = (
    <>
      <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={1.75} aria-hidden />
      {label}
    </>
  )

  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  )
}
