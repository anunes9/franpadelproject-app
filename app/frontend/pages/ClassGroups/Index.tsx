import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { newClassGroupPath } from '@/lib/paths'
import { ClassGroupCard } from '../../components/ClassGroupCard'
import { ClassGroupRow } from '../../components/ClassGroupRow'
import { AppShell, PageHeader } from '../../components/shell'
import { buttonClass, Eyebrow, ListCard, SectionHeading } from '../../components/ui'
import { WeekStrip } from '../../components/WeekStrip'
import type { ClassGroupCard as Card, ClassGroupListItem, DashboardUser, WeekClass } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  dashboardUser: DashboardUser
  // ISO date (YYYY-MM-DD) at the Academy.
  today: string
  // The shown week, from its Monday: the Coach's Classes in it.
  week: { startsOn: string; classes: WeekClass[] }
  // The groups still being taught, with how far each plan has got.
  classGroups: Card[]
  // The finished groups, kept as history.
  finishedGroups: ClassGroupListItem[]
}

// A Coach's week of Classes, then their own Class Groups, each linking to
// its Training Plan: the current ones as cards, then the finished ones as
// history.
function Index() {
  const { dashboardUser, today, week, classGroups, finishedGroups } = usePage<Props>().props
  const { t } = useTranslation()

  return (
    <div className="px-5 pt-6 pb-14 lg:px-10 lg:pt-9">
      <div className="flex max-w-[960px] flex-col gap-7 lg:mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            {dashboardUser.club && <Eyebrow>{dashboardUser.club}</Eyebrow>}
            <PageHeader title={t('classGroups.index.title')} />
          </div>
          <Link href={newClassGroupPath} className={buttonClass('primary')}>
            {t('classGroups.index.add')}
          </Link>
        </div>

        <WeekStrip startsOn={week.startsOn} classes={week.classes} today={today} />

        <section className="flex flex-col gap-3" aria-labelledby="my-groups-title">
          <SectionHeading id="my-groups-title" title={t('classGroups.index.myGroups')} count={classGroups.length} />
          {classGroups.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,400px),1fr))] gap-4">
              {classGroups.map((group) => (
                <ClassGroupCard key={group.id} group={group} today={today} />
              ))}
            </div>
          ) : (
            // "No groups yet" only when there are no finished groups either.
            finishedGroups.length === 0 && <p className="text-sm text-muted">{t('classGroups.index.empty')}</p>
          )}
        </section>

        {finishedGroups.length > 0 && (
          <section className="flex flex-col gap-3" aria-labelledby="finished-groups-title">
            <SectionHeading
              id="finished-groups-title"
              title={t('classGroups.finishedGroups.title')}
              count={finishedGroups.length}
              hint={t('classGroups.finishedGroups.hint')}
            />
            <ListCard count={finishedGroups.length}>
              {finishedGroups.map((group) => (
                <ClassGroupRow key={group.id} group={group} />
              ))}
            </ListCard>
          </section>
        )}
      </div>
    </div>
  )
}

Index.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Index
