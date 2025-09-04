import { BookOpen } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getModuleByExternalId } from '@/lib/contentful/modules-delivery'
import BackNavigation from '@/components/BackNavigation'
import PageHeader from '@/components/PageHeader'
import { Field } from '@/components/Field'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import AdditionalResources from '@/components/AdditionalResources'
import Exercises from '@/components/Exercises'

interface ModulePageProps {
  params: Promise<{
    externalId: string
  }>
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { externalId } = await params

  // Fetch module data from Contentful
  const module = await getModuleByExternalId(externalId)

  if (!module) {
    notFound()
  }

  // TODO: Mock quiz questions for now - this could also come from Contentful
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
    <>
      <BackNavigation href="/dashboard/beginner" text="Voltar ao Curso" />

      <PageHeader
        title={`${module.title} - ${module.description}`}
        level={module.level}
        duration={module.duration}
        topics={module.topics}
      />

      <div className="space-y-6">
        {/* Module Content */}
        <Field title="Conteúdo Teórico" icon={<BookOpen className="h-5 w-5" />}>
          {module.content ? (
            <MarkdownRenderer content={module.content} className="px-4" />
          ) : (
            <p className="text-muted-foreground leading-relaxed">Em desenvolvimento</p>
          )}
        </Field>

        {/* Additional Resources */}
        <AdditionalResources documents={module.documents} />

        {/* Exercises */}
        <Exercises exercises={module.exercises} />

        <div className="h-8" />

        {/* Quiz Section */}
        {/* <Field title="Knowledge Check" icon={<Award className="h-5 w-5" />}>
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
        </Field> */}
      </div>
    </>
  )
}
