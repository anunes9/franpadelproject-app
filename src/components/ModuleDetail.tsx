'use client'

import { Module } from '@/lib/contentful/modules-delivery'
import { MarkdownRenderer } from './MarkdownRenderer'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  Clock,
  BookOpen,
  PlayCircle,
  FileText,
  ChevronLeft,
  ArrowRight
} from 'lucide-react'
import { LocaleLink } from './LocaleLink'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface ModuleDetailProps {
  module: Module
  backHref: string
}

// Helper function to normalize URLs (convert protocol-relative to absolute)
function normalizeUrl(url: string): string {
  if (!url) return url
  if (url.startsWith('//')) {
    return `https:${url}`
  }
  return url
}

export function ModuleDetail({ module, backHref }: ModuleDetailProps) {
  const t = useTranslations('common')
  const [activeTab, setActiveTab] = useState<'content' | 'exercises' | 'quiz' | 'resources'>('content')

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-row justify-between gap-4">
        <div className="flex items-center gap-4">
          <LocaleLink href={backHref}>
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm text-p-blue">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </LocaleLink>
          <div className="flex flex-col flex-1">
            <span className="text-xs font-bold text-p-blue/40 uppercase tracking-widest">
              Module {module.externalId} • {module.level}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-p-blue">{module.title}</h1>
          </div>
        </div>

        {/* Module Details */}
        <div className="flex flex-col flex-wrap items-end gap-2">
          {module.duration && (
            <div className="flex items-center gap-2 text-p-blue/70">
              <Clock className="h-4 w-4 text-p-blue/50" />
              <span className="text-sm font-medium">{module.duration}</span>
            </div>
          )}
          {module.topics && module.topics.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-p-blue/40 uppercase tracking-widest">Topics:</span>
              <div className="flex flex-wrap gap-2">
                {module.topics.map((topic, i) => (
                  <Badge key={i} variant="secondary" className="bg-gray-200 text-p-blue/70 border-none px-2 py-1 text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Main Content Area */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-p-gray/50">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-p-gray rounded-2xl mb-8 w-fit flex-wrap">
            <button
              onClick={() => setActiveTab('content')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === 'content' ? "bg-white text-p-blue shadow-sm" : "text-p-blue/40 hover:text-p-blue/60"
              )}
            >
              Content
            </button>
            <button
              onClick={() => setActiveTab('exercises')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === 'exercises' ? "bg-white text-p-blue shadow-sm" : "text-p-blue/40 hover:text-p-blue/60"
              )}
            >
              Exercises
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === 'quiz' ? "bg-white text-p-blue shadow-sm" : "text-p-blue/40 hover:text-p-blue/60"
              )}
            >
              Quiz
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === 'resources' ? "bg-white text-p-blue shadow-sm" : "text-p-blue/40 hover:text-p-blue/60"
              )}
            >
              Resources
            </button>
          </div>

          {activeTab === 'content' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8">
              {module.content && (
                <div>
                  <MarkdownRenderer content={module.content} />
                </div>
              )}
              {module.technicalContent && (
                <div className="mt-12 p-6 md:p-8 bg-p-green-light rounded-3xl border border-p-green/20">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-p-green/10 rounded-xl">
                      <FileText className="h-5 w-5 text-p-green" />
                    </div>
                    <h3 className="text-p-green font-bold uppercase tracking-widest text-sm">
                      Technical Deep Dive
                    </h3>
                  </div>

                  <div>
                    <MarkdownRenderer content={module.technicalContent} />
                  </div>
                </div>
              )}
              {!module.content && !module.technicalContent && (
                <p className="text-p-blue/40 text-sm italic text-center py-12">No content available for this module.</p>
              )}
            </div>
          )}

          {activeTab === 'exercises' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col gap-6">
              <h3 className="text-xl font-bold text-p-blue mb-2">Linked Exercises</h3>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {module.exercises?.map((exercise) => {
                  const mediaUrl = exercise.media?.url ? normalizeUrl(exercise.media.url) : null

                  return (
                    <Card key={exercise.id} className="border-p-gray/50 shadow-none hover:border-p-green/50 transition-colors">
                      <div className="aspect-video bg-p-gray relative overflow-hidden group">
                        {mediaUrl ? (
                          <Image
                            src={mediaUrl}
                            className="w-full h-full object-cover"
                            width={400}
                            height={225}
                            alt={exercise.title || 'Exercise image'}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <PlayCircle className="h-10 w-10 text-p-blue/20 group-hover:text-p-green transition-colors" />
                          </div>
                        )}
                      </div>
                      <CardHeader className="p-4">
                        <CardTitle className="text-base text-p-blue">{exercise.title}</CardTitle>
                      </CardHeader>
                    </Card>
                  )
                })}
                {(!module.exercises || module.exercises.length === 0) && (
                  <p className="text-p-blue/40 text-sm italic">No exercises linked to this module.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 text-center py-12">
              <div className="bg-p-blue/5 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-10 w-10 text-p-blue" />
              </div>
              <h3 className="text-xl font-bold text-p-blue mb-2">Knowledge Assessment</h3>
              <p className="text-p-blue/60 max-w-md mx-auto mb-8">
                Ready to test what you've learned? Complete this quiz with at least 80% correct answers to unlock the next module.
              </p>
              <Button className="bg-p-blue text-white hover:bg-p-green px-8 py-6 rounded-xl font-bold transition-all">
                Start Quiz
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col gap-6">
              <h3 className="text-xl font-bold text-p-blue mb-2">Module Resources</h3>
              <div className="flex flex-col gap-3">
                {module.presentation && (
                  <Button className="w-full justify-between bg-p-gray hover:bg-p-blue hover:text-white text-p-blue border-none rounded-xl py-6 transition-all">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <span className="font-medium">Presentation PDF</span>
                    </div>
                    <ChevronLeft className="h-4 w-4 rotate-180 opacity-50" />
                  </Button>
                )}
                {module.documents?.map((doc, i) => (
                  <Button key={i} className="w-full justify-between bg-p-gray hover:bg-p-blue hover:text-white text-p-blue border-none rounded-xl py-6 transition-all">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <span className="font-medium truncate max-w-[200px]">{doc.fields.file.fileName}</span>
                    </div>
                    <ChevronLeft className="h-4 w-4 rotate-180 opacity-50" />
                  </Button>
                ))}
                {(!module.presentation && (!module.documents || module.documents.length === 0)) && (
                  <div className="text-center py-12">
                    <div className="bg-p-gray/50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-p-blue/40" />
                    </div>
                    <p className="text-p-blue/40 text-sm italic">No additional resources available for this module.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
