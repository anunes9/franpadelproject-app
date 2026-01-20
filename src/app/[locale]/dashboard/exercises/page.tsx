import { getAllExercises } from '@/lib/contentful/exercises-delivery'
import { getLocale } from 'next-intl/server'
import { Dumbbell, Filter, Search, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function ExercisesPage() {
  const locale = await getLocale()
  const exercises = await getAllExercises(locale as any)

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
          <Button variant="outline" className="border-p-gray text-p-blue gap-2 rounded-xl h-12 px-6">
            <Filter className="h-4 w-4" />
            Category
          </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {exercises.map((exercise) => (
          <Card key={exercise.id} className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
            <div className="relative aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
              {exercise.media?.url ? (
                <video 
                  src={exercise.media.url} 
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              ) : (
                <div className="absolute inset-0 bg-indigo-50 flex items-center justify-center">
                  <PlayCircle className="h-12 w-12 text-indigo-200 group-hover:text-indigo-400 transition-colors" />
                </div>
              )}
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge className="bg-white/90 text-p-blue border-none backdrop-blur-sm">
                  Video
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
            
            <CardFooter className="p-5 pt-0">
              <Button variant="ghost" className="w-full bg-p-gray text-p-blue hover:bg-p-blue hover:text-white rounded-xl font-bold py-6 transition-all">
                View Detail
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {exercises.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-p-gray text-center">
          <Dumbbell className="h-12 w-12 text-p-gray mb-4" />
          <h3 className="text-xl font-bold text-p-blue mb-2">No exercises found</h3>
          <p className="text-p-blue/60">The exercise library is currently empty. Check back soon!</p>
        </div>
      )}
    </div>
  )
}
