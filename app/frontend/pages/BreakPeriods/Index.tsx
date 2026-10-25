import { Link, router, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { breakPeriodPath, clubPath, editBreakPeriodPath, newClubBreakPeriodPath } from '@/lib/paths'
import { AppShell, PageHeader } from '../../components/shell'
import { BackLink, buttonClass, Eyebrow, ListCard, ListRow } from '../../components/ui'
import type { BreakPeriod, ClubSummary } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  club: ClubSummary
  breakPeriods: BreakPeriod[]
}

const ROW_ACTION = '-my-2 flex min-h-11 shrink-0 items-center text-meta font-semibold'

// "21 Dec 2026 – 3 Jan 2027", or a single date for a one-day Break Period.
function formatRange(breakPeriod: BreakPeriod, locale: string) {
  const format = new Intl.DateTimeFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const starts = format.format(new Date(`${breakPeriod.startsOn}T00:00:00Z`))
  if (breakPeriod.startsOn === breakPeriod.endsOn) return starts
  return `${starts} – ${format.format(new Date(`${breakPeriod.endsOn}T00:00:00Z`))}`
}

function Index() {
  const { club, breakPeriods } = usePage<Props>().props
  const { t, locale } = useTranslation()

  function handleRemove(breakPeriod: BreakPeriod) {
    if (!window.confirm(t('breakPeriods.index.confirmRemove', { name: breakPeriod.name }))) return
    router.delete(breakPeriodPath(breakPeriod.id), { preserveScroll: true })
  }

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="flex max-w-[760px] flex-col gap-6 lg:mx-auto">
        <BackLink label={t('breakPeriods.index.backToClub')} href={clubPath(club.id)} />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Eyebrow>{club.name}</Eyebrow>
            <PageHeader title={t('breakPeriods.index.title')} />
          </div>
          <Link href={newClubBreakPeriodPath(club.id)} className={buttonClass('primary')}>
            {t('breakPeriods.index.add')}
          </Link>
        </div>
        <p className="text-sm text-muted">{t('breakPeriods.index.intro')}</p>

        <ListCard count={breakPeriods.length} empty={t('breakPeriods.index.empty')}>
          {breakPeriods.map((breakPeriod) => (
            <ListRow key={breakPeriod.id}>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink">{breakPeriod.name}</div>
                <div className="text-meta text-muted">{formatRange(breakPeriod, locale)}</div>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <Link
                  href={editBreakPeriodPath(breakPeriod.id)}
                  className={`${ROW_ACTION} text-teal-deep hover:text-ink`}
                  aria-label={`${t('breakPeriods.index.edit')} ${breakPeriod.name}`}
                >
                  {t('breakPeriods.index.edit')}
                </Link>
                <button
                  type="button"
                  onClick={() => handleRemove(breakPeriod)}
                  className={`${ROW_ACTION} text-danger hover:text-ink`}
                  aria-label={`${t('breakPeriods.index.remove')} ${breakPeriod.name}`}
                >
                  {t('breakPeriods.index.remove')}
                </button>
              </div>
            </ListRow>
          ))}
        </ListCard>
      </div>
    </div>
  )
}

Index.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Index
