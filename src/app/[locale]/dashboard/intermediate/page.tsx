import { getIntermediateModules } from '@/lib/contentful/modules-delivery'
import { getLocale } from 'next-intl/server'
import { ModuleCard } from '@/components/ModuleCard'
import { Trophy, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function IntermediatePage() {
  const locale = await getLocale()
  const modules = await getIntermediateModules(locale as any)

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-p-green mb-1">
            <Trophy className="h-5 w-5" />
            <span className="text-sm font-bold uppercase tracking-widest">Level 2</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-p-blue md:text-4xl">
            Methodology - Intermediate
          </h1>
          <p className="text-p-blue/60 text-lg max-w-2xl">
            Advance your game with professional techniques and complex tactics. Focus on court transitions and power shots.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="border-p-gray text-p-blue gap-2 rounded-xl h-12 px-6">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <ModuleCard 
            key={module.id} 
            module={module} 
            hrefPrefix="/dashboard/intermediate" 
          />
        ))}
      </div>

      {modules.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-p-gray text-center">
          <Trophy className="h-12 w-12 text-p-gray mb-4" />
          <h3 className="text-xl font-bold text-p-blue mb-2">No modules found</h3>
          <p className="text-p-blue/60">We couldn't find any intermediate modules at the moment. Please check back later.</p>
        </div>
      )}
    </div>
  )
}
