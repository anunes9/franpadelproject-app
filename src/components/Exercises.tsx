'use client'

import { Button } from '@/components/ui/button'
import { Dumbbell, X, ImageIcon } from 'lucide-react'
import { Field } from '@/components/Field'
import { useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import ExerciseModal from './ExerciseModal'

interface Exercise {
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

interface ExercisesProps {
  exercises?: Exercise[]
}

export default function Exercises({ exercises }: ExercisesProps) {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)

  const handleExerciseClick = (exercise: Exercise) => {
    if (exercise.media?.url) {
      setSelectedExercise(exercise)
    }
  }

  const closeImageModal = () => setSelectedExercise(null)

  return (
    <Field title="Exercícios" icon={<Dumbbell className="h-5 w-5" />}>
      {exercises && exercises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((exercise) => (
            <Card
              key={exercise.id}
              className="w-full cursor-pointer hover:shadow-lg transition-all duration-200"
              onClick={() => handleExerciseClick(exercise)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold mb-2">Exercício {exercise.title}</CardTitle>
                    <div className="flex flex-col md:flex-row md:justify-between gap-2">
                      {exercise.description && (
                        <p className="text-gray-600 text-sm leading-relaxed">{exercise.description}</p>
                      )}

                      {exercise.media && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExerciseClick(exercise)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <ImageIcon className="h-4 w-4" />
                          View Image
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-sm">No exercises available for this module yet.</p>
        </div>
      )}

      {/* Image Modal - only shown when an exercise with media is selected */}
      {selectedExercise && selectedExercise.media && (
        <ExerciseModal exercise={selectedExercise} closeModal={closeImageModal} />
      )}
    </Field>
  )
}
