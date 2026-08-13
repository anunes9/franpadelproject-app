import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { AppShell, PageHeader } from '../../components/shell'
import { Card, Eyebrow } from '../../components/ui'
import type { DashboardUser, Module } from '../../types/dashboard-data'
import { ModuleCard } from '@/components/ui/ModuleCard'

interface CourseStats {
  progress: number
  modulesDone: number
  modulesTotal: number
  exercisesDone: number
  averageQuiz: number
}

interface Props {
  [key: string]: unknown
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
  const current = modules.find((m) => m.status === 'current') ?? modules[0]

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-5xl flex-col gap-7">
        <PageHeader title={'Good afternoon, ' + dashboardUser.name.split(' ')[0]} />

        {/*Hero Cards*/}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          <Card
            title="Course progress"
            content={`${courseStats.progress}%`}
            details={`${courseStats.modulesDone} of ${courseStats.modulesTotal} modules complete`}
            progress={courseStats.progress}
            tone="dark"
          />

          <Card title="Exercises completed" content={courseStats.exercisesDone} />

          <Card title="Average quiz score" content={`${courseStats.averageQuiz}%`} />
        </div>

        {/*Modules*/}
        <div className="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
          {/*In Progress Module*/}
          <div className="flex flex-col gap-3">
            <Eyebrow>Continue where you left off</Eyebrow>

            <ModuleCard
              href={'/dashboard/courses/' + current.id}
              title={current.title}
              description={current.description}
              progress={current.progress}
              topics={current.topics}
              pill="in progress"
              variant="index"
            />

            {/*All Module*/}
            <div className="mt-3 flex flex-col gap-3">
              <Eyebrow>Modules</Eyebrow>

              {modules.slice(0, 5).map((m) => (
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

          {/*Plan for this week*/}
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
                  <div
                    className={'font-dash-mono text-[10px] ' + (d.state === 'today' ? 'text-ink-mute' : 'text-muted')}
                  >
                    {d.day}
                  </div>
                  <div
                    className={
                      'mx-auto mt-2 h-2 w-2 rounded-full ' +
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
