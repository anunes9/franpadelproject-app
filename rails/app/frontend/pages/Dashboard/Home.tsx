import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { Eyebrow, ProgressBar, Topic } from '../../components/ui'
import { AppShell, PageHeader } from '../../components/shell'
import type { DashboardUser, Module } from '../../types/dashboard-data'

interface CourseStats {
  progress: number
  modulesDone: number
  modulesTotal: number
  exercisesDone: number
  averageQuiz: number
}

interface Props {
  courseStats: CourseStats
  modules: Module[]
  dashboardUser: DashboardUser
}

const WEEK = [
  { day: 'MON', state: 'done' },
  { day: 'TUE', state: 'empty' },
  { day: 'WED', state: 'today' },
  { day: 'THU', state: 'planned' },
  { day: 'FRI', state: 'empty' },
  { day: 'SAT', state: 'empty' },
] as const

function Home() {
  const { courseStats, modules, dashboardUser } = usePage<Props>().props
  const current = modules.find((m) => m.status === 'current')!

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-7">
        <PageHeader eyebrow="Beginner course" title={'Good afternoon, ' + dashboardUser.name.split(' ')[0]} />

        <div className="grid gap-4 grid-cols-3">
          <div className="flex flex-col gap-4 rounded-[18px] bg-ink p-5 text-paper lg:p-6">
            <span className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-ink-mute">
              Course progress
            </span>
            <span className="text-[38px] font-extrabold tracking-[-0.03em] lg:text-[44px]">
              {courseStats.progress}%
            </span>
            <span className="text-sm text-ink-mute">
              {courseStats.modulesDone} of {courseStats.modulesTotal} modules complete
            </span>
            <ProgressBar value={courseStats.progress} tone="dark" />
          </div>

          <div className="flex flex-col gap-1.5 rounded-[18px] border border-line bg-white p-5 lg:p-6">
            <span className="text-[34px] font-bold text-ink">{courseStats.exercisesDone}</span>
            <span className="text-[13px] text-muted">Exercises completed</span>
          </div>

          <div className="flex flex-col gap-1.5 rounded-[18px] border border-line bg-white p-5 lg:p-6">
            <span className="text-[34px] font-bold text-ink">{courseStats.averageQuiz}%</span>
            <span className="text-[13px] text-muted">Average quiz score</span>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-3">
            <Eyebrow>Continue where you left off</Eyebrow>
            <Link
              href={'/dashboard/courses/' + current.id}
              className="flex flex-col gap-3.5 rounded-[18px] border border-line bg-white p-[18px] transition-colors hover:border-teal"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-bold text-ink">{current.title}</div>
                  <div className="mt-0.5 text-sm text-[#56666F]">{current.description}</div>
                </div>
                <span className="whitespace-nowrap rounded-full border border-[#B9D9CB] px-2 py-1 font-dash-mono text-[10px] uppercase tracking-[0.08em] text-teal-deep">
                  In progress
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {current.topics.map((t) => (
                  <Topic key={t}>{t}</Topic>
                ))}
              </div>
              <ProgressBar value={current.progress} />
            </Link>

            <div className="mt-3 flex flex-col gap-3">
              <Eyebrow>Modules</Eyebrow>
              {modules.slice(0, 5).map((m) => (
                <Link
                  key={m.id}
                  href={'/dashboard/courses/' + m.id}
                  className="flex items-center gap-4 rounded-[14px] border border-line bg-white px-4 py-4 transition-colors hover:border-teal"
                >
                  <span className="hidden min-w-[96px] font-dash-mono text-[11px] uppercase tracking-[0.08em] text-muted lg:inline">
                    {m.title}
                  </span>
                  <span className="flex-1 text-[15px] font-semibold text-ink">{m.description}</span>
                  <span className="hidden w-[120px] lg:block">
                    <ProgressBar value={m.progress} />
                  </span>
                  <span className="hidden w-[84px] text-right font-dash-mono text-[11px] text-muted lg:block">
                    {m.duration}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <Eyebrow>This week</Eyebrow>
              <Link href="/dashboard/plan" className="text-[13px] font-semibold">
                Plan
              </Link>
            </div>
            <div className="flex gap-1.5 lg:hidden">
              {WEEK.map((d) => (
                <div
                  key={d.day}
                  className={
                    'flex-1 rounded-xl border py-2.5 text-center ' +
                    (d.state === 'today' ? 'border-ink bg-ink' : 'border-line bg-white')
                  }
                >
                  <div className={'font-dash-mono text-[10px] ' + (d.state === 'today' ? 'text-ink-mute' : 'text-muted')}>
                    {d.day}
                  </div>
                  <div
                    className={
                      'mx-auto mt-2 h-[7px] w-[7px] rounded-full ' +
                      (d.state === 'empty' ? 'bg-line' : d.state === 'today' ? 'bg-teal' : 'bg-teal-deep')
                    }
                  />
                </div>
              ))}
            </div>
            <div className="hidden flex-col gap-3.5 rounded-[18px] border border-line bg-white p-[18px] lg:flex">
              {[
                ['Monday', 'Slice serve, elbow above 90º · Technical'],
                ['Wednesday', 'Traffic light stop drill · Technical'],
                ['Thursday', 'Glass exit, dominant side · Tactical'],
              ].map(([day, item]) => (
                <div key={day} className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-ink">{day}</span>
                  <div className="rounded-[10px] border border-dashed border-[#C9D2CD] px-3 py-2.5 text-[13px] text-[#3B4B54]">
                    {item}
                  </div>
                </div>
              ))}
              <Link
                href="/dashboard/plan"
                className="rounded-[10px] border border-dashed border-line px-3 py-3.5 text-center text-xs text-[#A3B0B7]"
              >
                Drag an exercise here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

Home.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Home
