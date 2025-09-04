import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, CheckCircle, Lock, Clock } from 'lucide-react'
import Link from 'next/link'
import { getBeginnerModules } from '@/lib/contentful/modules-delivery'
import BackNavigation from '@/components/BackNavigation'
import PageHeader from '@/components/PageHeader'

export default async function BeginnerCoursePage() {
  const modules = await getBeginnerModules()

  const getModuleStatus = (index: number) => {
    return ''
    // if (index === 0) return 'completed'
    // if (index === 1) return 'in-progress'
    // return 'locked'
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completo'
      case 'in-progress':
        return 'Em progresso'
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

  const completedModules = modules.filter((_, index) => getModuleStatus(index) === 'completed').length
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
              const status = getModuleStatus(index)
              const statusText = getStatusText(status)
              const link = status === 'locked' ? '#' : `/dashboard/beginner/${module.externalId}`
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

                        {/* <Badge
                          variant={
                            status === 'completed' ? 'default' : status === 'in-progress' ? 'secondary' : 'outline'
                          }
                        >
                          {statusText}
                        </Badge> */}
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center space-x-2 mb-4">
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
                      </div>

                      <Button
                        className="w-full mt-8"
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

        {/* Course Stats */}
        {/* <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
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
        </div> */}
      </div>
    </>
  )
}
