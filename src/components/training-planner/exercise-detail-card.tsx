'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Image as ImageIcon, Film, Download } from 'lucide-react'
import { Exercise } from '@/lib/contentful/exercises-delivery'
import Image from 'next/image'

interface ExerciseDetailCardProps {
  exercise: Exercise
  onRemove: () => void
}

export function ExerciseDetailCard({ exercise, onRemove }: ExerciseDetailCardProps) {
  const isVideo = exercise.media?.contentType.startsWith('video/')
  const isImage = exercise.media?.contentType.startsWith('image/')

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{exercise.title}</CardTitle>
            {exercise.media && (
              <Badge variant="outline" className="text-xs">
                {isVideo ? <Film className="h-3 w-3 mr-1" /> : <ImageIcon className="h-3 w-3 mr-1" />}
                {isVideo ? 'Vídeo' : 'Imagem'}
              </Badge>
            )}
          </div>
          <Button size="icon" variant="ghost" onClick={onRemove} className="flex-shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {exercise.description && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Descrição</h4>
            <p className="text-sm text-muted-foreground">{exercise.description}</p>
          </div>
        )}

        {/* Media Preview */}
        {exercise.media && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Média</h4>
            <div className="space-y-3">
              {isImage && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                  <Image src={`https:${exercise.media.url}`} alt={exercise.title} fill className="object-cover" />
                </div>
              )}
              {isVideo && (
                <video controls className="w-full rounded-lg">
                  <source src={`https:${exercise.media.url}`} type={exercise.media.contentType} />O teu navegador não
                  suporta vídeo.
                </video>
              )}
              <a
                href={`https:${exercise.media.url}`}
                download={exercise.media.fileName}
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Download className="h-4 w-4" />
                Descarregar {exercise.media.fileName}
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
