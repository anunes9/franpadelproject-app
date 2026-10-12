import { usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { ModuleCard } from '@/components/ui/ModuleCard'
import type { TranslationKey } from '@/i18n/translations'
import { useTranslation } from '@/i18n/useTranslation'
import { AppShell, PageHeader } from '../../components/shell'
import type { Module } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  modules: Module[]
}

// One Course per Level, always in this order. A Course with no Modules yet is
// Planned and shown as coming soon.
const COURSES: { level: string; nameKey: TranslationKey }[] = [
  { level: 'Beginner', nameKey: 'courses.index.level.beginner' },
  { level: 'Intermediate', nameKey: 'courses.index.level.intermediate' },
  { level: 'Advanced', nameKey: 'courses.index.level.advanced' },
]

function Index() {
  const { modules } = usePage<Props>().props
  const { t } = useTranslation()

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <PageHeader title={t('courses.index.title')} />

        {COURSES.map((course) => {
          const courseModules = modules.filter((m) => m.level === course.level)
          const completed = courseModules.filter((m) => m.status === 'completed').length
          const headingId = `course-${course.level.toLowerCase()}`

          return (
            <section key={course.level} aria-labelledby={headingId} className="flex flex-col gap-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 id={headingId} className="text-xl font-bold tracking-[-0.01em] text-ink lg:text-2xl">
                  {t(course.nameKey)}
                </h2>
                <span className="text-sm text-muted-strong">
                  {courseModules.length > 0
                    ? t('courses.index.modulesCompleted', { done: completed, total: courseModules.length })
                    : t('courses.index.comingSoon')}
                </span>
              </div>

              {courseModules.some((m) => m.status === 'locked') && (
                <p className="-mt-2 text-meta text-muted">{t('courses.index.lockedHint')}</p>
              )}

              {courseModules.length > 0 ? (
                <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
                  {courseModules.map((m) => (
                    <ModuleCard
                      key={m.id}
                      href={`/dashboard/courses/${m.id}`}
                      title={m.title}
                      description={m.description}
                      status={m.status}
                      progress={m.progress}
                      duration={m.duration}
                      topics={m.topics}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-line-strong/40 px-4 py-6 text-sm text-muted-strong">
                  {t('courses.index.plannedDetail')}
                </p>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

Index.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Index
