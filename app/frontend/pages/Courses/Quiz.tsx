import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { AppShell } from '../../components/shell'
import type { QuizQuestion } from '../../types/dashboard-data'
import { useTranslation } from '@/i18n/useTranslation'

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
  const passed = score / quiz.length >= 0.75
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
            <span className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-ink-mute">
              {t('courses.quiz.knowledgeCheckLabel')}
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-[46px] font-extrabold tracking-[-0.03em]">
                {Math.round((score / quiz.length) * 100)}%
              </span>
              <span className="text-[15px] text-ink-mute">
                {t('courses.quiz.correctCount', { score, total: quiz.length })}
              </span>
            </div>
            <span className={'text-sm ' + (passed ? 'text-teal' : 'text-[#E2A87A]')}>
              {passed ? t('courses.quiz.passedMessage') : t('courses.quiz.failedMessage')}
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {quiz.map((q, i) => {
              const right = answers[i] === q.correct
              return (
                <div key={q.q} className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-white px-4 py-3.5 shadow-card">
                  <div className="text-sm font-semibold leading-snug text-ink">{q.q}</div>
                  {right ? (
                    <div className="text-[13px] text-teal-deep">✓ {q.options[answers[i]]}</div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="text-[13px] text-danger">
                        ✗ {q.options[answers[i]] ?? t('courses.quiz.notAnswered')}
                      </div>
                      <div className="text-[13px] text-muted">
                        {t('courses.quiz.correctLabel', { answer: q.options[q.correct] })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={reset}
              className="flex-1 rounded-full border border-line bg-white py-3.5 text-[15px] font-semibold text-ink shadow-card transition-transform duration-150 active:scale-[0.98] motion-reduce:active:scale-100"
            >
              {t('courses.quiz.retake')}
            </button>
            <Link
              href="/dashboard/courses"
              className="flex-1 rounded-full bg-ink py-3.5 text-center text-[15px] font-semibold text-paper shadow-card-dark transition-transform duration-150 active:scale-[0.98] motion-reduce:active:scale-100"
            >
              {t('courses.quiz.nextModule')}
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
              <Link href={'/dashboard/courses/' + id} className="text-[13px] text-muted">
                {t('common.back')}
              </Link>
            ) : (
              <button type="button" onClick={() => setIndex(index - 1)} className="text-[13px] text-muted">
                {t('common.back')}
              </button>
            )}
            <span className="font-dash-mono text-[11px] uppercase tracking-[0.1em] text-muted">
              {t('courses.quiz.questionProgress', { current: index + 1, total: quiz.length })}
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-track">
            <div
              className="h-full bg-teal-deep transition-all"
              style={{ width: ((index + 1) / quiz.length) * 100 + '%' }}
            />
          </div>
        </div>

        <h1 className="text-[23px] font-bold leading-tight tracking-[-0.02em] text-ink lg:text-[28px]">{question.q}</h1>

        <div className="flex flex-col gap-2.5">
          {question.options.map((option, i) => {
            const on = picked === i
            return (
              <button
                key={option}
                type="button"
                onClick={() => setAnswers({ ...answers, [index]: i })}
                className={
                  'flex items-start gap-3 rounded-[14px] border px-4 py-4 text-left transition-[transform,box-shadow,border-color,background-color,color] duration-200 motion-reduce:transition-colors ' +
                  (on
                    ? 'border-ink bg-ink text-paper shadow-card-dark'
                    : 'border-line bg-white text-ink shadow-card hover:-translate-y-0.5 hover:border-teal hover:shadow-card-hover motion-reduce:hover:translate-y-0')
                }
              >
                <span className={'pt-0.5 font-dash-mono text-xs ' + (on ? 'text-teal' : 'text-muted')}>{'ABC'[i]}</span>
                <span className="text-[15px] leading-snug">{option}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          disabled={picked === undefined}
          onClick={() => (index === quiz.length - 1 ? setSubmitted(true) : setIndex(index + 1))}
          className={
            'rounded-full py-3.5 text-[15px] font-semibold transition-transform duration-150 active:scale-[0.98] motion-reduce:active:scale-100 ' +
            (picked === undefined ? 'bg-track text-muted-soft' : 'bg-ink text-paper shadow-card-dark')
          }
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
