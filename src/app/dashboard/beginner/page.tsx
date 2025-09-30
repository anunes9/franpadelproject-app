import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'
import Link from 'next/link'
import { getBeginnerModules } from '@/lib/contentful/modules-delivery'
import { getAllUserModuleProgress } from '@/lib/database/quiz-utils'
import BackNavigation from '@/components/BackNavigation'
import PageHeader from '@/components/PageHeader'
import { getStatusIcon, getStatusText } from '@/utils/modules'
import { CourseHeader } from '@/components/courses/CourseHeader'
import { CourseCard } from '@/components/courses/CourseCard'

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
    else if (progress?.status === 'in_progress') return 'in-progress'

    return 'available'
  }

  const completedModules = modules.filter(
    (module, index) => getModuleStatus(module.externalId, index) === 'completed'
  ).length
  const totalModules = modules.length
  const progressPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0

  return (
    <>
      <CourseHeader modules={modules} level="Beginner" />

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
              // const progress = userProgress.find((p) => p.module_external_id === module.externalId)
              return <CourseCard key={module.id} status={status} module={module} />
            })}
          </div>
        )}
      </div>
    </>
  )
}
