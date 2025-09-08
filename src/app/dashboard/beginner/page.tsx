import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, CheckCircle, Lock, Clock } from 'lucide-react'
import Link from 'next/link'
import { getBeginnerModules } from '@/lib/contentful/modules-delivery'
import { getAllUserModuleProgress } from '@/lib/database/quiz-utils'
import BackNavigation from '@/components/BackNavigation'
import PageHeader from '@/components/PageHeader'

export default async function BeginnerCoursePage() {
  const modules = await getBeginnerModules()

  // Get user's progress for all modules
  let userProgress: any[] = []
  try {
    userProgress = await getAllUserModuleProgress()
  } catch (error) {
    console.error('Failed to load user progress:', error)
  }

  const getModuleStatus = (moduleExternalId: string, index: number) => {
    const progress = userProgress.find((p) => p.module_external_id === moduleExternalId)

    if (progress?.status === 'completed') return 'completed'
    if (progress?.status === 'in_progress') return 'in-progress'

    // Check if previous module is completed to unlock next one
    if (index > 0) {
      const previousModule = modules[index - 1]
      const previousProgress = userProgress.find((p) => p.module_external_id === previousModule.externalId)
      if (previousProgress?.status !== 'completed') return 'locked'
    }

    return 'not_started'
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completo'
      case 'in-progress':
        return 'Continuar'
      case 'locked':
        return 'Bloqueado'
      default:
        return 'Iniciar'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5" />
      case 'in-progress':
        return <Play className="h-5 w-5" />
      case 'locked':
        return <Lock className="h-5 w-5" />
      default:
        return <Play className="h-5 w-5" />
    }
  }

  const completedModules = modules.filter(
    (module, index) => getModuleStatus(module.externalId, index) === 'completed'
  ).length
  const totalModules = modules.length
  const progressPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0

  return (
    <>
      <BackNavigation text="Voltar ao Dashboard" />

      <PageHeader
        title="Metodologia - Iniciado"
        description={`Aprende os fundamentos do padel com nosso curso Iniciado em ${totalModules} Mesociclos`}
        badgeText={`${totalModules} Mesociclos`}
        progressPercentage={progressPercentage}
        completedCount={completedModules}
        totalCount={totalModules}
        progressLabel={`${completedModules}/${totalModules} Mesociclos`}
      />

      {/* Modules Grid */}
      <div>
        {modules.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-muted-foreground mb-4">Nenhum módulo encontrado</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => {
              const status = getModuleStatus(module.externalId, index)
              const statusText = getStatusText(status)
              const link = status === 'locked' ? '#' : `/dashboard/beginner/${module.externalId}`
              const progress = userProgress.find((p) => p.module_external_id === module.externalId)
              return (
                <Link href={link} prefetch={false} key={module.id}>
                  <Card
                    className={`hover:shadow-lg transition-all duration-200 ${
                      status === 'locked' ? 'opacity-60' : 'cursor-pointer hover:scale-105 h-full'
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
                            {getStatusIcon(status)}
                          </div>

                          <div>
                            <CardTitle className="text-lg">{module.description}</CardTitle>
                            <CardDescription className="text-sm">{module.title}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-between gap-4 h-full">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{module.duration}</span>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Tópicos</h4>
                        <div className="flex flex-wrap gap-1">
                          {module.topics.map((topic, topicIndex) => (
                            <Badge key={topicIndex} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Progress indicator */}
                      {progress && (
                        <div>
                          <div>
                            <h4 className="text-sm font-medium text-foreground mb-2">Quiz</h4>

                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full bg-primary`}
                                  style={{ width: `${progress.best_score.toFixed(1)}%` }}
                                />
                              </div>

                              <span className="text-sm text-muted-foreground">
                                {progress.best_score ? `${progress.best_score.toFixed(1)}%` : 'N/A'}
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                              <span>
                                {progress.total_attempts} tentativa{progress.total_attempts !== 1 ? 's' : ''}
                              </span>

                              {progress.completed_at && (
                                <span>Completo em {new Date(progress.completed_at).toLocaleDateString('pt-PT')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        className="w-full mt-4"
                        disabled={status === 'locked'}
                        variant={status === 'completed' ? 'outline' : 'default'}
                      >
                        {statusText}
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
