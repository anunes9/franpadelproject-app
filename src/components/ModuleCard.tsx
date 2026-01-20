'use client'

import { Module } from '@/lib/contentful/modules-delivery'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, ChevronRight } from 'lucide-react'
import { LocaleLink } from './LocaleLink'
import { useTranslations } from 'next-intl'

interface ModuleCardProps {
  module: Module
  hrefPrefix: string
}

export function ModuleCard({ module, hrefPrefix }: ModuleCardProps) {
  const t = useTranslations('common')

  return (
    <Card className="flex flex-col h-full border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all p-0 gap-2">
        {/* Placeholder for module image/video teaser */}
      {/* <div className="relative aspect-video bg-p-blue flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-p-blue to-slate-800" />
        <PlayCircle className="h-12 w-12 text-p-green/40 group-hover:text-p-green transition-colors relative z-10" />

        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-white/10 text-white border-none backdrop-blur-md">
            {module.level}
          </Badge>
          <Badge className="bg-p-green text-white border-none">
            {module.duration}
          </Badge>
        </div>
      </div> */}

      <div className="h-8 bg-p-blue" />

      <CardHeader className="p-5 pb-2">
        <div className="flex items-center gap-1 text-p-blue/40 text-[10px] font-bold uppercase tracking-widest mb-1">
          <BookOpen className="h-3 w-3" />
          <span>Module {module.externalId}</span>
        </div>
        <CardTitle className="text-lg text-p-blue leading-tight line-clamp-2">
          {module.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-5 pt-0 flex-1">
        <p className="text-sm text-p-blue/60 line-clamp-3 mb-4">
          {module.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {module.topics?.slice(0, 3).map((topic, i) => (
            <span key={i} className="text-[10px] font-semibold text-p-blue/40 bg-p-gray px-2 py-0.5 rounded-full uppercase">
              {topic}
            </span>
          ))}
          {module.topics && module.topics.length > 3 && (
            <span className="text-[10px] font-semibold text-p-blue/40 bg-p-gray px-2 py-0.5 rounded-full uppercase">
              +{module.topics.length - 3}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <LocaleLink href={`${hrefPrefix}/${module.externalId}`} className="w-full cursor-pointer">
          <Button variant="ghost" className="w-full justify-between px-4 py-6 rounded-xl bg-p-gray text-p-blue hover:bg-p-blue hover:text-white transition-all group-hover:bg-p-blue group-hover:text-white">
            <span className="font-bold">{t('viewMore')}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </LocaleLink>
      </CardFooter>
    </Card>
  )
}
