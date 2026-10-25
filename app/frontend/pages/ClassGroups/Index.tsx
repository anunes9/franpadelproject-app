import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { newClassGroupPath } from '@/lib/paths'
import { ClassGroupRow } from '../../components/ClassGroupRow'
import { AppShell, PageHeader } from '../../components/shell'
import { buttonClass, Eyebrow, ListCard, SectionHeading } from '../../components/ui'
import type { ClassGroupListItem, DashboardUser } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  dashboardUser: DashboardUser
  // The groups still being taught.
  classGroups: ClassGroupListItem[]
  // The finished groups, kept as history.
  finishedGroups: ClassGroupListItem[]
}

// A Coach's own Class Groups, each linking to its Training Plan: the current
// ones, then the finished ones as history.
function Index() {
  const { dashboardUser, classGroups, finishedGroups } = usePage<Props>().props
  const { t } = useTranslation()

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="flex max-w-[760px] flex-col gap-6 lg:mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            {dashboardUser.club && <Eyebrow>{dashboardUser.club}</Eyebrow>}
            <PageHeader title={t('classGroups.index.title')} />
          </div>
          <Link href={newClassGroupPath} className={buttonClass('primary')}>
            {t('classGroups.index.add')}
          </Link>
        </div>

        {/* "No groups yet" only when there are no finished groups either. */}
        <ListCard
          count={classGroups.length}
          empty={finishedGroups.length === 0 ? t('classGroups.index.empty') : undefined}
        >
          {classGroups.map((group) => (
            <ClassGroupRow key={group.id} group={group} />
          ))}
        </ListCard>

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
