'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Clock, FileText, Download } from 'lucide-react'
import { Module } from '@/lib/contentful/modules-delivery'

interface ModuleDetailCardProps {
  module: Module
  onRemove: () => void
}

export function ModuleDetailCard({ module, onRemove }: ModuleDetailCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{module.title}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={
                  module.level === 'Beginner'
                    ? 'bg-primary/10 text-primary border-primary'
                    : 'bg-orange-500/10 text-orange-600 border-orange-500'
                }
              >
                {module.level}
              </Badge>
              {module.duration && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {module.duration}
                </div>
              )}
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={onRemove} className="flex-shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {module.description && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Descrição</h4>
            <p className="text-sm text-muted-foreground">{module.description}</p>
          </div>
        )}

        {/* Topics */}
        {module.topics && module.topics.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Tópicos</h4>
            <div className="flex flex-wrap gap-2">
              {module.topics.map((topic, idx) => (
                <span key={idx} className="text-xs bg-muted px-3 py-1 rounded-full">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Presentation */}
        {module.presentation && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Apresentação</h4>
            <a
              href={`https:${module.presentation.fields.file.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <FileText className="h-4 w-4" />
              {module.presentation.fields.file.fileName}
              <Download className="h-4 w-4" />
            </a>
          </div>
        )}

        {/* Documents */}
        {module.documents && module.documents.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Documentos</h4>
            <div className="space-y-2">
              {module.documents.map((doc, idx) => (
                <a
                  key={idx}
                  href={`https:${doc.fields.file.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  {doc.fields.file.fileName}
                  <Download className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
