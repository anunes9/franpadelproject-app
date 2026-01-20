'use client'

import { useState } from 'react'
import { type Exercise } from '@/lib/contentful/exercises-delivery'
import { Dumbbell, Filter, Search, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import Image from 'next/image'

// Helper function to normalize URLs (convert protocol-relative to absolute)
function normalizeUrl(url: string): string {
  if (!url) return url
  if (url.startsWith('//')) {
    return `https:${url}`
  }
  return url
}

interface ExercisesPageClientProps {
  exercises: Exercise[]
}

export function ExercisesPageClient({ exercises: initialExercises }: ExercisesPageClientProps) {
  const [exercises] = useState(initialExercises)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Dumbbell className="h-5 w-5" />
            <span className="text-sm font-bold uppercase tracking-widest">Training Library</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-p-blue md:text-4xl">
            Padel Exercises
          </h1>
          <p className="text-p-blue/60 text-lg max-w-2xl">
            Browse our collection of dynamics and exercises to improve specific areas of your game.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-p-blue/40" />
            <Input
              placeholder="Search exercises..."
              className="pl-10 h-12 bg-white border-p-gray rounded-xl focus-visible:ring-p-green"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {exercises.map((exercise) => {
          const mediaUrl = exercise.media?.url ? normalizeUrl(exercise.media.url) : null

          return (
            <Card
              key={exercise.id}
              className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedExercise(exercise)}
            >
              <div className="relative aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
                {mediaUrl ? (
                  <Image
                    src={mediaUrl}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    width={400}
                    height={225}
                    alt={exercise.title || 'Exercise image'}
                  />
                ) : (
                  <div className="absolute inset-0 bg-indigo-50 flex items-center justify-center">
                    <PlayCircle className="h-12 w-12 text-indigo-200 group-hover:text-indigo-400 transition-colors" />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge className="bg-white/90 text-p-blue border-none backdrop-blur-sm">
                    Image
                  </Badge>
                </div>
              </div>

              <CardContent className="p-5">
                <div className="flex items-center gap-1 text-p-blue/40 text-[10px] font-bold uppercase tracking-widest mb-1">
                  <span>Exercise {exercise.externalId}</span>
                </div>
                <h3 className="text-lg font-bold text-p-blue mb-2 group-hover:text-p-green transition-colors">
                  {exercise.title}
                </h3>
                <p className="text-sm text-p-blue/60 line-clamp-2">
                  {exercise.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {exercises.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-p-gray text-center">
          <Dumbbell className="h-12 w-12 text-p-gray mb-4" />
          <h3 className="text-xl font-bold text-p-blue mb-2">No exercises found</h3>
          <p className="text-p-blue/60">The exercise library is currently empty. Check back soon!</p>
        </div>
      )}

      {/* Exercise Detail Modal */}
      <Dialog open={!!selectedExercise} onOpenChange={(open) => !open && setSelectedExercise(null)}>
        <DialogContent className="w-[80%] overflow-y-auto bg-white border-p-gray/50 p-6">
          {selectedExercise && (
            <>
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl font-bold text-p-blue mb-2">
                  {selectedExercise.title}
                </DialogTitle>
                {selectedExercise.description && (
                  <DialogDescription className="text-p-blue/70 text-base">
                    {selectedExercise.description}
                  </DialogDescription>
                )}
              </DialogHeader>
              {selectedExercise.media?.url && (
                <div className="relative w-full min-h-[60vh] bg-p-gray rounded-xl overflow-hidden flex items-center justify-center">
                  <img
                    src={normalizeUrl(selectedExercise.media.url)}
                    alt={selectedExercise.title || 'Exercise image'}
                    className="object-contain w-full h-full"
                  />
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
