import { useTranslation } from '@/i18n/useTranslation'
import type { CoachCourseProgress as Progress } from '../types/dashboard-data'
import { ProgressBar } from './ui'

// A Coach's Course progress in compact form for a Club Manager: per Course a
// small labelled bar with Modules completed out of total, or "Coming soon"
// for a Planned Course.
export function CoachCourseProgress({ progress }: { progress: Progress }) {
  const { t } = useTranslation()

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <ul aria-label={t('clubs.overview.courseProgress')} className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        {progress.courses.map((course) => {
          const name = t(`courses.index.level.${course.level}`)
          const planned = course.modulesTotal === 0
          return (
            <li key={course.level} className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-meta">
                <span className="font-semibold text-muted-strong">{name}</span>
                <span className="font-dash-mono text-muted">
                  {planned
                    ? t('courses.index.comingSoon')
                    : t('clubs.overview.courseModules', { done: course.modulesDone, total: course.modulesTotal })}
                </span>
              </div>
              {!planned && <ProgressBar value={course.progress} label={name} />}
            </li>
          )
        })}
      </ul>
      <div className="text-meta text-muted">{t('clubs.overview.exercisesDone', { count: progress.exercisesDone })}</div>
    </div>
  )
}
