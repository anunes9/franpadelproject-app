'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Clock, Target, Zap, Users } from 'lucide-react'
import { useState, useEffect } from 'react'
import ExerciseModal from './ExerciseModal'

interface ExerciseCardProps {
  exercise: {
    id: string
    title: string
    category: string
    difficulty: string
    duration: string
    description: string
    completed: boolean
    iconName: string
    externalId: string
    media?: {
      url: string
      fileName: string
      contentType: string
    }
  }
}

export default function ExerciseCardClient({ exercise }: ExerciseCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Map icon names to actual icon components
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Target':
        return Target
      case 'Zap':
        return Zap
      case 'Users':
        return Users
      case 'Clock':
        return Clock
      default:
        return Target
    }
  }

  const IconComponent = getIconComponent(exercise.iconName)

  const openModal = () => {
    if (exercise.media?.url) {
      setIsModalOpen(true)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  // Add ESC key listener to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpen) {
        closeModal()
      }
    }

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [isModalOpen])

  return (
    <>
      <Card
        className={`hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 ${
          exercise.completed ? 'ring-2 ring-green-200' : ''
        }`}
        onClick={exercise.media?.url ? openModal : undefined}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-lg ${
                  exercise.completed
                    ? 'bg-green-100 text-green-600'
                    : exercise.category === 'Technical'
                    ? 'bg-primary/10 text-primary'
                    : exercise.category === 'Tactical'
                    ? 'bg-accent/10 text-accent'
                    : 'bg-orange-100 text-orange-600'
                }`}
              >
                <IconComponent className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{exercise.title}</CardTitle>
                <CardDescription className="text-sm">{exercise.category}</CardDescription>
              </div>
            </div>
            <Badge
              variant={
                exercise.difficulty === 'Beginner'
                  ? 'outline'
                  : exercise.difficulty === 'Intermediate'
                  ? 'default'
                  : 'destructive'
              }
            >
              {exercise.difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{exercise.description}</p>

          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{exercise.duration}</span>
          </div>

          <Button className="w-full cursor-pointer" variant="default">
            <Play className="h-4 w-4 mr-2" />
            Visualizar Exercício
          </Button>
        </CardContent>
      </Card>

      {/* Modal for displaying media */}
      {isModalOpen && exercise.media?.url && <ExerciseModal exercise={exercise} closeModal={closeModal} />}
    </>
  )
}
