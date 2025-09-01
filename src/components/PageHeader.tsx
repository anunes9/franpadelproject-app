import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  badgeText?: string
  progressPercentage?: number
  progressLabel?: string
  completedCount?: number
  totalCount?: number
  duration?: string
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
}: PageHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-accent/10 to-primary/10 border-b border-border -mx-8 p-8 mb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
          {description && <p className="text-muted-foreground text-lg mb-4">{description}</p>}

          <div className="flex items-center space-x-4">
            {badgeText && <Badge variant="default">{badgeText}</Badge>}

            {duration && (
              <Badge variant="outline">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{duration}</span>
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
