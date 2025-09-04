import { Badge } from '@/components/ui/badge'
import { BookOpen, Clock, BookUp, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PageHeaderProps {
  title: string
  description?: string
  badgeText?: string
  progressPercentage?: number
  progressLabel?: string
  completedCount?: number
  totalCount?: number
  duration?: string
  level?: string
  topics?: string[]
  backLink?: string
  backLinkText?: string
  sticky?: boolean
}

export default function PageHeader({
  title,
  description,
  badgeText,
  progressPercentage = 0,
  progressLabel,
  completedCount,
  totalCount,
  duration,
  level,
  topics,
  backLink,
  backLinkText = 'Back to Dashboard',
  sticky = false,
}: PageHeaderProps) {
  return (
    <div
      className={`${
        sticky ? 'sticky top-16 z-40 backdrop-blur-sm bg-opacity-95' : ''
      } bg-p-green-light border-b border-border -mx-8 p-8 mb-12 `}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          {backLink && (
            <Link
              href={backLink}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
              prefetch={false}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{backLinkText}</span>
            </Link>
          )}

          <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
          {description && <p className="text-muted-foreground text-lg">{description}</p>}

          <div className="flex flex-wrap gap-4 items-center pt-4">
            {badgeText && <Badge variant="default">{badgeText}</Badge>}

            {level && (
              <Badge variant="default">
                <BookUp className="h-4 w-4 text-white" />
                <span className="text-sm text-white">{level}</span>
              </Badge>
            )}

            {duration && (
              <Badge variant="outline">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{duration}</span>
              </Badge>
            )}

            {topics && (
              <Badge variant="outline">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{topics.join(', ')}</span>
              </Badge>
            )}
          </div>
        </div>

        {(progressPercentage > 0 || (completedCount !== undefined && totalCount !== undefined)) && (
          <div className="mt-6 md:mt-0">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">{Math.round(progressPercentage)}%</div>

              <div className="w-24 bg-muted rounded-full h-2 mt-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
              </div>

              <Badge variant="outline" className="mt-4">
                {progressLabel || `${completedCount}/${totalCount}`}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
