'use client'

import { useState, useEffect } from 'react'
import { Module } from '@/lib/contentful/modules-delivery'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Clock } from 'lucide-react'

interface ModuleSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectModule: (moduleExternalId: string) => void
  availableModules: Module[]
}

export function ModuleSelector({ isOpen, onClose, onSelectModule, availableModules }: ModuleSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredModules, setFilteredModules] = useState<Module[]>(availableModules)
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)

  useEffect(() => {
    let filtered = availableModules

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (module) =>
          module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          module.topics.some((topic) => topic.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by level
    if (selectedLevel) {
      filtered = filtered.filter((module) => module.level === selectedLevel)
    }

    setFilteredModules(filtered)
  }, [searchTerm, selectedLevel, availableModules])

  const handleSelectModule = (moduleExternalId: string) => {
    onSelectModule(moduleExternalId)
    setSearchTerm('')
    setSelectedLevel(null)
    onClose()
  }

  const levels = Array.from(new Set(availableModules.map((m) => m.level)))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar Módulo</DialogTitle>
          <DialogDescription>Selecione um módulo para adicionar ao seu planeamento</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search and filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar módulos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedLevel === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedLevel(null)}
              >
                Todos
              </Button>
              {levels.map((level) => (
                <Button
                  key={level}
                  variant={selectedLevel === level ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLevel(level)}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>

          {/* Module list */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {filteredModules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nenhum módulo encontrado</div>
            ) : (
              filteredModules.map((module) => (
                <div key={module.id} className="border rounded-lg p-4 hover:border-primary transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{module.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{module.description}</p>
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
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {module.duration}
                          </div>
                        )}
                      </div>
                      {module.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {module.topics.slice(0, 3).map((topic, idx) => (
                            <span key={idx} className="text-xs bg-muted px-2 py-0.5 rounded">
                              {topic}
                            </span>
                          ))}
                          {module.topics.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{module.topics.length - 3} mais</span>
                          )}
                        </div>
                      )}
                    </div>
                    <Button size="sm" onClick={() => handleSelectModule(module.externalId)} className="ml-4">
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
