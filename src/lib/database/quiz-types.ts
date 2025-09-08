// Quiz-related TypeScript interfaces for JSONB responses

export interface QuizResponse {
  questionId: string
  questionText: string
  selectedIndex: number
  selectedText: string
  correctIndex: number
  correctText: string
  isCorrect: boolean
}

export interface QuizAttemptData {
  responses: Record<string, QuizResponse> // Key is questionId
  totalQuestions: number
  correctAnswers: number
  scorePercentage: number
  timeSpentSeconds?: number
}

export interface ModuleProgressData {
  moduleExternalId: string
  status: 'not_started' | 'in_progress' | 'completed'
  bestScore: number | null
  totalAttempts: number
  firstAttemptAt: string | null
  lastAttemptAt: string | null
  completedAt: string | null
}

// Helper function to calculate quiz score
export function calculateQuizScore(responses: Record<string, QuizResponse>): {
  correctAnswers: number
  totalQuestions: number
  scorePercentage: number
} {
  const responseValues = Object.values(responses)
  const correctAnswers = responseValues.filter((r) => r.isCorrect).length
  const totalQuestions = responseValues.length
  const scorePercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0

  return {
    correctAnswers,
    totalQuestions,
    scorePercentage: Math.round(scorePercentage * 100) / 100, // Round to 2 decimal places
  }
}

// Helper function to format responses for database storage
export function formatResponsesForStorage(
  questionResponses: Array<{
    questionId: string
    questionText: string
    selectedIndex: number
    selectedText: string
    correctIndex: number
    correctText: string
  }>
): Record<string, QuizResponse> {
  const responses: Record<string, QuizResponse> = {}

  questionResponses.forEach((response) => {
    responses[response.questionId] = {
      questionId: response.questionId,
      questionText: response.questionText,
      selectedIndex: response.selectedIndex,
      selectedText: response.selectedText,
      correctIndex: response.correctIndex,
      correctText: response.correctText,
      isCorrect: response.selectedIndex === response.correctIndex,
    }
  })

  return responses
}
