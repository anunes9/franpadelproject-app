import { getIntermediateModules } from '@/lib/contentful/modules-delivery'
import { CourseHeader } from '@/components/courses/CourseHeader'
import { CourseCard } from '@/components/courses/CourseCard'

export default async function IntermediateCoursePage() {
  const modules = await getIntermediateModules()

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
            {modules.map((module) => (
              <CourseCard key={module.id} status={'available'} module={module} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
