import { Link } from '@/i18n/routing'
import { ComponentProps } from 'react'

type LocaleLinkProps = ComponentProps<typeof Link>

export function LocaleLink({ href, ...props }: LocaleLinkProps) {
  return <Link href={href} {...props} />
}

