'use client'

import { useState, useEffect } from 'react'
import { Module } from '@/lib/contentful/modules-delivery'
import { Exercise } from '@/lib/contentful/exercises-delivery'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Clock, BookOpen, Dumbbell, Image as ImageIcon } from 'lucide-react'

interface ItemSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectItem: (itemExternalId: string, itemType: 'module' | 'exercise') => void
  availableModules: Module[]
  availableExercises: Exercise[]
}

export function ItemSelector({
  isOpen,
  onClose,
  onSelectItem,
  availableModules,
  availableExercises,
}: ItemSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState<'modules' | 'exercises'>('modules')
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [filteredModules, setFilteredModules] = useState<Module[]>(availableModules)
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>(availableExercises)

  useEffect(() => {
    if (selectedTab === 'modules') {
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
    } else {
      let filtered = availableExercises

      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter(
          (exercise) =>
            exercise.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (exercise.description && exercise.description.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      }

      setFilteredExercises(filtered)
    }
  }, [searchTerm, selectedTab, selectedLevel, availableModules, availableExercises])

  const handleSelectItem = (itemExternalId: string, itemType: 'module' | 'exercise') => {
    onSelectItem(itemExternalId, itemType)
    setSearchTerm('')
    setSelectedLevel(null)
    setSelectedTab('modules')
    onClose()
  }

  const levels = Array.from(new Set(availableModules.map((m) => m.level)))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar ao Planeamento</DialogTitle>
          <DialogDescription>Selecione um módulo ou exercício para adicionar</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <Button
              variant={selectedTab === 'modules' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('modules')}
              className="rounded-b-none"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Módulos
            </Button>
            <Button
              variant={selectedTab === 'exercises' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('exercises')}
              className="rounded-b-none"
            >
              <Dumbbell className="h-4 w-4 mr-2" />
              Exercícios
            </Button>
          </div>

          {/* Search and filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={selectedTab === 'modules' ? 'Pesquisar módulos...' : 'Pesquisar exercícios...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {selectedTab === 'modules' && (
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
            )}
          </div>

          {/* Item list */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {selectedTab === 'modules' ? (
              filteredModules.length === 0 ? (
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
                      <Button size="sm" onClick={() => handleSelectItem(module.externalId, 'module')} className="ml-4">
                        <Plus className="h-4 w-4" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                ))
              )
            ) : filteredExercises.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nenhum exercício encontrado</div>
            ) : (
              filteredExercises.map((exercise) => (
                <div key={exercise.id} className="border rounded-lg p-4 hover:border-primary transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{exercise.title}</h3>
                        {exercise.media && (
                          <Badge variant="outline" className="text-xs">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            Média
                          </Badge>
                        )}
                      </div>
                      {exercise.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{exercise.description}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSelectItem(exercise.externalId, 'exercise')}
                      className="ml-4"
                    >
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
