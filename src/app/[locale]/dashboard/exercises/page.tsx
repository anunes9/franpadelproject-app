import { Button } from '@/components/ui/button'
import BackNavigation from '@/components/BackNavigation'
import PageHeader from '@/components/PageHeader'
import { getAllExercises } from '@/lib/contentful/exercises-delivery'
import ExerciseCardClient from '@/components/ExerciseCardClient'
import { type Locale } from '@/i18n/config'

// Simple icon selection - just cycle through available icon names
const iconNames = ['Target', 'Zap', 'Users', 'Clock']

interface ExercisesPageProps {
  params: Promise<{ locale: Locale }>
}

export default async function ExercisesPage({ params }: ExercisesPageProps) {
  const { locale } = await params
  const contentfulExercises = await getAllExercises(locale)

  // Transform Contentful exercises to match the expected UI format
  const exercises = contentfulExercises.map((exercise, index) => ({
    id: exercise.id,
    title: exercise.title,
    category: 'Técnico', // Default category
    difficulty: 'Beginner', // All exercises are Beginner as requested
    duration: '20 min', // Default duration
    description: exercise.description || 'No description available',
    completed: false, // This would typically come from user progress tracking
    iconName: iconNames[index % iconNames.length], // Pass icon name as string
    externalId: exercise.externalId,
    media: exercise.media,
  }))

  const categories = ['Todos', 'Técnico', 'Táctico']

  const completedExercises = exercises.filter((ex) => ex.completed).length
  const totalExercises = exercises.length
  const progressPercentage = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0

  return (
    <>
      <PageHeader
        title="Biblioteca de Exercícios"
        description="Coleção abrangente de exercícios técnicos e de tácticos"
        badgeText={`${totalExercises} Exercícios`}
        progressPercentage={progressPercentage}
        completedCount={completedExercises}
        totalCount={totalExercises}
        progressLabel={`${completedExercises}/${totalExercises} Exercícios`}
      />

      {/* Category Tabs */}
      <div className="flex gap-4 mb-8 bg-muted p-1 rounded-lg w-fit">
        {categories.map((category) => (
          <Button key={category} variant={category === 'Todos' ? 'default' : 'ghost'} size="sm" className="rounded-md">
            {category}
          </Button>
        ))}
      </div>

      {/* Exercises Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exercises
          .sort((a, b) => a.title.localeCompare(b.title))
          .map((exercise) => (
            <ExerciseCardClient key={exercise.id} exercise={exercise} />
          ))}
      </div>

      {/* Exercise Stats */}
      {/* <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center p-6 bg-card rounded-lg border border-border">
          <div className="text-2xl font-bold text-green-600 mb-1">{completedExercises}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </div>
        <div className="text-center p-6 bg-card rounded-lg border border-border">
          <div className="text-2xl font-bold text-primary mb-1">
            {exercises.filter((ex) => ex.category === 'Technical').length}
          </div>
          <div className="text-sm text-muted-foreground">Technical Drills</div>
        </div>
        <div className="text-center p-6 bg-card rounded-lg border border-border">
          <div className="text-2xl font-bold text-accent mb-1">
            {exercises.filter((ex) => ex.category === 'Tactical').length}
          </div>
          <div className="text-sm text-muted-foreground">Tactical Exercises</div>
        </div>
        <div className="text-center p-6 bg-card rounded-lg border border-border">
          <div className="text-2xl font-bold text-orange-600 mb-1">
            {exercises.filter((ex) => ex.category === 'Fitness').length}
          </div>
          <div className="text-sm text-muted-foreground">Fitness Training</div>
        </div>
      </div> */}
    </>
  )
}
