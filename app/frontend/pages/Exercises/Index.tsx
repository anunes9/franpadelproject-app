import { router, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { AppShell, PageHeader } from '../../components/shell'
import { CategoryFilter, ExerciseCard, ModuleFilter, Pagination } from '../../components/ui'
import type { Exercise, ExerciseFilters, ExerciseModuleOption, PaginationInfo } from '../../types/dashboard-data'
import { useTranslation } from '@/i18n/useTranslation'

interface Props {
  [key: string]: unknown
  exercises: Exercise[]
  modules: ExerciseModuleOption[]
  pagination: PaginationInfo
  filters: ExerciseFilters
}

function Index() {
  const { exercises, modules, pagination, filters } = usePage<Props>().props
  const { t } = useTranslation()

  function updateFilters(next: Partial<ExerciseFilters> & { page?: number }) {
    router.get(
      '/dashboard/exercises',
      {
        category: next.category ?? filters.category,
        module: next.module ?? filters.module,
        page: next.page ?? 1,
      },
      { preserveState: true, replace: true }
    )
  }

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader eyebrow={t('exercises.index.eyebrow')} title={t('exercises.index.title')} />
          <CategoryFilter value={filters.category} onChange={(category) => updateFilters({ category })} />
        </div>
        <ModuleFilter modules={modules} value={filters.module} onChange={(module) => updateFilters({ module })} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {exercises.map((e) => (
            <ExerciseCard key={e.ref} exercise={e} />
          ))}
        </div>
        <Pagination page={pagination.page} pages={pagination.pages} onChange={(page) => updateFilters({ page })} />
      </div>
    </div>
  )
}

Index.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Index
