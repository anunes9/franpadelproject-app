import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { Eyebrow } from '../../components/ui'
import { AppShell } from '../../components/shell'
import type { ContentSection, Exercise, Module } from '../../types/dashboard-data'

interface Props {
  courseModule: Module
  sections: ContentSection[]
  exercises: Exercise[]
}

const MATERIALS = [
  { kind: 'PDF', name: 'Game Initiation Model — slides', meta: '4.2 MB' },
  { kind: 'MP4', name: 'Slice serve — court demo', meta: '6:12' },
]

function Show() {
  const { courseModule, sections, exercises } = usePage<Props>().props

  return (
    <div>
      <div className="bg-ink px-5 pb-6 pt-6 text-paper lg:px-10 lg:pb-10 lg:pt-9">
        <div className="mx-auto flex max-w-[880px] flex-col gap-3.5">
          <Link href="/dashboard/courses" className="text-[13px] text-ink-mute hover:text-paper">
            ← Beginner course
          </Link>
          <div>
            <div className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-teal">
              {courseModule.title}
            </div>
            <h1 className="mt-1.5 text-[26px] font-bold tracking-[-0.02em] lg:text-[38px]">
              {courseModule.description}
            </h1>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {courseModule.topics.map((t) => (
              <span key={t} className="rounded-md bg-paper/10 px-2 py-1 text-xs">
                {t}
              </span>
            ))}
          </div>
          <div className="flex gap-5 text-xs text-ink-mute">
            <span>{courseModule.duration}</span>
            <span>{MATERIALS.length} documents</span>
            <span>{exercises.length} exercises</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-[880px] flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Eyebrow>Materials</Eyebrow>
            {MATERIALS.map((doc) => (
              <div key={doc.name} className="flex items-center gap-3 rounded-xl border border-line bg-white px-3.5 py-3">
                <span className="font-dash-mono text-[10px] font-semibold text-teal-deep">{doc.kind}</span>
                <span className="flex-1 text-sm text-ink">{doc.name}</span>
                <span className="text-xs text-muted">{doc.meta}</span>
              </div>
            ))}
          </div>

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
              <span className="block text-[15px] font-bold text-ink">Module exercises</span>
              <span className="mt-0.5 block text-[13px] text-muted">{exercises.length} drills · 2 completed</span>
            </span>
            <span className="text-lg text-teal-deep">→</span>
          </Link>

          <div className="flex flex-col gap-3 rounded-2xl bg-mist p-[18px]">
            <div>
              <div className="text-[15px] font-bold text-ink">Knowledge check</div>
              <div className="mt-0.5 text-[13px] text-[#56666F]">4 questions · unlocks module completion</div>
            </div>
            <Link
              href={'/dashboard/courses/' + courseModule.id + '/quiz'}
              className="rounded-full bg-ink py-3.5 text-center text-[15px] font-semibold text-paper"
            >
              Start knowledge check
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

Show.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Show
