import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Play, Clock, Target, Zap, Users, Filter } from 'lucide-react'
import Link from 'next/link'
import BackNavigation from '@/components/BackNavigation'
import PageHeader from '@/components/PageHeader'

const exercises = [
  {
    id: 1,
    title: 'Wall Return Practice',
    category: 'Technical',
    difficulty: 'Beginner',
    duration: '15 min',
    equipment: ['Padel racket', 'Ball'],
    description: 'Practice returning balls from the back wall with control and precision',
    completed: true,
    icon: Target,
  },
  {
    id: 2,
    title: 'Forehand Drive Drill',
    category: 'Technical',
    difficulty: 'Beginner',
    duration: '20 min',
    equipment: ['Padel racket', 'Ball', 'Cone markers'],
    description: 'Develop consistent forehand drives with proper technique and timing',
    completed: true,
    icon: Target,
  },
  {
    id: 3,
    title: 'Net Volley Sequence',
    category: 'Technical',
    difficulty: 'Intermediate',
    duration: '25 min',
    equipment: ['Padel racket', 'Ball'],
    description: 'Practice quick volley exchanges at the net with a partner',
    completed: false,
    icon: Zap,
  },
  {
    id: 4,
    title: 'Court Movement Patterns',
    category: 'Fitness',
    difficulty: 'Beginner',
    duration: '30 min',
    equipment: ['Cone markers'],
    description: 'Improve court coverage and movement efficiency',
    completed: true,
    icon: Zap,
  },
  {
    id: 5,
    title: 'Serve and Return Combo',
    category: 'Technical',
    difficulty: 'Intermediate',
    duration: '20 min',
    equipment: ['Padel racket', 'Ball'],
    description: 'Practice serving followed by first return positioning',
    completed: false,
    icon: Target,
  },
  {
    id: 6,
    title: 'Doubles Communication',
    category: 'Tactical',
    difficulty: 'Intermediate',
    duration: '35 min',
    equipment: ['Padel racket', 'Ball'],
    description: 'Work on partner communication and court positioning',
    completed: false,
    icon: Users,
  },
  {
    id: 7,
    title: 'Backhand Slice Control',
    category: 'Technical',
    difficulty: 'Beginner',
    duration: '18 min',
    equipment: ['Padel racket', 'Ball', 'Target zones'],
    description: 'Master the backhand slice for defensive and offensive play',
    completed: true,
    icon: Target,
  },
  {
    id: 8,
    title: 'Reaction Time Training',
    category: 'Fitness',
    difficulty: 'Advanced',
    duration: '25 min',
    equipment: ['Reaction balls', 'Padel racket'],
    description: 'Improve reflexes and reaction time for quick exchanges',
    completed: false,
    icon: Zap,
  },
  {
    id: 9,
    title: 'Lob Defense Practice',
    category: 'Tactical',
    difficulty: 'Intermediate',
    duration: '22 min',
    equipment: ['Padel racket', 'Ball'],
    description: 'Learn to defend against lobs and counter-attack effectively',
    completed: false,
    icon: Target,
  },
  {
    id: 10,
    title: 'Endurance Circuit',
    category: 'Fitness',
    difficulty: 'Advanced',
    duration: '40 min',
    equipment: ['Padel racket', 'Ball', 'Timer'],
    description: 'High-intensity circuit training for match endurance',
    completed: false,
    icon: Zap,
  },
  {
    id: 11,
    title: 'Glass Wall Angles',
    category: 'Technical',
    difficulty: 'Advanced',
    duration: '30 min',
    equipment: ['Padel racket', 'Ball'],
    description: 'Master complex angles using the glass walls effectively',
    completed: false,
    icon: Target,
  },
  {
    id: 12,
    title: 'Match Simulation',
    category: 'Tactical',
    difficulty: 'Advanced',
    duration: '45 min',
    equipment: ['Padel racket', 'Ball', 'Score sheet'],
    description: 'Full match simulation with tactical decision making',
    completed: false,
    icon: Users,
  },
]

const categories = ['All', 'Technical', 'Tactical', 'Fitness']
const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced']

export default function ExercisesPage() {
  const completedExercises = exercises.filter((ex) => ex.completed).length
  const totalExercises = exercises.length
  const progressPercentage = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0

  return (
    <>
      <BackNavigation />

      <PageHeader
        title="Exercise Library"
        description="Comprehensive collection of padel drills and training exercises"
        badgeText={`${totalExercises} Exercises`}
        progressPercentage={progressPercentage}
        completedCount={completedExercises}
        totalCount={totalExercises}
        progressLabel={`${completedExercises}/${totalExercises} Exercises`}
      />

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search exercises..." className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Category
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Difficulty
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-1 mb-8 bg-muted p-1 rounded-lg w-fit">
        {categories.map((category) => (
          <Button key={category} variant={category === 'All' ? 'default' : 'ghost'} size="sm" className="rounded-md">
            {category}
          </Button>
        ))}
      </div>

      {/* Exercises Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exercises.map((exercise) => {
          const IconComponent = exercise.icon
          return (
            <Card
              key={exercise.id}
              className={`hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 ${
                exercise.completed ? 'ring-2 ring-green-200' : ''
              }`}
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
                        ? 'secondary'
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

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Equipment needed:</h4>
                  <div className="flex flex-wrap gap-1">
                    {exercise.equipment.map((item, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button className="w-full" variant={exercise.completed ? 'outline' : 'default'}>
                  <Play className="h-4 w-4 mr-2" />
                  {exercise.completed ? 'Practice Again' : 'Start Exercise'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
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
