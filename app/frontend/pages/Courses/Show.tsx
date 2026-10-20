import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ChartBarLineIcon,
  Dumbbell02Icon,
  File01Icon,
  Image01Icon,
  PlayIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link, router, usePage } from '@inertiajs/react'
import { type ReactNode, useState } from 'react'
import type { TranslationKey } from '@/i18n/translations'
import { useTranslation } from '@/i18n/useTranslation'
import { AppShell } from '../../components/shell'
import {
  ArrowBadge,
  buttonClass,
  DocumentViewerModal,
  Eyebrow,
  ProgressBar,
  RoundIcon,
  Tile,
  TilePill,
} from '../../components/ui'
import type { ContentSection, CourseDocument, Module } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  courseModule: Module
  sections: ContentSection[]
  exerciseStats: { count: number; completed: number }
  documents: CourseDocument[]
  quizQuestionCount: number
}

const LEVEL_KEYS = ['beginner', 'intermediate', 'advanced'] as const

function documentKind(contentType: string, t: (key: TranslationKey) => string) {
  if (contentType === 'application/pdf') return t('courses.show.documentKind.pdf')
  if (contentType.startsWith('image/')) return t('courses.show.documentKind.image')
  if (contentType.startsWith('video/')) return t('courses.show.documentKind.video')
  return contentType.split('/')[1]?.toUpperCase() ?? t('courses.show.documentKind.file')
}

function documentIcon(contentType: string) {
  if (contentType.startsWith('image/')) return Image01Icon
  if (contentType.startsWith('video/')) return PlayIcon
  return File01Icon
}

