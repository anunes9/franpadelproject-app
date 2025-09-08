'use server'

import { submitQuizAttempt, QuizSubmissionData } from '@/lib/database/quiz-utils'
import { revalidatePath } from 'next/cache'

export async function submitQuiz(formData: FormData) {
  try {
    const moduleExternalId = formData.get('moduleExternalId') as string
    const responsesJson = formData.get('responses') as string
    const timeSpentSeconds = formData.get('timeSpentSeconds') as string

    if (!moduleExternalId || !responsesJson) {
      return {
        success: false,
        error: 'Missing required data',
      }
    }

    const responses = JSON.parse(responsesJson)

    const submissionData: QuizSubmissionData = {
      moduleExternalId,
      responses,
      timeSpentSeconds: timeSpentSeconds ? parseInt(timeSpentSeconds) : undefined,
    }

    const result = await submitQuizAttempt(submissionData)

    // Revalidate the module page to show updated progress
    revalidatePath(`/dashboard/beginner/${moduleExternalId}`)
    revalidatePath('/dashboard/beginner')

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error('Quiz submission error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
