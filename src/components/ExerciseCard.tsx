import Image from 'next/image'
import { Field } from './Field'

interface ExerciseCardProps {
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
}

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <Field title={`Exercício ${exercise.title}`}>
      <>
        {exercise.description && <p className="text-gray-600 text-sm leading-relaxed mb-4">{exercise.description}</p>}
        {exercise.media ? (
          <div className="flex justify-center">
            <Image src={exercise.media.url} alt={exercise.title} className="max-w-full h-auto rounded-lg shadow-lg" />
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-500 text-sm">No media available for this exercise</p>
          </div>
        )}
      </>
    </Field>
  )
}
