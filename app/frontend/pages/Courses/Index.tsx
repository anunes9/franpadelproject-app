import type { ReactNode } from 'react'
import { AppShell, PageHeader } from '../../components/shell'
import type { Module } from '../../types/dashboard-data'
import { ModuleCard } from '@/components/ui/ModuleCard'
import { usePage } from '@inertiajs/react'
import { Card } from '@/components/ui'
import { useTranslation } from '@/i18n/useTranslation'

interface Props {
  [key: string]: unknown
  modules: Module[]
}

function Index() {
  const { modules } = usePage<Props>().props
  const { t } = useTranslation()

  const levels = [
    { name: t('courses.index.level.beginner'), meta: t('courses.index.level.beginnerMeta'), active: true },
    { name: t('courses.index.level.intermediate'), meta: t('courses.index.level.locked'), active: false },
    { name: t('courses.index.level.advanced'), meta: t('courses.index.level.locked'), active: false },
  ]

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <PageHeader eyebrow={t('courses.index.eyebrow')} title={t('courses.index.title')} />

        <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:gap-4">
          {levels.map((l) => (
            <Card title={l.name} key={l.name} details={l.meta} tone={l.active ? 'dark' : 'light'} />
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
          {modules.map((m) => (
            <ModuleCard
              key={m.id}
              href={'/dashboard/courses/' + m.id}
              title={m.title}
              description={m.description}
              progress={m.progress}
              duration={m.duration}
              pill={m.progress === 100 ? t('common.status.completed') : t('common.status.open')}
              topics={m.topics}
              variant="index"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

Index.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Index
