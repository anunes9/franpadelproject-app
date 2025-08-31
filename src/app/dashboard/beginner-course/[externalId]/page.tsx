import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Play, Clock, BookOpen, Award } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getModuleByExternalId } from '@/lib/contentful/modules'

interface ModulePageProps {
  params: {
    externalId: string
  }
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { externalId } = params

  // Fetch module data from Contentful
  const module = await getModuleByExternalId(externalId)

  if (!module) {
    notFound()
  }

  // Mock quiz questions for now - this could also come from Contentful
  const quizQuestions = [
    {
      id: 1,
      question: 'What are the dimensions of a standard padel court?',
      options: ['20m x 10m', '18m x 9m', '23m x 11m', '21m x 10.5m'],
      correct: 0,
    },
    {
      id: 2,
      question: 'How high are the back walls in a padel court?',
      options: ['2-3 meters', '3-4 meters', '4-5 meters', '5-6 meters'],
      correct: 1,
    },
    {
      id: 3,
      question: 'What type of serve is required in padel?',
      options: ['Overhand', 'Underhand', 'Side-arm', 'Any style'],
      correct: 1,
    },
    {
      id: 4,
      question: 'Can you use the walls during play in padel?',
      options: ['No, never', 'Only defensive shots', 'Yes, strategically', 'Only on serves'],
      correct: 2,
    },
    {
      id: 5,
      question: 'What is the maximum number of players on a padel court?',
      options: ['2 players', '3 players', '4 players', '6 players'],
      correct: 2,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              href="/dashboard/beginner-course"
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Course</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Module Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <Badge variant="secondary" className="mb-2">
                Module {module.externalId}
              </Badge>
              <h1 className="text-3xl font-bold text-foreground mb-2">{module.title}</h1>
              <p className="text-muted-foreground text-lg mb-4">{module.description}</p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{module.duration}</span>
                </div>
                <Badge variant="outline">{module.level}</Badge>
              </div>
            </div>
            <div className="mt-6 md:mt-0">
              <Button size="lg" className="flex items-center space-x-2">
                <Play className="h-4 w-4" />
                <span>Start Module</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Module Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Module Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {module.content?.overview ||
                    'This module will help you master the fundamentals of padel. Follow along with the video lessons and practice the exercises to improve your skills.'}
                </p>
              </CardContent>
            </Card>

            {/* Topics Covered */}
            <Card>
              <CardHeader>
                <CardTitle>Topics Covered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {module.topics.map((topic, index) => (
                    <Badge key={index} variant="outline">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Video Section */}
            <Card>
              <CardHeader>
                <CardTitle>Video Lesson</CardTitle>
                <CardDescription>Watch the instructional video for this module</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Play className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Video content will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quiz Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>Knowledge Check</span>
                </CardTitle>
                <CardDescription>Test your understanding with these questions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quizQuestions.map((question, index) => (
                    <div key={question.id} className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-3">
                        {index + 1}. {question.question}
                      </h4>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <label key={optionIndex} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={optionIndex}
                              className="text-primary"
                            />
                            <span className="text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Button className="w-full">Submit Quiz</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">0%</div>
                  <div className="text-sm text-muted-foreground mb-2">Complete</div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Module Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>Course Modules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link
                    href="/dashboard/beginner-course"
                    className="block p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <div className="font-medium">Back to Course Overview</div>
                    <div className="text-sm text-muted-foreground">View all modules</div>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Resources */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Play className="h-4 w-4 mr-2" />
                    Practice Exercises
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
