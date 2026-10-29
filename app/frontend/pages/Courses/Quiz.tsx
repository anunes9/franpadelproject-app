import { Cancel01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link, router, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { AppShell } from '../../components/shell'
import { BackLink, buttonClass, ProgressBar } from '../../components/ui'
import type { QuizQuestion, QuizResult } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  id: string
  questions: QuizQuestion[]
  // Only straight after submitting: the attempt the server just scored.
  result: QuizResult | null
  errors?: { answers?: string }
}

function Quiz() {
  const { id, questions, result, errors } = usePage<Props>().props
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  // Question id => chosen option index.
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  const quizPath = `/dashboard/courses/${id}/quiz`

  if (result) {
    return (
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-[720px] flex-col gap-5">
          <div className="flex flex-col gap-2 rounded-[18px] bg-gradient-to-br from-ink-soft to-ink p-6 text-paper shadow-card-dark">
            <h1 className="font-dash-mono text-label font-normal uppercase text-ink-mute">
              {t('courses.quiz.resultsHeading')}
            </h1>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-extrabold tracking-[-0.03em] tabular-nums">{result.score}%</span>
              <span className="text-base text-ink-mute">
                {t('courses.quiz.correctCount', { score: result.correct, total: result.total })}
              </span>
            </div>
            <span className={`text-sm ${result.passed ? 'text-teal' : 'text-sand'}`}>
              {result.passed ? t('courses.quiz.passedMessage') : t('courses.quiz.failedMessage')}
            </span>
          </div>

          <p className="text-sm text-muted-strong">{t('courses.quiz.resultsHint')}</p>

          <div className="flex flex-col gap-2.5">
            {questions.map((q) => {
              const wrong = result.wrongQuestionIds.includes(q.id)
              return (
                <div
                  key={q.id}
                  className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-white px-4 py-3.5 shadow-card"
                >
                  <div className="text-sm font-semibold leading-snug text-ink">{q.text}</div>
                  <div className={`flex items-start gap-1.5 text-meta ${wrong ? 'text-danger' : 'text-teal-deep'}`}>
                    <HugeiconsIcon
                      icon={wrong ? Cancel01Icon : Tick02Icon}
                      size={16}
                      strokeWidth={2}
                      className="mt-0.5 shrink-0"
                      aria-label={wrong ? t('courses.quiz.wrong') : t('courses.quiz.right')}
                    />
                    {q.options[result.answers[q.id]]}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2.5">
            <Link href={quizPath} className={buttonClass('secondary', 'flex-1')}>
              {t('courses.quiz.retake')}
            </Link>
            <Link href={`/dashboard/courses/${id}`} className={buttonClass('primary', 'flex-1')}>
              {t('courses.quiz.backToModule')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const question = questions[index]
  const picked = answers[question.id]
  const last = index === questions.length - 1

  const next = () => {
    if (!last) return setIndex(index + 1)
    router.post(
      `${quizPath}/attempts`,
      { answers },
      { onStart: () => setSubmitting(true), onFinish: () => setSubmitting(false) }
    )
  }

  return (
    <div className="px-5 py-6 lg:px-10 lg:py-10">
      <div className="mx-auto flex max-w-[720px] flex-col gap-6">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            {index === 0 ? (
              <BackLink href={`/dashboard/courses/${id}`} label={t('common.back')} />
            ) : (
              <BackLink onClick={() => setIndex(index - 1)} label={t('common.back')} />
            )}
            <span className="font-dash-mono text-label uppercase text-muted">
              {t('courses.quiz.questionProgress', { current: index + 1, total: questions.length })}
            </span>
          </div>
          <ProgressBar value={((index + 1) / questions.length) * 100} />
        </div>

        <h1 className="text-balance text-2xl font-bold leading-tight tracking-[-0.02em] text-ink lg:text-title">
          {question.text}
        </h1>

        <div className="flex flex-col gap-2.5">
          {question.options.map((option, i) => {
            const on = picked === i
            return (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: an option is its position (the answer is stored as it, and options never move); two options can share their text
                key={`${question.id}-${i}`}
                type="button"
                onClick={() => setAnswers({ ...answers, [question.id]: i })}
                aria-pressed={on}
                className={
                  'flex items-start gap-3 rounded-[14px] border px-4 py-4 text-left transition-[transform,box-shadow,border-color,background-color,color] duration-200 motion-reduce:transition-colors ' +
                  (on
                    ? 'border-ink bg-ink text-paper shadow-card-dark'
                    : 'border-line bg-white text-ink shadow-card hover:-translate-y-0.5 hover:border-teal hover:shadow-card-hover motion-reduce:hover:translate-y-0')
                }
              >
                <span aria-hidden className={`pt-0.5 font-dash-mono text-xs ${on ? 'text-teal' : 'text-muted'}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-base leading-snug">{option}</span>
              </button>
            )
          })}
        </div>

        {errors?.answers && <p className="text-sm text-danger">{t('courses.quiz.incomplete')}</p>}

        {/* One question at a time, and no moving on without an answer, so
            Submit is only reached with every question answered. */}
        <button
          type="button"
          disabled={picked === undefined || submitting}
          onClick={next}
          className={buttonClass(
            'primary',
            'disabled:bg-track disabled:text-muted disabled:opacity-100 disabled:shadow-none'
          )}
        >
          {picked === undefined
            ? t('courses.quiz.selectAnAnswer')
            : last
              ? t('courses.quiz.submit')
              : t('courses.quiz.continue')}
        </button>
      </div>
    </div>
  )
}

Quiz.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Quiz
