import { notFound } from 'next/navigation'
import { getModuleByExternalId } from '@/lib/contentful/modules-delivery'
import { DashboardHeader } from '@/components/DashboardHeader'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, BookOpen, Target } from 'lucide-react'

interface ModulePageProps {
  params: {
    externalId: string
  }
}

export default async function ModulePage({ params }: ModulePageProps) {
  const module = await getModuleByExternalId(params.externalId)

  if (!module) {
    notFound()
  }

  return (
    <>
      <DashboardHeader />

      <div className="max-w-4xl mx-auto">
        {/* Module Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <BookOpen className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{module.title}</h1>
              <p className="text-muted-foreground text-lg">{module.description}</p>
            </div>
          </div>

          {/* Module Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duração</p>
                    <p className="font-semibold">{module.duration}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nível</p>
                    <p className="font-semibold">{module.level}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tópicos</p>
                    <p className="font-semibold">{module.topics?.length || 0} tópicos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Topics */}
          {module.topics && module.topics.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Tópicos Abordados</CardTitle>
                <CardDescription>
                  Os principais conceitos e técnicas que serão desenvolvidos neste mesociclo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {module.topics.map((topic, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Module Content */}
        {module.content && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Conteúdo do Mesociclo</CardTitle>
              <CardDescription>Desenvolve as técnicas e conceitos fundamentais deste nível</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-lg max-w-none">
                <MarkdownRenderer content={module.content} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Presentation Content */}
        {module.presentation && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-xl">Apresentação</CardTitle>
              <CardDescription>Material de apoio e apresentações do mesociclo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-lg max-w-none">
                <MarkdownRenderer content={module?.presentation?.fields?.file?.url} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Module Metadata */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p>
                <strong>ID do Módulo:</strong> {module.externalId}
              </p>
              <p>
                <strong>Criado em:</strong> {new Date(module.createdAt).toLocaleDateString('pt-PT')}
              </p>
            </div>
            <div>
              <p>
                <strong>Última atualização:</strong> {new Date(module.updatedAt).toLocaleDateString('pt-PT')}
              </p>
              <p>
                <strong>Status:</strong> {module.isPublished ? 'Publicado' : 'Rascunho'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
