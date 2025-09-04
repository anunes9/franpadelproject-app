'use client'

import { Button } from '@/components/ui/button'
import { Dumbbell, X, ImageIcon } from 'lucide-react'
import { Field } from '@/components/Field'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
    if (exercise.media) {
      setSelectedExercise(exercise)
    }
  }

  const closeImageModal = () => {
    setSelectedExercise(null)
  }

  return (
    <Field title="Exercícios" icon={<Dumbbell className="h-5 w-5" />}>
      {exercises && exercises.length > 0 ? (
        <div className="space-y-4">
          {exercises.map((exercise) => (
            <Card key={exercise.id} className="w-full">
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
                          className="flex items-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative max-w-4xl max-h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">{selectedExercise.title}</h3>
              <Button variant="outline" onClick={closeImageModal} className="text-black border-white hover:bg-white/20">
                <X className="h-4 w-4" /> Close
              </Button>
            </div>
            <div className="bg-white rounded-lg overflow-hidden">
              <img
                src={selectedExercise.media.url}
                alt={selectedExercise.title}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </Field>
  )
}
