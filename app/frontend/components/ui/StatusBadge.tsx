import type { ModuleStatus } from '../../types/dashboard-data'

export function StatusBadge({ status }: { status: ModuleStatus }) {
  const map = {
    done: 'bg-teal-deep text-paper border-teal-deep',
    current: 'text-teal-deep border-[#B9D9CB]',
    locked: 'text-[#A3B0B7] border-line',
  } as const
  const label = { done: 'Done', current: 'Active', locked: 'Locked' }[status]
  return (
    <span
      className={
        'whitespace-nowrap rounded-full border px-2 py-1 font-dash-mono text-[10px] uppercase tracking-[0.08em] ' +
        map[status]
      }
    >
      {label}
    </span>
  )
}
