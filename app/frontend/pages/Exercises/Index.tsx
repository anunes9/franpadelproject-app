import { useState } from 'react'
import type { ReactNode } from 'react'
import { usePage } from '@inertiajs/react'
import { CategoryFilter, ExerciseCard } from '../../components/ui'
import { AppShell, PageHeader } from '../../components/shell'
import type { Exercise } from '../../types/dashboard-data'

interface Props {
  exercises: Exercise[]
}

function Index() {
  const { exercises } = usePage<Props>().props
  const [category, setCategory] = useState('All')
  const list = category === 'All' ? exercises : exercises.filter((e) => e.category === category)

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader eyebrow="Library" title="Exercises" />
          <CategoryFilter value={category} onChange={setCategory} />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {list.map((e) => (
            <ExerciseCard key={e.ref} exercise={e} />
          ))}
        </div>
      </div>
    </div>
  )
}

Index.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Index
