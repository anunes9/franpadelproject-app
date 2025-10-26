// Database utilities for quiz operations

'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { QuizResponse, calculateQuizScore, formatResponsesForStorage } from './quiz-types'

export interface QuizSubmissionData {
  moduleExternalId: string
  responses: Array<{
    questionId: string
    questionText: string
    selectedIndex: number
    selectedText: string
    correctIndex: number
    correctText: string
  }>
  timeSpentSeconds?: number
}

export interface QuizAttemptResult {
  id: string
  scorePercentage: number
  correctAnswers: number
  totalQuestions: number
  isPassed: boolean // 80% or higher
  attemptNumber: number
}

/**
 * Submit a quiz attempt and return the result
 */
export async function submitQuizAttempt(submissionData: QuizSubmissionData): Promise<QuizAttemptResult> {
  const supabase = await createSupabaseServerClient()

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Format responses for storage
  const formattedResponses = formatResponsesForStorage(submissionData.responses)

  // Calculate score
  const { correctAnswers, totalQuestions, scorePercentage } = calculateQuizScore(formattedResponses)

  // Get next attempt number
  const { data: existingAttempts } = await supabase
    .from('quiz_attempts')
    .select('attempt_number')
    .eq('user_id', user.id)
    .eq('module_external_id', submissionData.moduleExternalId)
    .order('attempt_number', { ascending: false })
    .limit(1)

  const nextAttemptNumber = existingAttempts?.[0]?.attempt_number ? existingAttempts[0].attempt_number + 1 : 1

  // Insert quiz attempt
  const { data: quizAttempt, error: insertError } = await supabase
    .from('quiz_attempts')
    .insert({
      user_id: user.id,
      module_external_id: submissionData.moduleExternalId,
      attempt_number: nextAttemptNumber,
      responses: formattedResponses,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      score_percentage: scorePercentage,
      time_spent_seconds: submissionData.timeSpentSeconds,
    })
    .select()
    .single()

  if (insertError) {
    throw new Error(`Failed to submit quiz: ${insertError.message}`)
  }

  return {
    id: quizAttempt.id,
    scorePercentage,
    correctAnswers,
    totalQuestions,
    isPassed: scorePercentage >= 80,
    attemptNumber: nextAttemptNumber,
  }
}

/**
 * Get user's quiz attempts for a specific module
 */
export async function getUserQuizAttempts(moduleExternalId: string) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const { data: attempts, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', user.id)
    .eq('module_external_id', moduleExternalId)
    .order('attempt_number', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch quiz attempts: ${error.message}`)
  }

  return attempts || []
}

/**
 * Get user's progress for a specific module
 */
export async function getUserModuleProgress(moduleExternalId: string) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const { data: progress, error } = await supabase
    .from('module_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('module_external_id', moduleExternalId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    throw new Error(`Failed to fetch module progress: ${error.message}`)
  }

  return progress || null
}

/**
 * Get user's progress for all modules
 */
export async function getAllUserModuleProgress() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const { data: progress, error } = await supabase
    .from('module_progress')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch module progress: ${error.message}`)
  }

  return progress || []
}

/**
 * Get the best quiz attempt for a module
 */
export async function getBestQuizAttempt(moduleExternalId: string) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const { data: attempt, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', user.id)
    .eq('module_external_id', moduleExternalId)
    .order('score_percentage', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    throw new Error(`Failed to fetch best quiz attempt: ${error.message}`)
  }

  return attempt || null
}

/**
 * Get the latest quiz attempt responses for a module (for pre-populating form)
 */
export async function getLatestQuizAttemptResponses(moduleExternalId: string) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const { data: attempt, error } = await supabase
    .from('quiz_attempts')
    .select('responses, attempt_number, score_percentage')
    .eq('user_id', user.id)
    .eq('module_external_id', moduleExternalId)
    .order('attempt_number', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    throw new Error(`Failed to fetch latest quiz attempt: ${error.message}`)
  }

  if (!attempt) {
    return null
  }

  // Convert the stored responses back to the format expected by the form
  const responses: Record<string, number> = {}
  const storedResponses = attempt.responses as Record<string, QuizResponse>

  Object.entries(storedResponses).forEach(([questionId, response]) => {
    responses[questionId] = response.selectedIndex
  })

  return {
    responses,
    attemptNumber: attempt.attempt_number,
    scorePercentage: attempt.score_percentage,
  }
}
