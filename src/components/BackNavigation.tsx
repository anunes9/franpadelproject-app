import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface BackNavigationProps {
  href?: string
  text?: string
}

export default function BackNavigation({ href = '/dashboard', text = 'Back to Dashboard' }: BackNavigationProps) {
  return (
    <div className="mb-6">
      <Link
        href={href}
        className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{text}</span>
      </Link>
    </div>
  )
}
