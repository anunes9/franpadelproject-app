'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { submitQuiz } from '@/app/[locale]/dashboard/beginner/actions'
import { getUserQuizAttempts, getUserModuleProgress, getLatestQuizAttemptResponses } from '@/lib/database/quiz-utils'

interface Question {
  id: string
  externalId: string
  question: string
  answers: string[]
  correctOption: string
}

interface QuizComponentProps {
  questions: Question[]
  moduleExternalId: string
}

interface QuizState {
  responses: Record<string, number>
  isSubmitting: boolean
  submitted: boolean
  result: {
    scorePercentage: number
    correctAnswers: number
    totalQuestions: number
    isPassed: boolean
    attemptNumber: number
  } | null
  previousAttempts: any[]
  moduleProgress: any
  loadedFromPreviousAttempt: boolean
}

export default function QuizComponent({ questions, moduleExternalId }: QuizComponentProps) {
  const t = useTranslations('quiz')
  const [quizState, setQuizState] = useState<QuizState>({
    responses: {},
    isSubmitting: false,
    submitted: false,
    result: null,
    previousAttempts: [],
    moduleProgress: null,
    loadedFromPreviousAttempt: false,
  })

  const [startTime, setStartTime] = useState<number | null>(null)

  // Load previous attempts and progress on component mount
  useEffect(() => {
    loadQuizData()
    setStartTime(Date.now())
  }, [])

  const loadQuizData = async () => {
    try {
      const [attempts, progress, latestResponses] = await Promise.all([
        getUserQuizAttempts(moduleExternalId),
        getUserModuleProgress(moduleExternalId),
        getLatestQuizAttemptResponses(moduleExternalId),
      ])

      setQuizState((prev) => ({
        ...prev,
        previousAttempts: attempts,
        moduleProgress: progress,
        // Pre-populate responses if available and quiz hasn't been submitted yet
        responses: prev.submitted ? prev.responses : latestResponses?.responses || {},
        loadedFromPreviousAttempt: !prev.submitted && !!latestResponses?.responses,
      }))
    } catch (error) {
      console.error(t('failedToLoadQuizData'), error)
    }
  }

  const handleAnswerChange = (questionId: string, answerIndex: number) => {
    setQuizState((prev) => ({
      ...prev,
      responses: {
        ...prev.responses,
        [questionId]: answerIndex,
      },
    }))
  }

  const handleSubmit = async () => {
    if (Object.keys(quizState.responses).length !== questions.length) {
      alert(t('pleaseAnswerAll'))
      return
    }

    setQuizState((prev) => ({ ...prev, isSubmitting: true }))

    try {
      const timeSpentSeconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : undefined

      // Prepare responses data
      const responsesData = questions.map((question) => {
        const selectedIndex = quizState.responses[question.id]
        const selectedText = question.answers[selectedIndex]
        const correctIndex = question.answers.findIndex((answer) => answer === question.correctOption)
        const correctText = question.correctOption

        return {
          questionId: question.id,
          questionText: question.question,
          selectedIndex,
          selectedText,
          correctIndex,
          correctText,
        }
      })

      const formData = new FormData()
      formData.append('moduleExternalId', moduleExternalId)
      formData.append('responses', JSON.stringify(responsesData))
      if (timeSpentSeconds) {
        formData.append('timeSpentSeconds', timeSpentSeconds.toString())
      }

      const result = await submitQuiz(formData)

      if (result.success && result.data) {
        setQuizState((prev) => ({
          ...prev,
          submitted: true,
          result: result.data,
          isSubmitting: false,
        }))

        // Reload quiz data to get updated attempts and progress
        await loadQuizData()
      } else {
        throw new Error(result.error || t('quizSubmissionError'))
      }
    } catch (error) {
      console.error('Quiz submission error:', error)
      alert(t('quizSubmissionError'))
      setQuizState((prev) => ({ ...prev, isSubmitting: false }))
    }
  }

  const resetQuiz = () => {
    setQuizState({
      responses: {},
      isSubmitting: false,
      submitted: false,
      result: null,
      previousAttempts: quizState.previousAttempts,
      moduleProgress: quizState.moduleProgress,
      loadedFromPreviousAttempt: false,
    })
    setStartTime(Date.now())
  }

  // Show results if quiz has been submitted
  if (quizState.submitted && quizState.result) {
    return (
      <div className="space-y-6">
        <div className="text-center p-6 bg-card rounded-lg border border-border">
          <div className="flex justify-center mb-4">
            {quizState.result.isPassed ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>

          <h3 className="text-2xl font-bold mb-2">
            {quizState.result.isPassed ? t('congratulations') : t('keepTrying')}
          </h3>

          <p className="text-muted-foreground mb-4">{quizState.result.isPassed ? t('quizPassed') : t('quizFailed')}</p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{quizState.result.scorePercentage.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">{t('score')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {quizState.result.correctAnswers}/{quizState.result.totalQuestions}
              </div>
              <div className="text-sm text-muted-foreground">{t('correct')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">#{quizState.result.attemptNumber}</div>
              <div className="text-sm text-muted-foreground">{t('attempt')}</div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={resetQuiz} variant="outline">
              {t('tryAgain')}
            </Button>
            {quizState.result.isPassed && (
              <Button onClick={() => (window.location.href = '/dashboard/beginner')}>{t('backToCourse')}</Button>
            )}
          </div>
        </div>

        {/* Previous Attempts */}
        {quizState.previousAttempts.length > 1 && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-3">{t('previousAttempts')}</h4>
            <div className="space-y-2">
              {quizState.previousAttempts
                .filter((attempt) => attempt.attempt_number !== quizState.result?.attemptNumber)
                .map((attempt, index) => (
                  <div key={attempt.id} className="flex justify-between items-center text-sm">
                    <span>{t('attemptNumber', { number: attempt.attempt_number })}</span>
                    <span className="font-medium">{attempt.score_percentage.toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Show quiz form
  return (
    <div className="space-y-4">
      {/* Show indicator if responses were loaded from previous attempt */}
      {quizState.loadedFromPreviousAttempt && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{t('answersLoaded')}:</strong> {t('answersLoadedDescription')}
          </p>
        </div>
      )}

      {questions.map((question, index) => (
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
                  checked={quizState.responses[question.id] === optionIndex}
                  onChange={() => handleAnswerChange(question.id, optionIndex)}
                  className="text-primary"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-6">
        <Button
          className="w-full"
          onClick={handleSubmit}
          // disabled={quizState.isSubmitting || Object.keys(quizState.responses).length !== questions.length}
          disabled={quizState.isSubmitting}
        >
          {quizState.isSubmitting ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              {t('submitting')}
            </>
          ) : (
            t('submitAnswers')
          )}
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="text-center text-sm text-muted-foreground">
        {t('questionsAnswered', {
          answered: Object.keys(quizState.responses).length,
          total: questions.length,
        })}
      </div>
    </div>
  )
}
