import { Award, FileText } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getModuleByExternalId } from '@/lib/contentful/modules-delivery'
import BackNavigation from '@/components/BackNavigation'
import PageHeader from '@/components/PageHeader'
import { Field } from '@/components/Field'
import AdditionalResources from '@/components/AdditionalResources'
import Exercises from '@/components/Exercises'
import QuizComponent from '@/components/QuizComponent'
import PDFViewerWrapper from '@/components/PDFViewerWrapper'

interface ModulePageProps {
  params: Promise<{
    externalId: string
  }>
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { externalId } = await params

  // Fetch module data from Contentful
  const course = await getModuleByExternalId(externalId)

  if (!course) notFound()

  return (
    <>
      <PageHeader
        title={`${course.title} - ${course.description}`}
        level={course.level}
        duration={course.duration}
        topics={course.topics}
      />

      <div className="space-y-6">
        {/* Presentation */}
        {course.presentation && (
          <Field title="Apresentação" icon={<FileText className="h-5 w-5" />}>
            <div className="px-4">
              <PDFViewerWrapper url={course.presentation.fields.file.url} />
            </div>
          </Field>
        )}

        {/* Additional Resources */}
        <AdditionalResources documents={course.documents} />

        {/* Exercises */}
        <Exercises exercises={course.exercises} />

        {/* Quiz Section */}
        {course.questions && course.questions.length > 0 && (
          <Field title="Knowledge Check" icon={<Award className="h-5 w-5" />}>
            <QuizComponent questions={course.questions} moduleExternalId={externalId} />
          </Field>
        )}
      </div>
    </>
  )
}
