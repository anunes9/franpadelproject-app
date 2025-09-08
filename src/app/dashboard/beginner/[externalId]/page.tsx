import { Award, FileText } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getModuleByExternalId } from '@/lib/contentful/modules-delivery'
import BackNavigation from '@/components/BackNavigation'
import PageHeader from '@/components/PageHeader'
import { Field } from '@/components/Field'
import AdditionalResources from '@/components/AdditionalResources'
import Exercises from '@/components/Exercises'
import { Button } from '@/components/ui/button'
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
      <BackNavigation href="/dashboard/beginner" text="Voltar ao Curso" />

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
        <Field title="Knowledge Check" icon={<Award className="h-5 w-5" />}>
          <div className="space-y-4">
            {course.questions?.map((question, index) => (
              <div key={question.id} className="p-4 border border-border rounded-lg">
                <h4 className="font-medium mb-3">
                  {index + 1}. {question.question}
                </h4>
                <div className="space-y-2">
                  {question.answers.map((option, optionIndex) => (
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
            <Button className="w-full">Submeter Respostas</Button>
          </div>
        </Field>
      </div>
    </>
  )
}
