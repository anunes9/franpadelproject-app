import { useTranslation } from '@/i18n/useTranslation'
import type { PlanProgress } from '../types/dashboard-data'

// A Training Plan's progress as one bar segment per Module of its Course,
// each filled by its done Classes. `labelled` names each segment "M1"….
export function ModuleSegments({ progress, labelled = false }: { progress: PlanProgress; labelled?: boolean }) {
  const { t } = useTranslation()
  const label = t('classGroups.progressLabel', {
    done: progress.done,
    total: progress.total,
    current: progress.currentModule ?? progress.modules.length,
    modules: progress.modules.length,
  })

  return (
    <div
      role="img"
      aria-label={label}
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${Math.max(progress.modules.length, 1)}, minmax(0, 1fr))` }}
    >
      {progress.modules.map((module) => {
        const percent = module.total === 0 ? 0 : Math.round((module.done / module.total) * 100)
        return (
          <span key={module.number} className="flex flex-col gap-1">
            <span className="block h-1.5 overflow-hidden rounded-full bg-track">
              <span
                className={`block h-full ${percent === 100 ? 'bg-teal-deep' : 'bg-teal'}`}
                style={{ width: `${percent}%` }}
              />
            </span>
            {labelled && (
              <span className="font-dash-mono text-label text-muted" aria-hidden>
                {t('classGroups.moduleShort', { n: module.number })}
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}

// "Module 2 of 7" beside "14 of 56 done".
export function ModuleLine({ progress }: { progress: PlanProgress }) {
  const { t } = useTranslation()
  const modules = progress.modules.length

  return (
    <div className="flex flex-wrap justify-between gap-2 text-meta">
      <span className="font-bold text-ink">
        {t('classGroups.moduleOf', { n: progress.currentModule ?? modules, total: modules })}
      </span>
      <span className="font-dash-mono text-muted-strong">
        {t('classGroups.doneOf', { done: progress.done, total: progress.total })}
      </span>
    </div>
  )
}
