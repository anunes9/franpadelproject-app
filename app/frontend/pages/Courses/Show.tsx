import { ArrowRight01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link, router, usePage } from '@inertiajs/react'
import { type ReactNode, useState } from 'react'
import type { TranslationKey } from '@/i18n/translations'
import { useTranslation } from '@/i18n/useTranslation'
import { AppShell } from '../../components/shell'
import { BackLink, buttonClass, DocumentViewerModal, Eyebrow } from '../../components/ui'
import type { ContentSection, CourseDocument, Module } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  courseModule: Module
  sections: ContentSection[]
  exerciseStats: { count: number; completed: number }
  documents: CourseDocument[]
  quizQuestionCount: number
}

function documentKind(contentType: string, t: (key: TranslationKey) => string) {
  if (contentType === 'application/pdf') return t('courses.show.documentKind.pdf')
  if (contentType.startsWith('image/')) return t('courses.show.documentKind.image')
  if (contentType.startsWith('video/')) return t('courses.show.documentKind.video')
  return contentType.split('/')[1]?.toUpperCase() ?? t('courses.show.documentKind.file')
}

function Show() {
  const { courseModule, sections, exerciseStats, documents, quizQuestionCount } = usePage<Props>().props
  const { t, tn } = useTranslation()
  const [completing, setCompleting] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<CourseDocument | null>(null)

  function handleComplete() {
    setCompleting(true)
    router.patch(
      `/dashboard/courses/${courseModule.id}/complete`,
      {},
      { preserveScroll: true, onFinish: () => setCompleting(false) }
    )
  }

  return (
    <div>
      <div className="bg-ink px-5 pb-6 pt-6 text-paper lg:px-10 lg:pb-10 lg:pt-9">
        <div className="mx-auto flex max-w-220 flex-col gap-3.5">
          <BackLink href="/dashboard/courses" label={t('courses.show.backLink')} tone="dark" />
          <div>
            <div className="font-dash-mono text-label uppercase text-teal">{courseModule.title}</div>
            <h1 className="mt-1.5 max-w-[32ch] text-balance text-title font-bold lg:text-title-lg">
              {courseModule.description}
            </h1>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {courseModule.topics.map((topic) => (
              <span key={topic} className="rounded-md bg-paper/10 px-2 py-1 text-xs">
                {topic}
              </span>
            ))}
          </div>
          <div className="flex gap-5 text-xs text-ink-mute">
            <span>{courseModule.duration}</span>
            {documents.length > 0 && <span>{tn('courses.show.documentsCount', documents.length)}</span>}
            <span>{tn('courses.show.exercisesCount', exerciseStats.count)}</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-[880px] flex-col gap-6">
          {documents.length > 0 && (
            <div className="flex flex-col gap-2">
              <Eyebrow>{t('courses.show.materialsEyebrow')}</Eyebrow>
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setViewingDocument(doc)}
                  className="flex items-center gap-3 rounded-xl border border-line bg-white px-3.5 py-3 text-left shadow-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-teal hover:shadow-card-hover motion-reduce:transition-colors motion-reduce:hover:translate-y-0"
                >
                  <span className="font-dash-mono text-label font-semibold text-teal-deep">
                    {documentKind(doc.contentType, t)}
                  </span>
                  <span className="flex-1 text-sm text-ink">{doc.filename}</span>
                  <span className="text-xs text-muted">{t('courses.show.viewDocument')}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex max-w-[68ch] flex-col gap-6">
            {sections.map((s) => (
              <section key={s.heading} className="flex flex-col gap-2">
                <h2 className="text-balance text-lg font-bold tracking-[-0.01em] text-ink lg:text-xl">{s.heading}</h2>
                <ul className="flex flex-col gap-2">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="mt-[0.6875rem] h-[5px] w-[5px] shrink-0 rounded-full bg-teal" />
                      <span className="text-base leading-relaxed text-ink-body">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <Link
            href={`/dashboard/exercises?module=${courseModule.id}`}
            className="flex items-center justify-between rounded-2xl border border-line bg-white p-4 shadow-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-teal hover:shadow-card-hover motion-reduce:transition-colors motion-reduce:hover:translate-y-0"
          >
            <span>
              <span className="block text-base font-bold text-ink">{t('courses.show.moduleExercisesTitle')}</span>
              <span className="mt-0.5 block text-meta text-muted">
                {tn('courses.show.moduleExercisesDetail', exerciseStats.count, {
                  completed: exerciseStats.completed,
                })}
              </span>
            </span>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={20}
              strokeWidth={1.75}
              className="shrink-0 text-teal-deep"
              aria-hidden
            />
          </Link>

          <div className="flex flex-col gap-3 rounded-2xl bg-mist p-[18px] shadow-card">
            <div>
              <div className="text-base font-bold text-ink">{t('courses.show.quizTitle')}</div>
              <div className="mt-0.5 text-meta text-muted-strong">
                {tn('courses.show.quizDetail', quizQuestionCount)}
              </div>
            </div>
            <Link href={`/dashboard/courses/${courseModule.id}/quiz`} className={buttonClass('primary')}>
              {t('courses.show.startQuiz')}
            </Link>
          </div>

          {courseModule.status === 'completed' ? (
            <div className={buttonClass('done')}>
              <HugeiconsIcon icon={Tick02Icon} size={18} strokeWidth={2} className="text-teal-deep" aria-hidden />
              {t('courses.show.moduleCompleted')}
            </div>
          ) : (
            <button type="button" onClick={handleComplete} disabled={completing} className={buttonClass('accent')}>
              {completing ? t('courses.show.markingComplete') : t('courses.show.markComplete')}
            </button>
          )}
        </div>
      </div>

      {viewingDocument && (
        <DocumentViewerModal
          document={viewingDocument}
          onClose={() => setViewingDocument(null)}
          closeLabel={t('courses.show.closeDocument')}
        />
      )}
    </div>
  )
}

Show.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Show
