'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Clock, GripVertical } from 'lucide-react'
import { WeeklyPlanModule } from '@/app/dashboard/weekly-planning/actions'

interface DayCardProps {
  dayName: string
  date: string
  dayOfWeek: number
  modules: WeeklyPlanModule[]
  onAddModule: () => void
  onRemoveModule: (moduleId: string) => void
  isToday?: boolean
}

export function DayCard({
  dayName,
  date,
  dayOfWeek,
  modules,
  onAddModule,
  onRemoveModule,
  isToday = false,
}: DayCardProps) {
  return (
    <Card className={`h-full flex flex-col ${isToday ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-sm font-semibold">{dayName}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
          </div>
          {isToday && (
            <Badge variant="default" className="text-xs">
              Hoje
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-2">
        {/* Module list */}
        {modules.length > 0 ? (
          <div className="space-y-2 flex-1">
            {modules.map((planModule) => (
              <div
                key={planModule.id}
                className="border rounded-lg p-3 bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                  <div className="flex-1 min-w-0">
                    {planModule.module ? (
                      <>
                        <h4 className="text-sm font-medium line-clamp-2 mb-1">{planModule.module.title}</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              planModule.module.level === 'Beginner'
                                ? 'bg-primary/10 text-primary border-primary'
                                : 'bg-orange-500/10 text-orange-600 border-orange-500'
                            }`}
                          >
                            {planModule.module.level}
                          </Badge>
                          {planModule.module.duration && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {planModule.module.duration}
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
                    onClick={() => onRemoveModule(planModule.id)}
                    className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-muted-foreground text-center">Sem módulos agendados</p>
          </div>
        )}

        {/* Add button */}
        <Button variant="outline" size="sm" onClick={onAddModule} className="w-full mt-2">
          <Plus className="h-4 w-4" />
          Adicionar Módulo
        </Button>
      </CardContent>
    </Card>
  )
}
