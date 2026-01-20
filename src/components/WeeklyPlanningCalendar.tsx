'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  GraduationCap, 
  Dumbbell,
  Calendar as CalendarIcon,
  MoreVertical
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface WeeklyPlanningItem {
  id: string
  item_external_id: string
  item_type: 'module' | 'exercise'
  day_of_week: number
  title: string
  level?: string
}

interface WeeklyPlanningCalendarProps {
  initialItems: WeeklyPlanningItem[]
  currentYear: number
  currentWeek: number
}

export function WeeklyPlanningCalendar({ 
  initialItems, 
  currentYear, 
  currentWeek 
}: WeeklyPlanningCalendarProps) {
  const t = useTranslations('weeklyPlanning')
  const [items, setItems] = useState<WeeklyPlanningItem[]>(initialItems)
  const days = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
    { id: 7, name: 'Sunday' },
  ]

  const getItemsForDay = (dayId: number) => {
    return items.filter(item => item.day_of_week === dayId)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-p-gray/50">
        <div className="flex items-center gap-4">
          <div className="bg-p-blue text-white p-3 rounded-2xl">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-p-blue">Week {currentWeek}, {currentYear}</h2>
            <p className="text-sm text-p-blue/60">Manage your training schedule</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-p-gray">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-p-gray">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {days.map((day) => {
          const dayItems = getItemsForDay(day.id)
          const isToday = new Date().getDay() === (day.id === 7 ? 0 : day.id)

          return (
            <div key={day.id} className="flex flex-col gap-3">
              <div className={cn(
                "px-4 py-2 rounded-2xl text-center font-bold text-sm uppercase tracking-widest transition-all",
                isToday ? "bg-p-green text-white shadow-md shadow-p-green/20" : "bg-white text-p-blue/40 border border-p-gray/50"
              )}>
                {day.name.substring(0, 3)}
              </div>
              
              <div className={cn(
                "flex flex-col gap-3 p-2 rounded-3xl min-h-[400px] transition-all",
                isToday ? "bg-p-green-light/50 border-2 border-p-green/20" : "bg-p-gray/30 border-2 border-transparent"
              )}>
                {dayItems.map((item) => (
                  <Card key={item.id} className="border-none shadow-sm bg-white overflow-hidden group">
                    <CardHeader className="p-3 pb-1 flex flex-row items-start justify-between space-y-0">
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        item.item_type === 'module' ? "bg-p-blue/5 text-p-blue" : "bg-p-green/10 text-p-green"
                      )}>
                        {item.item_type === 'module' ? <GraduationCap className="h-4 w-4" /> : <Dumbbell className="h-4 w-4" />}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-p-blue/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-xs font-bold text-p-blue leading-tight mb-2">{item.title}</p>
                      {item.level && (
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-p-gray text-p-blue/40 border-none uppercase">
                          {item.level}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}

                <Button 
                  variant="ghost" 
                  className="w-full py-8 border-2 border-dashed border-p-blue/10 rounded-2xl text-p-blue/20 hover:text-p-green hover:border-p-green/30 hover:bg-p-green-light/30 transition-all flex flex-col gap-1 mt-auto"
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t('addItem')}</span>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
