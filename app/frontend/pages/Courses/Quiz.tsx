import { Cancel01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { AppShell } from '../../components/shell'
import { BackLink, buttonClass, ProgressBar } from '../../components/ui'
import type { QuizQuestion } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  id: string
  quiz: QuizQuestion[]
}

function Quiz() {
  const { id, quiz } = usePage<Props>().props
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const score = useMemo(() => quiz.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0), [answers, quiz])
  // A Quiz Pass needs at least 80% (see GLOSSARY.md).
  const passed = score / quiz.length >= 0.8
  const question = quiz[index]
  const picked = answers[index]

  const reset = () => {
    setAnswers({})
    setIndex(0)
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-[720px] flex-col gap-5">
          <div className="flex flex-col gap-2 rounded-[18px] bg-gradient-to-br from-ink-soft to-ink p-6 text-paper shadow-card-dark">
            <h1 className="font-dash-mono text-label font-normal uppercase text-ink-mute">
              {t('courses.quiz.resultsHeading')}
            </h1>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-extrabold tracking-[-0.03em] tabular-nums">
                {Math.round((score / quiz.length) * 100)}%
              </span>
              <span className="text-base text-ink-mute">
                {t('courses.quiz.correctCount', { score, total: quiz.length })}
              </span>
            </div>
            <span className={`text-sm ${passed ? 'text-teal' : 'text-sand'}`}>
              {passed ? t('courses.quiz.passedMessage') : t('courses.quiz.failedMessage')}
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {quiz.map((q, i) => {
              const right = answers[i] === q.correct
              return (
                <div
                  key={q.q}
                  className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-white px-4 py-3.5 shadow-card"
                >
                  <div className="text-sm font-semibold leading-snug text-ink">{q.q}</div>
                  {right ? (
                    <div className="flex items-start gap-1.5 text-meta text-teal-deep">
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        size={16}
                        strokeWidth={2}
                        className="mt-0.5 shrink-0"
                        aria-hidden
                      />
                      {q.options[answers[i]]}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start gap-1.5 text-meta text-danger">
                        <HugeiconsIcon
                          icon={Cancel01Icon}
                          size={16}
                          strokeWidth={2}
                          className="mt-0.5 shrink-0"
                          aria-hidden
                        />
                        {q.options[answers[i]] ?? t('courses.quiz.notAnswered')}
                      </div>
                      <div className="text-meta text-muted">
                        {t('courses.quiz.correctLabel', { answer: q.options[q.correct] })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex gap-2.5">
            <button type="button" onClick={reset} className={buttonClass('secondary', 'flex-1')}>
              {t('courses.quiz.retake')}
            </button>
            <Link href="/dashboard/courses" className={buttonClass('primary', 'flex-1')}>
              {t('courses.quiz.backToCourses')}
            </Link>
          </div>
        </div>
      </div>
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
              {t('courses.quiz.questionProgress', { current: index + 1, total: quiz.length })}
            </span>
          </div>
          <ProgressBar value={((index + 1) / quiz.length) * 100} />
        </div>

        <h1 className="text-balance text-2xl font-bold leading-tight tracking-[-0.02em] text-ink lg:text-title">
          {question.q}
        </h1>

        <div className="flex flex-col gap-2.5">
          {question.options.map((option, i) => {
            const on = picked === i
            return (
              <button
                key={option}
                type="button"
                onClick={() => setAnswers({ ...answers, [index]: i })}
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

        <button
          type="button"
          disabled={picked === undefined}
          onClick={() => (index === quiz.length - 1 ? setSubmitted(true) : setIndex(index + 1))}
          className={buttonClass(
            'primary',
            'disabled:bg-track disabled:text-muted disabled:opacity-100 disabled:shadow-none'
          )}
        >
          {picked === undefined
            ? t('courses.quiz.selectAnAnswer')
            : index === quiz.length - 1
              ? t('courses.quiz.submit')
              : t('courses.quiz.continue')}
        </button>
      </div>
    </div>
  )
}

Quiz.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Quiz
