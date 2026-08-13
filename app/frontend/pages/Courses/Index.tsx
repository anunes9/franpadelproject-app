import type { ReactNode } from 'react'
import { AppShell, PageHeader } from '../../components/shell'
import type { Module } from '../../types/dashboard-data'
import { ModuleCard } from '@/components/ui/ModuleCard'
import { usePage } from '@inertiajs/react'
import { Card } from '@/components/ui'

interface Props {
  modules: Module[]
}

const LEVELS = [
  { name: 'Beginner', meta: '8 modules', active: true },
  { name: 'Intermediate', meta: 'Locked', active: false },
  { name: 'Advanced', meta: 'Locked', active: false },
]

function Index() {
  const { modules } = usePage<Props>().props

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <PageHeader eyebrow="Beginner course · 8 modules" title="Courses" />

        <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:gap-4">
          {LEVELS.map((l) => (
            <Card title={l.name} key={l.name} details={l.meta} tone={l.active ? 'dark' : 'light'} />
            // <div
            //   key={l.name}
            //   className={
            //     'rounded-[18px] p-4 lg:p-[22px] ' +
            //     (l.active ? 'bg-ink text-paper' : 'border border-line bg-white text-[#A3B0B7]')
            //   }
            // >
            //   <div className="text-sm font-bold lg:text-lg">{l.name}</div>
            //   <div className={'mt-1 text-[11px] lg:text-[13px] ' + (l.active ? 'text-ink-mute' : '')}>{l.meta}</div>
            // </div>
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
              pill={m.progress === 100 ? 'completed' : 'open'}
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
