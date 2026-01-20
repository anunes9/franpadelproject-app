'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Dumbbell,
  Calendar as CalendarIcon,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { addPlanItem, createWeeklyPlan, removePlanItem } from '@/app/[locale]/dashboard/weekly-planning/actions'
import { Module, Exercise } from '@/lib/contentful/modules-delivery'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { getDateForDay, getPreviousWeek, getNextWeek } from '@/utils/date-helpers'

// Helper function to normalize URLs (convert protocol-relative to absolute)
function normalizeUrl(url: string): string {
  if (!url) return url
  if (url.startsWith('//')) {
    return `https:${url}`
  }
  return url
}

interface WeeklyPlanningItem {
  id: string
  item_external_id: string
  item_type: 'module' | 'exercise'
  day_of_week: number
  date?: string // YYYY-MM-DD format
  title: string
  level?: string
}

interface WeeklyPlanningCalendarProps {
  initialItems: WeeklyPlanningItem[]
  currentYear: number
  currentWeek: number
  planId?: string | null
  modules: Module[]
  exercises: Exercise[]
}

export function WeeklyPlanningCalendar({
  initialItems,
  currentYear,
  currentWeek,
  planId,
  modules,
  exercises
}: WeeklyPlanningCalendarProps) {
  const t = useTranslations('weeklyPlanning')
  const router = useRouter()
  const pathname = usePathname()
  const [items, setItems] = useState<WeeklyPlanningItem[]>(initialItems)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState<'modules' | 'exercises'>('modules')
  const [searchQuery, setSearchQuery] = useState('')

  const handlePreviousWeek = () => {
    const { year, week } = getPreviousWeek(currentYear, currentWeek)
    router.push(`${pathname}?year=${year}&week=${week}`)
  }

  const handleNextWeek = () => {
    const { year, week } = getNextWeek(currentYear, currentWeek)
    router.push(`${pathname}?year=${year}&week=${week}`)
  }

  const days = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
    { id: 7, name: 'Sunday' },
  ]

  const getItemsForDay = (dayId: number, dayDate: Date) => {
    const dateString = dayDate.toISOString().split('T')[0] // YYYY-MM-DD
    return items.filter(item => {
      // Support both date-based (new) and day_of_week-based (legacy) items
      if (item.date) {
        return item.date === dateString
      }
      // Fallback to day_of_week for legacy items
      return item.day_of_week === dayId
    })
  }

  const handleAddItemClick = async (dayId: number, dayDate: Date) => {
    setSelectedDay(dayId)
    setSelectedDate(dayDate)
    setIsModalOpen(true)
  }

  const handleSelectItem = async (item: Module | Exercise, type: 'module' | 'exercise') => {
    if (!selectedDay || !selectedDate) return

    try {
      let currentPlanId = planId

      // Create plan if it doesn't exist
      if (!currentPlanId) {
        const newPlan = await createWeeklyPlan(currentYear, currentWeek)
        currentPlanId = newPlan.id
      }

      if (!currentPlanId) {
        console.error('Failed to get or create plan')
        return
      }

      // Get the order index for the day
      const dayItems = getItemsForDay(selectedDay, selectedDate)
      const orderIndex = dayItems.length

      // Format date as YYYY-MM-DD
      const dateString = selectedDate.toISOString().split('T')[0]

      // Add the item
      await addPlanItem(currentPlanId, {
        item_external_id: item.externalId,
        item_type: type,
        date: dateString,
        day_of_week: selectedDay,
        order_index: orderIndex
      })

      // Update local state optimistically
      setItems([...items, {
        id: `temp-${Date.now()}`,
        item_external_id: item.externalId,
        item_type: type,
        day_of_week: selectedDay,
        date: dateString,
        title: item.title,
        level: type === 'module' ? (item as Module).level : undefined
      }])

      setIsModalOpen(false)
      setSelectedDay(null)
      setSelectedDate(null)
      setSearchQuery('')
      router.refresh()
    } catch (error) {
      console.error('Error adding item:', error)
    }
  }

  const handleRemoveItem = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click event

    // Check if this is a temporary ID (from optimistic update)
    // If so, just remove from local state without calling API
    if (itemId.startsWith('temp-')) {
      setItems(items.filter(item => item.id !== itemId))
      return
    }

    try {
      await removePlanItem(itemId)

      // Update local state optimistically
      setItems(items.filter(item => item.id !== itemId))

      router.refresh()
    } catch (error) {
      console.error('Error removing item:', error)
      // Even if API call fails, remove from UI to prevent confusion
      setItems(items.filter(item => item.id !== itemId))
    }
  }

  const filteredModules = modules.filter(module =>
    module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.externalId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredExercises = exercises.filter(exercise =>
    exercise.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.externalId.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-p-gray"
            onClick={handlePreviousWeek}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-p-gray"
            onClick={handleNextWeek}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {days.map((day) => {
          const dayDate = getDateForDay(currentYear, currentWeek, day.id)
          const dayItems = getItemsForDay(day.id, dayDate)
          const dayOfMonth = dayDate.getDate()
          const today = new Date()
          const isToday = dayDate.toDateString() === today.toDateString()

          return (
            <div key={day.id} className="flex flex-col gap-3">
              <div className={cn(
                "px-4 py-2 rounded-2xl text-center font-bold text-sm uppercase tracking-widest transition-all",
                isToday ? "bg-p-green text-white shadow-md shadow-p-green/20" : "bg-white text-p-blue/40 border border-p-gray/50"
              )}>
                <div className="flex flex-col gap-0.5">
                  <span>{day.name.substring(0, 3)}</span>
                  <span className={cn(
                    "text-xs font-normal normal-case tracking-normal",
                    isToday ? "text-white/90" : "text-p-blue/60"
                  )}>
                    {dayOfMonth}
                  </span>
                </div>
              </div>

              <div className={cn(
                "flex flex-col gap-2 p-2 rounded-3xl min-h-[400px] transition-all",
                isToday ? "bg-p-green-light/50 border-2 border-p-green/20" : "bg-p-gray/30 border-2 border-transparent"
              )}>
                {dayItems.map((item) => (
                  <Card key={item.id} className="border-none shadow-sm bg-white overflow-hidden group">
                    <CardHeader className="p-2 pb-1 flex flex-row items-center justify-between space-y-0 gap-2">
                      <div className={cn(
                        "p-1 rounded-md flex-shrink-0",
                        item.item_type === 'module' ? "bg-p-blue/5 text-p-blue" : "bg-p-green/10 text-p-green"
                      )}>
                        {item.item_type === 'module' ? <GraduationCap className="h-3 w-3" /> : <Dumbbell className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-p-blue leading-tight truncate">{item.title}</p>
                        {item.level && (
                          <Badge variant="secondary" className="text-[8px] px-1 py-0 bg-p-gray text-p-blue/40 border-none uppercase mt-0.5">
                            {item.level}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0 text-p-blue/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleRemoveItem(item.id, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </CardHeader>
                  </Card>
                ))}

                <Button
                  variant="ghost"
                  onClick={() => handleAddItemClick(day.id, dayDate)}
                  className="w-full py-4 border-2 border-dashed border-p-blue/10 rounded-xl text-p-blue/20 hover:text-p-green hover:border-p-green/30 hover:bg-p-green-light/30 transition-all flex flex-col gap-0.5 mt-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">{t('addItem')}</span>
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Item Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[90%] max-w-4xl h-[80vh] flex flex-col bg-white border-p-gray/50 p-0">
          <DialogHeader className="p-6 pb-4 border-b border-p-gray/50">
            <DialogTitle className="text-2xl font-bold text-p-blue">
              Add Item to {selectedDay ? days.find(d => d.id === selectedDay)?.name : ''}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Tabs */}
            <div className="flex gap-2 p-2 bg-p-gray mx-6 mt-4 rounded-2xl w-fit">
              <button
                onClick={() => setActiveTab('modules')}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                  activeTab === 'modules' ? "bg-white text-p-blue shadow-sm" : "text-p-blue/40 hover:text-p-blue/60"
                )}
              >
                Modules
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
            </div>

            {/* Search */}
            <div className="px-6 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-p-blue/40" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-p-gray/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-p-blue/20 text-p-blue"
                />
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'modules' ? (
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                  {filteredModules.map((module) => (
                    <Card
                      key={module.id}
                      className="border-p-gray/50 shadow-sm hover:border-p-blue/50 transition-colors cursor-pointer"
                      onClick={() => handleSelectItem(module, 'module')}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-p-blue/5 rounded-lg">
                            <GraduationCap className="h-5 w-5 text-p-blue" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-base text-p-blue mb-1">{module.title}</CardTitle>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="text-xs bg-p-gray text-p-blue/60 border-none">
                                {module.level}
                              </Badge>
                              {module.duration && (
                                <span className="text-xs text-p-blue/40">{module.duration}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                  {filteredModules.length === 0 && (
                    <p className="text-p-blue/40 text-sm italic col-span-2 text-center py-8">
                      No modules found matching your search.
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                  {filteredExercises.map((exercise) => {
                    const mediaUrl = exercise.media?.url ? normalizeUrl(exercise.media.url) : null
                    return (
                      <Card
                        key={exercise.id}
                        className="border-p-gray/50 shadow-sm hover:border-p-green/50 transition-colors cursor-pointer overflow-hidden"
                        onClick={() => handleSelectItem(exercise, 'exercise')}
                      >
                        {mediaUrl && (
                          <div className="aspect-video bg-p-gray relative overflow-hidden">
                            <Image
                              src={mediaUrl}
                              alt={exercise.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          </div>
                        )}
                        <CardHeader className="p-4">
                          <div className="flex items-start gap-3">
                            {!mediaUrl && (
                              <div className="p-2 bg-p-green/10 rounded-lg flex-shrink-0">
                                <Dumbbell className="h-5 w-5 text-p-green" />
                              </div>
                            )}
                            <div className="flex-1">
                              <CardTitle className="text-base text-p-blue mb-1">{exercise.title}</CardTitle>
                              {exercise.description && (
                                <p className="text-xs text-p-blue/60 line-clamp-2 mt-1">{exercise.description}</p>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    )
                  })}
                  {filteredExercises.length === 0 && (
                    <p className="text-p-blue/40 text-sm italic col-span-2 text-center py-8">
                      No exercises found matching your search.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
