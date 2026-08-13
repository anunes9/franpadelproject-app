import { Link, router, usePage } from '@inertiajs/react'
import { type ReactNode, useState } from 'react'
import { AppShell } from '../../components/shell'
import { Eyebrow } from '../../components/ui'
import type { ContentSection, CourseDocument, Exercise, Module } from '../../types/dashboard-data'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/translations'

interface Props {
  [key: string]: unknown
  courseModule: Module
  sections: ContentSection[]
  exercises: Exercise[]
  documents: CourseDocument[]
}

function documentKind(contentType: string, t: (key: TranslationKey) => string) {
  if (contentType === 'application/pdf') return t('courses.show.documentKind.pdf')
  if (contentType.startsWith('image/')) return t('courses.show.documentKind.image')
  if (contentType.startsWith('video/')) return t('courses.show.documentKind.video')
  return contentType.split('/')[1]?.toUpperCase() ?? t('courses.show.documentKind.file')
}

function Show() {
  const { courseModule, sections, exercises, documents } = usePage<Props>().props
  const { t } = useTranslation()
  const [completing, setCompleting] = useState(false)

  function handleComplete() {
    setCompleting(true)
    router.patch(
      `/dashboard/courses/${courseModule.id}/complete`,
      {},
      { preserveScroll: true, onFinish: () => setCompleting(false) },
    )
  }

  return (
    <div>
      <div className="bg-ink px-5 pb-6 pt-6 text-paper lg:px-10 lg:pb-10 lg:pt-9">
        <div className="mx-auto flex max-w-[880px] flex-col gap-3.5">
          <Link href="/dashboard/courses" className="text-[13px] text-ink-mute hover:text-paper">
            {t('courses.show.backLink')}
          </Link>
          <div>
            <div className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-teal">{courseModule.title}</div>
            <h1 className="mt-1.5 text-[26px] font-bold tracking-[-0.02em] lg:text-[38px]">
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
            <span>{t('courses.show.documentsCount', { count: documents.length })}</span>
            <span>{t('courses.show.exercisesCount', { count: exercises.length })}</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-[880px] flex-col gap-6">
          {documents.length > 0 && (
            <div className="flex flex-col gap-2">
              <Eyebrow>{t('courses.show.materialsEyebrow')}</Eyebrow>
              {documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-line bg-white px-3.5 py-3 transition-colors hover:border-teal"
                >
                  <span className="font-dash-mono text-[10px] font-semibold text-teal-deep">
                    {documentKind(doc.contentType, t)}
                  </span>
                  <span className="flex-1 text-sm text-ink">{doc.filename}</span>
                  <span className="text-xs text-muted">{t('courses.show.viewDocument')}</span>
                </a>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-5">
            {sections.map((s) => (
              <section key={s.heading} className="flex flex-col gap-2">
                <h2 className="text-[17px] font-bold tracking-[-0.01em] text-ink lg:text-xl">{s.heading}</h2>
                <ul className="flex flex-col gap-2">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="mt-2 h-[5px] w-[5px] shrink-0 rounded-full bg-teal" />
                      <span className="text-sm leading-relaxed text-[#3B4B54]">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <Link
            href="/dashboard/exercises"
            className="flex items-center justify-between rounded-2xl border border-line bg-white p-4 transition-colors hover:border-teal"
          >
            <span>
              <span className="block text-[15px] font-bold text-ink">{t('courses.show.moduleExercisesTitle')}</span>
              <span className="mt-0.5 block text-[13px] text-muted">
                {t('courses.show.moduleExercisesDetail', { count: exercises.length })}
              </span>
            </span>
            <span className="text-lg text-teal-deep">→</span>
          </Link>

          <div className="flex flex-col gap-3 rounded-2xl bg-mist p-[18px]">
            <div>
              <div className="text-[15px] font-bold text-ink">{t('courses.show.knowledgeCheckTitle')}</div>
              <div className="mt-0.5 text-[13px] text-[#56666F]">{t('courses.show.knowledgeCheckDetail')}</div>
            </div>
            <Link
              href={'/dashboard/courses/' + courseModule.id + '/quiz'}
              className="rounded-full bg-ink py-3.5 text-center text-[15px] font-semibold text-paper"
            >
              {t('courses.show.startKnowledgeCheck')}
            </Link>
          </div>

          {courseModule.status === 'done' ? (
            <div className="rounded-full border border-line bg-white py-3.5 text-center text-[15px] font-semibold text-muted">
              {t('courses.show.moduleCompleted')}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={completing}
              className="rounded-full bg-teal-deep py-3.5 text-center text-[15px] font-semibold text-paper transition-opacity disabled:opacity-60"
            >
              {completing ? t('courses.show.markingComplete') : t('courses.show.markComplete')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

Show.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Show
