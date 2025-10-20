'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Clock, GripVertical, BookOpen, Dumbbell, Image as ImageIcon } from 'lucide-react'
import { WeeklyPlanItem } from '@/app/dashboard/weekly-planning/actions'
import Link from 'next/link'

interface DayCardProps {
  dayName: string
  date: string
  dayOfWeek: number
  year: number
  week: number
  items: WeeklyPlanItem[]
  onAddItem: () => void
  onRemoveItem: (itemId: string) => void
  isToday?: boolean
}

export function DayCard({
  dayName,
  date,
  dayOfWeek,
  year,
  week,
  items,
  onAddItem,
  onRemoveItem,
  isToday = false,
}: DayCardProps) {
  // Group items by type
  const modules = items.filter((item) => item.item_type === 'module')
  const exercises = items.filter((item) => item.item_type === 'exercise')

  const detailUrl = `/dashboard/weekly-planning/${year}/${week}/${dayOfWeek}`

  return (
    <Card
      className={`h-full flex flex-col ${
        isToday ? 'ring-2 ring-primary' : ''
      } hover:shadow-lg transition-all cursor-pointer group`}
    >
      <Link href={detailUrl} className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-sm font-semibold group-hover:text-primary transition-colors">
                {dayName}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
            </div>
            {isToday && (
              <Badge variant="default" className="text-xs">
                Hoje
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-3 pointer-events-none">
          {/* Modules Section */}
          {modules.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Módulos</h5>
              </div>
              {modules.map((planItem) => (
                <div
                  key={planItem.id}
                  className="border rounded-lg p-2.5 bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                    <div className="flex-1 min-w-0">
                      {planItem.module ? (
                        <>
                          <h4 className="text-sm font-medium line-clamp-2 mb-1">{planItem.module.title}</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                planItem.module.level === 'Beginner'
                                  ? 'bg-primary/10 text-primary border-primary'
                                  : 'bg-orange-500/10 text-orange-600 border-orange-500'
                              }`}
                            >
                              {planItem.module.level}
                            </Badge>
                            {planItem.module.duration && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {planItem.module.duration}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Módulo não encontrado</p>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemoveItem(planItem.id)}
                      className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Exercises Section */}
          {exercises.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 mb-2">
                <Dumbbell className="h-3.5 w-3.5 text-muted-foreground" />
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Exercícios</h5>
              </div>
              {exercises.map((planItem) => (
                <div
                  key={planItem.id}
                  className="border rounded-lg p-2.5 bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                    <div className="flex-1 min-w-0">
                      {planItem.exercise ? (
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium line-clamp-2">{planItem.exercise.title}</h4>
                          {planItem.exercise.media && (
                            <ImageIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Exercício não encontrado</p>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemoveItem(planItem.id)}
                      className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {modules.length === 0 && exercises.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-8">
              <p className="text-xs text-muted-foreground text-center">Nenhum item agendado</p>
            </div>
          )}
        </CardContent>
      </Link>

      {/* Add button - outside Link to remain interactive */}
      <div className="px-4 pb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onAddItem()
          }}
          className="w-full pointer-events-auto"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>
    </Card>
  )
}
