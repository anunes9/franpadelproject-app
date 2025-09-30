import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Clock } from 'lucide-react'
import { Button } from '../ui/button'
import { getStatusIcon, getStatusColor } from '@/utils/modules'
import { Module } from '@/lib/contentful/modules'

export const CourseCard = ({ status, module }: { status: string; module: Module }) => {
  const link = status === 'locked' ? '#' : `/dashboard/${module.level.toLowerCase()}/${module.externalId}`

  const buttonText =
    status === 'locked'
      ? 'Bloqueado'
      : status === 'completed'
      ? 'Revisitar'
      : status === 'in_progress'
      ? 'Continuar'
      : 'Iniciar'

  const buttonColor =
    status === 'locked'
      ? 'bg-gray-100 text-gray-400 '
      : status === 'completed'
      ? 'bg-green-500 text-white hover:bg-green-200'
      : status === 'in_progress'
      ? 'bg-blue-500 hover:bg-blue-600 text-white'
      : 'bg-green-100 text-green-600 hover:bg-green-200'

  return (
    <Link href={link} prefetch={false} key={module.id}>
      <Card
        className={`hover:shadow-lg transition-all duration-200 ${
          status === 'locked' ? 'opacity-60' : 'cursor-pointer hover:scale-105 h-full'
        }`}
      >
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${getStatusColor(status)}`}>{getStatusIcon(status)}</div>
            <div>
              <CardTitle className="text-lg">{module.title}</CardTitle>
              <CardDescription className="text-sm">{module.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Topics */}
            {module.topics && module.topics.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Tópicos:</h4>
                <div className="flex flex-wrap gap-1">
                  {module.topics.map((topic, topicIndex) => (
                    <Badge key={topicIndex} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Duration */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{module.duration}</span>
            </div>

            {/* Action Button */}
            <Button className={`w-full ${buttonColor} cursor-pointer`} disabled={status === 'locked'}>
              {buttonText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
