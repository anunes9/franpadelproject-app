import { usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { formatDate, formatSchedule, formatTimeRange } from '@/lib/classGroups'
import { classGroupsPath, clubPath } from '@/lib/paths'
import { AppShell, PageHeader } from '../../components/shell'
import { BackLink, Eyebrow, ListCard, ListRow, Pill } from '../../components/ui'
import type { ClassGroup, TrainingClass } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  current_user: { role: string } | null
  classGroup: ClassGroup
  classes: TrainingClass[]
}

// The Classes of a Training Plan, one run per Module, in plan order.
function byModule(classes: TrainingClass[]) {
  const runs: Array<{ module: TrainingClass['module']; classes: TrainingClass[] }> = []
  for (const trainingClass of classes) {
    const last = runs[runs.length - 1]
    if (last && last.module.id === trainingClass.module.id) last.classes.push(trainingClass)
    else runs.push({ module: trainingClass.module, classes: [trainingClass] })
  }
  return runs
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-meta text-muted">{label}</dt>
      <dd className="text-sm font-semibold text-ink">{children}</dd>
    </div>
  )
}

// A Class Group and its whole Training Plan, for its Coach and the Club
// Managers of its Club.
function Show() {
  const { current_user, classGroup, classes } = usePage<Props>().props
  const { t, tn, locale } = useTranslation()
  const isManager = current_user?.role === 'club_manager'

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="flex max-w-[760px] flex-col gap-6 lg:mx-auto">
        {isManager ? (
          <BackLink label={t('classGroups.show.backToClub')} href={clubPath(classGroup.club.id)} />
        ) : (
          <BackLink label={t('classGroups.show.backToGroups')} href={classGroupsPath} />
        )}
        <div className="flex flex-col gap-1">
          <Eyebrow>
            {t('classGroups.show.eyebrow')} · {classGroup.club.name}
          </Eyebrow>
          <PageHeader title={t(`players.levelOption.${classGroup.level}`)} />
        </div>

        <dl className="grid grid-cols-2 gap-4 rounded-[18px] border border-line bg-white p-5 shadow-card sm:grid-cols-3">
          <Detail label={t('classGroups.show.schedule')}>{formatSchedule(t, classGroup)}</Detail>
          <Detail label={t('classGroups.show.startsOn')}>{formatDate(classGroup.startsOn, locale, false)}</Detail>
          <Detail label={t('classGroups.show.coach')}>{classGroup.coach}</Detail>
        </dl>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-ink">
            {t('classGroups.show.players')}{' '}
            <span className="font-dash-mono text-meta font-semibold text-muted">{classGroup.players.length}</span>
          </h2>
          <ul className="flex flex-wrap gap-2">
            {classGroup.players.map((player) => (
              <li
                key={player.id}
                className="rounded-full border border-line bg-white px-3 py-1.5 text-meta text-ink shadow-card"
              >
                {player.name}
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-bold text-ink">
            {t('classGroups.show.plan')}{' '}
            <span className="font-dash-mono text-meta font-semibold text-muted">
              {tn('classGroups.show.classesCount', classes.length)}
            </span>
          </h2>

          {byModule(classes).map((run) => (
            <section key={run.module.id} className="flex flex-col gap-2" aria-label={run.module.title}>
              <div className="flex flex-col">
                <Eyebrow>{t('classGroups.show.module', { n: run.module.n })}</Eyebrow>
                <h3 className="text-base font-bold text-ink">{run.module.title}</h3>
              </div>
              <ListCard count={run.classes.length} empty="">
                {run.classes.map((trainingClass) => (
                  <ListRow key={trainingClass.id}>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-semibold text-ink">{formatDate(trainingClass.date, locale)}</span>
                      <span className="font-dash-mono text-meta text-muted">
                        {formatTimeRange(trainingClass.startTime, classGroup.duration)} · {run.module.title}
                      </span>
                      {trainingClass.kind === 'assessment' && (
                        <span className="text-meta text-muted-strong">{t('classGroups.show.assessmentNote')}</span>
                      )}
                    </div>
                    {trainingClass.kind === 'assessment' && <Pill text={t('classGroups.show.assessment')} />}
                  </ListRow>
                ))}
              </ListCard>
            </section>
          ))}
        </section>
      </div>
    </div>
  )
}

Show.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Show
