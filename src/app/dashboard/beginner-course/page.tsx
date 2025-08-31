import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Play, CheckCircle, Lock, Clock } from 'lucide-react'
import Link from 'next/link'
import { getBeginnerModules } from '@/lib/contentful/modules'

export default async function BeginnerCoursePage() {
  // Fetch modules from Contentful
  const modules = await getBeginnerModules()

  // For now, we'll use mock status data since we don't have user progress tracking yet
  const getModuleStatus = (index: number) => {
    if (index === 0) return 'completed'
    if (index === 1) return 'in-progress'
    return 'locked'
  }

  const completedModules = modules.filter((_, index) => getModuleStatus(index) === 'completed').length
  const totalModules = modules.length
  const progressPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Course Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Beginner Course</h1>
              <p className="text-muted-foreground text-lg mb-4">
                Master the fundamentals of padel with our comprehensive {totalModules}-module course
              </p>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary">
                  {completedModules}/{totalModules} Modules
                </Badge>
                <Badge variant="outline">{Math.round(progressPercentage)}% Complete</Badge>
              </div>
            </div>
            <div className="mt-6 md:mt-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">{Math.round(progressPercentage)}%</div>
                <div className="text-sm text-muted-foreground">Progress</div>
                <div className="w-24 bg-muted rounded-full h-2 mt-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {modules.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">No beginner modules found in Contentful</div>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => {
              const status = getModuleStatus(index)
              return (
                <Card
                  key={module.id}
                  className={`hover:shadow-lg transition-all duration-200 ${
                    status === 'locked' ? 'opacity-60' : 'cursor-pointer hover:scale-105'
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-lg ${
                            status === 'completed'
                              ? 'bg-green-100 text-green-600'
                              : status === 'in-progress'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {status === 'completed' ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : status === 'in-progress' ? (
                            <Play className="h-5 w-5" />
                          ) : (
                            <Lock className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">Module {module.externalId}</CardTitle>
                          <CardDescription className="text-sm">{module.title}</CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant={
                          status === 'completed' ? 'default' : status === 'in-progress' ? 'secondary' : 'outline'
                        }
                      >
                        {status === 'completed' ? 'Complete' : status === 'in-progress' ? 'In Progress' : 'Locked'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{module.description}</p>

                    <div className="flex items-center space-x-2 mb-4">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{module.duration}</span>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-foreground mb-2">Topics covered:</h4>
                      <div className="flex flex-wrap gap-1">
                        {module.topics.map((topic, topicIndex) => (
                          <Badge key={topicIndex} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      disabled={status === 'locked'}
                      variant={status === 'completed' ? 'outline' : 'default'}
                      asChild={status !== 'locked'}
                    >
                      {status !== 'locked' ? (
                        <Link href={`/dashboard/beginner-course/${module.externalId}`}>
                          {status === 'completed'
                            ? 'Review Module'
                            : status === 'in-progress'
                            ? 'Continue Module'
                            : 'Start Module'}
                        </Link>
                      ) : (
                        'Locked'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Course Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-6 bg-card rounded-lg border border-border">
            <div className="text-2xl font-bold text-green-600 mb-1">{completedModules}</div>
            <div className="text-sm text-muted-foreground">Completed Modules</div>
          </div>
          <div className="text-center p-6 bg-card rounded-lg border border-border">
            <div className="text-2xl font-bold text-primary mb-1">
              {modules.filter((_, index) => getModuleStatus(index) === 'in-progress').length}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </div>
          <div className="text-center p-6 bg-card rounded-lg border border-border">
            <div className="text-2xl font-bold text-muted-foreground mb-1">
              {modules.filter((_, index) => getModuleStatus(index) === 'locked').length}
            </div>
            <div className="text-sm text-muted-foreground">Remaining</div>
          </div>
          <div className="text-center p-6 bg-card rounded-lg border border-border">
            <div className="text-2xl font-bold text-accent mb-1">
              {modules.reduce((total, module) => {
                const duration = parseInt(module.duration) || 0
                return total + duration
              }, 0)}
              min
            </div>
            <div className="text-sm text-muted-foreground">Total Duration</div>
          </div>
        </div>
      </main>
    </div>
  )
}
