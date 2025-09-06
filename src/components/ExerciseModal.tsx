import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import Image from 'next/image'

interface ExerciseModalProps {
  exercise: {
    id: string
    externalId: string
    title: string
    description?: string
    media?: {
      url: string
      fileName: string
      contentType: string
    }
  }
  closeModal: () => void
}

export default function ExerciseModal({ exercise, closeModal }: ExerciseModalProps) {
  if (!exercise) return null

  if (!exercise.media?.url) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{exercise.title}</h3>
          <Button variant="outline" size="sm" onClick={closeModal} className="cursor-pointer">
            <X className="h-4 w-4" /> Fechar
          </Button>
        </div>
        <div className="flex justify-center">
          <Image
            src={`https:${exercise.media.url}`}
            alt={exercise.media.fileName || exercise.title}
            className="w-full h-full max-h-[70vh] max-w-[90vw]"
            width={400}
            height={400}
          />
        </div>
        {exercise.description && (
          <p className="text-sm text-muted-foreground mt-2 text-center">{exercise.description}</p>
        )}
      </div>
    </div>
  )
}