function Show() {
  const { courseModule, sections, exerciseStats, documents, quizQuestionCount } = usePage<Props>().props
  const { t, tn } = useTranslation()
  const [completing, setCompleting] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<CourseDocument | null>(null)

  const levelKey = courseModule.level.toLowerCase()
  const levelLabel = LEVEL_KEYS.some((k) => k === levelKey)
    ? t(`courses.index.level.${levelKey as (typeof LEVEL_KEYS)[number]}`)
    : courseModule.level

  function handleComplete() {
    setCompleting(true)
    router.patch(
      `/dashboard/courses/${courseModule.id}/complete`,
      {},
      { preserveScroll: true, onFinish: () => setCompleting(false) }
    )
  }

  return (
    <div className="px-5 pt-5 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[880px] flex-col gap-5 lg:gap-6">
        <div className="flex items-center justify-between gap-3">
          <RoundIcon icon={ArrowLeft01Icon} label={t('courses.show.backLink')} href="/dashboard/courses" />
          <span className="truncate text-sm font-semibold text-ink">
            {levelLabel} · {courseModule.title}
          </span>
          <span className="h-11 w-11 shrink-0" aria-hidden="true" />
        </div>

        <h1 className="max-w-[32ch] text-balance text-[28px] font-extrabold leading-[1.08] tracking-[-0.02em] text-ink lg:text-[36px]">
          {courseModule.description}
        </h1>

        <Tile tone="teal" className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-ink">
              <HugeiconsIcon icon={ChartBarLineIcon} size={16} strokeWidth={1.8} aria-hidden />
            </span>
            <div className="flex min-w-0 flex-col">
              <h2 className="text-meta font-bold">{t('courses.show.progressTitle')}</h2>
              <span className="text-[11px] text-muted-strong">
                {tn('courses.show.topicsCount', courseModule.topics.length)} · {courseModule.duration}
              </span>
            </div>
            <span className="ml-auto text-2xl font-extrabold tracking-[-0.02em]">{courseModule.progress}%</span>
          </div>
          <ProgressBar value={courseModule.progress} tone="tile" label={t('courses.show.progressTitle')} />
          {courseModule.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {courseModule.topics.map((topic) => (
                <TilePill key={topic}>{topic}</TilePill>
              ))}
            </div>
          )}
        </Tile>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold tracking-[-0.01em] text-ink">
            {t('courses.show.materialsDrillsTitle')}
          </h2>
          <Link
            href={`/dashboard/exercises?module=${courseModule.id}`}
            className="flex min-h-11 items-center text-meta font-semibold text-muted-strong"
          >
            {t('common.viewAll')}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2.5 lg:gap-3">
          <Tile tone="clay" className="flex flex-col gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink">
              <HugeiconsIcon icon={File01Icon} size={18} strokeWidth={1.7} aria-hidden />
            </span>
            <span className="text-meta font-semibold text-muted-strong">{t('courses.show.materialsLabel')}</span>
            <span className="text-3xl font-extrabold leading-none tracking-[-0.02em]">{documents.length}</span>
          </Tile>
          <Tile tone="ink" href={`/dashboard/exercises?module=${courseModule.id}`} className="flex flex-col gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink">
              <HugeiconsIcon icon={Dumbbell02Icon} size={18} strokeWidth={1.7} aria-hidden />
            </span>
            <span className="text-meta font-semibold text-muted-strong">{t('courses.show.drillsLabel')}</span>
            <div className="flex items-end justify-between gap-2">
              <span className="flex flex-col gap-1">
                <span className="text-3xl font-extrabold leading-none tracking-[-0.02em]">{exerciseStats.count}</span>
                <span className="text-[11px] text-muted-strong">
                  {t('courses.show.drillsDone', { done: exerciseStats.completed })}
                </span>
              </span>
              <ArrowBadge size="sm" />
            </div>
          </Tile>
        </div>

        {documents.length > 0 && (
          <div className="flex flex-col gap-2">
            <Eyebrow>{t('courses.show.materialsEyebrow')}</Eyebrow>
            {documents.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => setViewingDocument(doc)}
                className="flex min-h-14 items-center gap-3 rounded-2xl border border-line bg-white px-3.5 py-3 text-left transition-colors hover:border-teal"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-tint-teal text-ink">
                  <HugeiconsIcon icon={documentIcon(doc.contentType)} size={18} strokeWidth={1.7} aria-hidden />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{doc.filename}</span>
                <span className="font-dash-mono text-label text-muted-strong">{documentKind(doc.contentType, t)}</span>
              </button>
            ))}
          </div>
        )}

        {sections.length > 0 && (
          <div className="flex max-w-[68ch] flex-col gap-5">
            {sections.map((s) => (
              <section key={s.heading} className="flex flex-col gap-2">
                <h2 className="text-balance text-lg font-bold tracking-[-0.01em] text-ink lg:text-xl">{s.heading}</h2>
                <ul className="flex flex-col gap-2">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="mt-[0.6875rem] h-[5px] w-[5px] shrink-0 rounded-full bg-teal-deep" />
                      <span className="text-base leading-relaxed text-ink-body">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <Link
          href={`/dashboard/courses/${courseModule.id}/quiz`}
          className="flex items-center gap-3 rounded-[22px] border border-line bg-white p-4 transition-colors hover:border-teal"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tint-teal text-ink">
            <HugeiconsIcon icon={Tick02Icon} size={18} strokeWidth={1.8} aria-hidden />
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-sm font-bold text-ink">{t('courses.show.quizTitle')}</span>
            <span className="text-xs text-muted-strong">{tn('courses.show.quizDetail', quizQuestionCount)}</span>
          </span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={20}
            strokeWidth={1.7}
            className="shrink-0 text-muted-strong"
            aria-hidden
          />
        </Link>

        {courseModule.status === 'completed' ? (
          <div className={buttonClass('done', 'min-h-14')}>
            <HugeiconsIcon icon={Tick02Icon} size={18} strokeWidth={2} className="text-teal-deep" aria-hidden />
            {t('courses.show.moduleCompleted')}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleComplete}
            disabled={completing}
            className={buttonClass('accent', 'min-h-14')}
          >
            {completing ? t('courses.show.markingComplete') : t('courses.show.markComplete')}
          </button>
        )}
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

Show.layout = (page: ReactNode) => <AppShell mobileHeader={false}>{page}</AppShell>

export default Show
