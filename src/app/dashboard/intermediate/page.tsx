import { getIntermediateModules } from '@/lib/contentful/modules-delivery'
import BackNavigation from '@/components/BackNavigation'
import { CourseHeader } from '@/components/courses/CourseHeader'
import { CourseCard } from '@/components/courses/CourseCard'

export default async function IntermediateCoursePage() {
  const modules = await getIntermediateModules()

  // Mock user progress - in a real app, this would come from the database
  const userProgress = [
    // Add user progress data here when available
  ]

  const getModuleStatus = (externalId: string, index: number) => {
    // For now, all modules are unlocked
    // In a real app, this would check user progress and prerequisites
    return 'available'
  }

  return (
    <>
      {/* Course Header */}
      <CourseHeader modules={modules} level="Intermediate" />

      {/* Modules Grid */}
      <div>
        {modules.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-muted-foreground mb-4">Nenhum módulo intermédio encontrado</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => {
              const status = getModuleStatus(module.externalId, index)

              return <CourseCard key={module.id} status={status} module={module} />
            })}
          </div>
        )}
      </div>
    </>
  )
}
