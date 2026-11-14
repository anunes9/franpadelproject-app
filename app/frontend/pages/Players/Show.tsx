import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { formatDate, groupName } from '@/lib/classGroups'
import { itemName } from '@/lib/evaluations'
import { classGroupsPath, classPath, clubPlayersPath, editPlayerPath } from '@/lib/paths'
import { RadarChart, RatingPips, Trend } from '../../components/Evaluation'
import { AppShell, PageHeader } from '../../components/shell'
import { BackLink, Eyebrow } from '../../components/ui'
import type {
  ClubSummary,
  PerformanceProfile,
  Player,
  ProfileEvaluation,
  ProfileItem,
} from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  player: Player
  club: ClubSummary
  profile: PerformanceProfile
  // Whether the user can edit the Player's details.
  canEdit: boolean
  current_user: { role: string } | null
}

// A Player's Performance Profile, built from every Evaluation Coaches
// recorded for them: the Profile Areas as a radar chart, the items to
// improve, the Strokes, and the history of Evaluations. Read only.
function Show() {
  const { player, club, profile, canEdit, current_user } = usePage<Props>().props
  const { t, locale } = useTranslation()
  const manager = current_user?.role === 'club_manager'
  const axes = profile.areas.map((area) => ({ name: itemName(t, area), value: area.value }))
  const radarLabel = t('evaluations.profile.radarLabel', {
    values: axes.map((axis) => `${axis.name} ${axis.value ?? t('evaluations.profile.notRated')}`).join(', '),
  })

  return (
    <div className="px-5 pt-6 pb-14 lg:px-10 lg:pt-8">
      <div className="flex max-w-[1120px] flex-col gap-6 lg:mx-auto">
        <BackLink
          label={manager ? t('evaluations.profile.backToPlayers') : t('evaluations.profile.backToGroups')}
          href={manager ? clubPlayersPath(club.id) : classGroupsPath}
        />

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <Eyebrow>
              {t('evaluations.profile.eyebrow')} · {club.name}
            </Eyebrow>
            <PageHeader title={player.name} />
            <span className="text-meta text-muted-strong">
              {t(`players.levelOption.${player.level}`)} · {t('players.index.columns.position')}{' '}
              {t(`players.positionOption.${player.position}`).toLowerCase()} · {t('players.index.columns.hand')}{' '}
              {t(`players.handOption.${player.hand}`).toLowerCase()}
            </span>
          </div>
          {canEdit && (
            <Link
              href={editPlayerPath(player.id)}
              className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-4 text-meta font-semibold text-teal-deep hover:border-teal"
            >
              {t('evaluations.profile.editPlayer')}
            </Link>
          )}
        </div>

        {profile.history.length === 0 ? (
          <p className="rounded-[18px] border border-dashed border-line-strong/40 px-5 py-10 text-center text-sm text-muted-strong">
            {t('evaluations.profile.empty')}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-start gap-5">
              <Panel
                title={t('evaluations.profile.areas')}
                intro={t('evaluations.profile.areasIntro')}
                className="flex-[1_1_420px]"
              >
                <div className="flex flex-wrap items-center gap-5">
                  <div className="min-w-0 flex-[1_1_240px]">
                    <RadarChart axes={axes} label={radarLabel} />
                  </div>
                  <ItemList items={profile.areas} className="flex-[1_1_220px]" />
                </div>
              </Panel>

              <Panel
                title={t('evaluations.profile.toImprove')}
                intro={t('evaluations.profile.toImproveIntro')}
                className="flex-[1_1_300px]"
              >
                {profile.toImprove.length === 0 ? (
                  <p className="text-meta text-muted">{t('evaluations.profile.nothingToImprove')}</p>
                ) : (
                  <ItemList items={profile.toImprove} />
                )}
              </Panel>
            </div>

            <Panel title={t('evaluations.profile.strokes')}>
              {profile.strokes.length === 0 ? (
                <p className="text-meta text-muted">{t('evaluations.profile.noStrokes')}</p>
              ) : (
                <ItemList items={profile.strokes} columns />
              )}
            </Panel>

            <section aria-labelledby="history-title" className="flex flex-col gap-3">
              <h2 id="history-title" className="text-lg font-extrabold text-ink">
                {t('evaluations.profile.history')}{' '}
                <span className="font-dash-mono text-meta font-medium text-muted">{profile.history.length}</span>
              </h2>
              <ol className="flex flex-col gap-3">
                {profile.history.map((evaluation) => (
                  <HistoryEntry key={evaluation.id} evaluation={evaluation} locale={locale} />
                ))}
              </ol>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function Panel({
  title,
  intro,
  className = '',
  children,
}: {
  title: string
  intro?: string
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={`flex min-w-0 flex-col gap-3 rounded-[18px] border border-line bg-white p-5 shadow-card ${className}`}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-extrabold text-ink">{title}</h2>
        {intro && <p className="text-meta text-muted-strong">{intro}</p>}
      </div>
      {children}
    </section>
  )
}

// Items with their latest value as pips and a number, and their trend.
function ItemList({
  items,
  columns = false,
  className = '',
}: {
  items: ProfileItem[]
  columns?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <ul className={`grid gap-x-8 ${columns ? 'sm:grid-cols-2' : ''} ${className}`}>
      {items.map((item) => (
        <li
          key={`${item.kind}:${item.key}`}
          className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-mist py-2.5 last:border-b-0"
        >
          <span className="flex flex-col">
            <span className="text-sm font-semibold text-ink">{itemName(t, item)}</span>
            <Trend item={item} />
          </span>
          <span className="flex items-center gap-2.5">
            <RatingPips value={item.value} />
            <span className="w-4 text-right font-dash-mono text-sm font-semibold text-ink">{item.value ?? '–'}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

// One Evaluation: when, which Module and group, who recorded it, its comment
// and each Rating with its own comment.
function HistoryEntry({ evaluation, locale }: { evaluation: ProfileEvaluation; locale: string }) {
  const { t } = useTranslation()
  return (
    <li className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] font-extrabold text-ink">{evaluation.module.title}</span>
          <span className="text-meta text-muted-strong">
            {formatDate(evaluation.date, locale)} ·{' '}
            {t('evaluations.profile.by', { coach: evaluation.coach, group: groupName(t, evaluation.group) })}
          </span>
        </div>
        <Link
          href={classPath(evaluation.classId)}
          className="text-meta font-semibold text-teal-deep underline-offset-2 hover:underline"
        >
          {t('evaluations.profile.openClass')}
        </Link>
      </div>
      {evaluation.comment && <p className="text-sm text-ink-body">{evaluation.comment}</p>}
      <ul className="flex flex-wrap gap-2">
        {evaluation.ratings.map((rating) => (
          <li
            key={`${rating.kind}:${rating.key}`}
            title={rating.comment ?? undefined}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-meta text-ink"
          >
            {itemName(t, rating)}
            <span className="font-dash-mono font-semibold">{rating.value}</span>
          </li>
        ))}
      </ul>
      {evaluation.ratings.some((rating) => rating.comment) && (
        <ul className="flex flex-col gap-1">
          {evaluation.ratings
            .filter((rating) => rating.comment)
            .map((rating) => (
              <li key={`${rating.kind}:${rating.key}`} className="text-meta text-muted-strong">
                <span className="font-semibold text-ink">{itemName(t, rating)}:</span> {rating.comment}
              </li>
            ))}
        </ul>
      )}
    </li>
  )
}

Show.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Show
