"use client"

import { CertificationProps } from "@/lib/types"
import { useForm } from "react-hook-form"

interface QuestionProps {
  number: string
  question: string
  answers: string[]
}

interface QuestionsFormProps {
  questions: QuestionProps[]
  onSubmit: (data: Record<string, string>) => void
  prevCertification: CertificationProps | null
}

export const QuestionsForm = ({
  questions,
  onSubmit,
  prevCertification,
}: QuestionsFormProps) => {
  const {
    setValue,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: prevCertification?.answers })

  return (
    <form
      className="space-y-6 p-8 mt-8 bg-gray-100 rounded-md"
      onSubmit={handleSubmit(onSubmit)}
    >
      {questions.map((question) => (
        <div key={question.number}>
          <h3
            className={`${
              errors[question.number] ? "text-red-500" : ""
            } font-bold mb-2`}
          >
            {question.number}. {question.question}
          </h3>

          <div className="space-y-2">
            {question.answers.map((answer, index) => (
              <button
                key={index}
                className="flex items-start text-left"
                onClick={() => setValue(`${question.number}`, answer)}
              >
                <input
                  type="radio"
                  id={`${question.number}`}
                  value={answer}
                  {...register(`${question.number}`, { required: true })}
                  className="mr-2 mt-1"
                />
                <label htmlFor={answer}>{answer}</label>
              </button>
            ))}
          </div>

          {errors[question.number] && (
            <span className="block text-red-500 text-sm mt-2">
              Resposta necessária
            </span>
          )}
        </div>
      ))}

      <button
        type="submit"
        className="bg-projectGreen text-white px-4 py-2 rounded hover:bg-projectGreen/80"
      >
        Finalizar
      </button>
    </form>
  )
}
