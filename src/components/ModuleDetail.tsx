'use client'

import { Module, Exercise } from '@/lib/contentful/modules-delivery'
import { MarkdownRenderer } from './MarkdownRenderer'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  Clock,
  BookOpen,
  PlayCircle,
  FileText,
  ChevronLeft,
  ArrowRight,
  Video,
  X,
  CheckCircle2
} from 'lucide-react'
import { LocaleLink } from './LocaleLink'
import { Card, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { useState, useTransition } from 'react'
import { cn, detectFileType, FILE_TYPES } from '@/lib/utils'
import Image from 'next/image'
import { markModuleComplete } from '@/app/[locale]/dashboard/actions'
import { useRouter } from 'next/navigation'

interface ModuleDetailProps {
  module: Module
  backHref: string
  isCompleted?: boolean
}

// Helper function to normalize URLs (convert protocol-relative to absolute)
function normalizeUrl(url: string): string {
  if (!url) return url
  if (url.startsWith('//')) {
    return `https:${url}`
  }
  return url
}

type ResourceFile = {
  url: string
  fileName: string
  contentType: string
}

export function ModuleDetail({ module, backHref, isCompleted: initialIsCompleted = false }: ModuleDetailProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'content' | 'exercises' | 'quiz' | 'resources'>('content')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [selectedResource, setSelectedResource] = useState<ResourceFile | null>(null)
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted)

  const handleMarkComplete = async () => {
    startTransition(async () => {
      try {
        await markModuleComplete(module.externalId)
        setIsCompleted(true)
        router.refresh()
      } catch (error) {
        console.error('Error marking module as complete:', error)
      }
    })
  }

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
          {isCompleted && (
            <Badge className="bg-p-green text-white border-none px-3 py-1">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
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
              
              {/* Completion Button */}
              {!isCompleted && (
                <div className="mt-8 pt-8 border-t border-p-gray/50">
                  <Button
                    onClick={handleMarkComplete}
                    disabled={isPending}
                    className="w-full bg-p-green text-white hover:bg-p-green/90 px-8 py-6 rounded-xl font-bold transition-all"
                  >
                    {isPending ? (
                      'Marking as Complete...'
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Mark Module as Complete
                      </>
                    )}
                  </Button>
                </div>
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
                    <Card
                      key={exercise.id}
                      className="border-p-gray/50 shadow-none hover:border-p-green/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedExercise(exercise)}
                    >
                      <div className="aspect-video bg-p-gray relative overflow-hidden group">
                        {mediaUrl ? (
                          <Image
                            src={mediaUrl}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                        <CardTitle className="text-base text-p-blue mb-2">{exercise.title}</CardTitle>
                        {exercise.description && (
                          <p className="text-sm text-p-blue/60 line-clamp-2">{exercise.description}</p>
                        )}
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
                Ready to test what you&apos;ve learned? Complete this quiz with at least 80% correct answers to unlock the next module.
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

              {/* Inline File Viewer */}
              {selectedResource && (() => {
                const fileType = detectFileType(selectedResource.url, selectedResource.fileName)

                return (
                  <div className="bg-white border border-p-gray/50 rounded-2xl overflow-hidden shadow-sm mb-4">
                    <div className="flex items-center justify-between p-4 border-b border-p-gray/50 bg-p-gray/30">
                      <div className="flex items-center gap-3">
                        {fileType === FILE_TYPES.VIDEO ? (
                          <Video className="h-5 w-5 text-p-blue" />
                        ) : (
                          <FileText className="h-5 w-5 text-p-blue" />
                        )}
                        <div>
                          <h4 className="text-base font-bold text-p-blue">{selectedResource.fileName}</h4>
                          <p className="text-xs text-p-blue/60">
                            {fileType === FILE_TYPES.PDF ? 'PDF Document' : fileType === FILE_TYPES.VIDEO ? 'Video File' : 'Document'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedResource(null)}
                        className="h-8 w-8 rounded-full hover:bg-p-gray text-p-blue/60 hover:text-p-blue"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="h-[70vh] bg-p-gray/20">
                      {fileType === FILE_TYPES.PDF ? (
                        <div className="w-full h-full bg-p-gray rounded-none overflow-hidden">
                          <iframe
                            src={selectedResource.url}
                            className="w-full h-full border-0"
                            title={selectedResource.fileName}
                            allow="fullscreen"
                          />
                        </div>
                      ) : fileType === FILE_TYPES.VIDEO ? (
                        <div className="w-full h-full bg-black rounded-none overflow-hidden flex items-center justify-center">
                          <video
                            src={selectedResource.url}
                            controls
                            autoPlay
                            muted
                            className="w-full h-full max-h-full object-contain"
                            controlsList="nodownload"
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-p-gray rounded-none">
                          <div className="text-center">
                            <FileText className="h-16 w-16 text-p-blue/40 mx-auto mb-4" />
                            <p className="text-p-blue/60 mb-4">Preview not available for this file type.</p>
                            <Button
                              onClick={() => window.open(selectedResource.url, '_blank')}
                              className="bg-p-blue text-white hover:bg-p-green"
                            >
                              Download File
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}

              <div className="flex flex-col gap-3">
                {module.presentation && (
                  <Button
                    onClick={() => setSelectedResource({
                      url: normalizeUrl(module.presentation!.fields.file.url),
                      fileName: module.presentation!.fields.file.fileName,
                      contentType: module.presentation!.fields.file.contentType
                    })}
                    className={cn(
                      "w-full justify-between bg-p-gray hover:bg-p-blue hover:text-white text-p-blue border-none rounded-xl py-6 transition-all",
                      selectedResource?.fileName === module.presentation.fields.file.fileName && "bg-p-blue text-white"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <span className="font-medium">Presentation PDF</span>
                    </div>
                    <ChevronLeft className="h-4 w-4 rotate-180 opacity-50" />
                  </Button>
                )}
                {module.documents?.map((doc, i) => {
                  const fileType = detectFileType(doc.fields.file.url, doc.fields.file.fileName)
                  const isSelected = selectedResource?.fileName === doc.fields.file.fileName
                  return (
                    <Button
                      key={i}
                      onClick={() => setSelectedResource({
                        url: normalizeUrl(doc.fields.file.url),
                        fileName: doc.fields.file.fileName,
                        contentType: doc.fields.file.contentType
                      })}
                      className={cn(
                        "w-full justify-between bg-p-gray hover:bg-p-blue hover:text-white text-p-blue border-none rounded-xl py-6 transition-all",
                        isSelected && "bg-p-blue text-white"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {fileType === FILE_TYPES.VIDEO ? (
                          <Video className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                        <span className="font-medium truncate max-w-[200px]">{doc.fields.file.fileName}</span>
                      </div>
                      <ChevronLeft className="h-4 w-4 rotate-180 opacity-50" />
                    </Button>
                  )
                })}
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

      {/* Exercise Detail Modal */}
      <Dialog open={!!selectedExercise} onOpenChange={(open) => {
        if (!open) {
          setSelectedExercise(null)
        }
      }}>
        <DialogContent className="w-[80%] overflow-y-auto bg-white border-p-gray/50 p-6">
          {selectedExercise ? (
            <>
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl font-bold text-p-blue mb-2">
                  {selectedExercise.title}
                </DialogTitle>
                {selectedExercise.description && (
                  <DialogDescription className="text-p-blue/70 text-base">
                    {selectedExercise.description}
                  </DialogDescription>
                )}
              </DialogHeader>
              {selectedExercise.media?.url && (
                <div className="relative w-full min-h-[60vh] bg-p-gray rounded-xl overflow-hidden flex items-center justify-center">
                  <Image
                    src={normalizeUrl(selectedExercise.media.url)}
                    alt={selectedExercise.title || 'Exercise image'}
                    fill
                    className="object-contain"
                    sizes="90vw"
                  />
                </div>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>

    </div>
  )
}
