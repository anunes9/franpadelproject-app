"use client"

import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react"
import { useState } from "react"
import { MesoProps } from "@/lib/types"
import { SelectMesocycle } from "./SelectMesocycle"

export function Calendar({
  initialMesocycles,
}: {
  initialMesocycles: MesoProps[]
}) {
  const [view, setView] = useState<"week" | "month">("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [mesocyclesByDate, setMesocyclesByDate] = useState<
    Record<string, MesoProps>
  >({})
  const today = new Date()

  // Adjust day number to handle Monday as first day (0 = Monday, 6 = Sunday)
  const adjustDayNumber = (day: number) => (day === 0 ? 6 : day - 1)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = adjustDayNumber(new Date(year, month, 1).getDay())

    const days = []
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null)
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const getWeekDays = (date: Date) => {
    const days = []
    const currentDay = adjustDayNumber(date.getDay())
    const firstDayOfWeek = new Date(date)
    firstDayOfWeek.setDate(date.getDate() - currentDay)

    for (let i = 0; i < 7; i++) {
      const day = new Date(firstDayOfWeek)
      day.setDate(firstDayOfWeek.getDate() + i)
      days.push(day)
    }
    return days
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (direction === "prev") {
      newDate.setMonth(currentDate.getMonth() - 1)
    } else {
      newDate.setMonth(currentDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (direction === "prev") {
      newDate.setDate(currentDate.getDate() - 7)
    } else {
      newDate.setDate(currentDate.getDate() + 7)
    }
    setCurrentDate(newDate)
  }

  const isToday = (date: Date) => {
    return date?.toDateString() === today.toDateString()
  }

  const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <IconCalendar width={32} height={32} stroke={1.5} />
        <h1 className="text-4xl font-bold underline">Calendário</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        {/* Calendar Controls */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("month")}
              className={`px-4 py-2 rounded-lg ${
                view === "month"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setView("week")}
              className={`px-4 py-2 rounded-lg ${
                view === "week"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Semana
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Hoje
            </button>
            <button
              onClick={() =>
                view === "month" ? navigateMonth("prev") : navigateWeek("prev")
              }
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <IconChevronLeft size={20} />
            </button>
            <span className="font-semibold">
              {currentDate.toLocaleDateString("pt-PT", {
                month: "long",
                year: "numeric",
                ...(view === "week" && { day: "numeric" }),
              })}
            </span>
            <button
              onClick={() =>
                view === "month" ? navigateMonth("next") : navigateWeek("next")
              }
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <IconChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Weekday Headers */}
          {weekDays.map((day) => (
            <div key={day} className="text-center font-semibold py-2">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          <>
            {view === "month"
              ? // Month View
                getDaysInMonth(currentDate).map((date, index) => (
                  <div
                    key={index}
                    onClick={() => date && setSelectedDate(date)}
                    className={`
                      aspect-square p-2 border rounded-lg
                      ${date ? "hover:bg-gray-50 cursor-pointer" : "bg-gray-50"}
                      ${isToday(date as Date) ? "bg-blue-50 font-bold" : ""}
                      ${
                        date &&
                        selectedDate?.toDateString() === date.toDateString()
                          ? "ring-2 ring-blue-500"
                          : ""
                      }
                    `}
                  >
                    <div className="font-medium">{date?.getDate()}</div>
                    {date && mesocyclesByDate[date.toDateString()] && (
                      <div className="mt-1 text-xs text-gray-600 truncate">
                        {mesocyclesByDate[date.toDateString()].title}
                      </div>
                    )}
                  </div>
                ))
              : // Week View
                getWeekDays(currentDate).map((date, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      min-h-[120px] p-2 border rounded-lg
                      hover:bg-gray-50 cursor-pointer
                      ${isToday(date) ? "bg-blue-50" : ""}
                      ${
                        selectedDate?.toDateString() === date.toDateString()
                          ? "ring-2 ring-blue-500"
                          : ""
                      }
                    `}
                  >
                    <div
                      className={`font-semibold ${
                        isToday(date) ? "text-blue-600" : ""
                      }`}
                    >
                      {date.getDate()}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {isToday(date) && "Hoje"}
                      {mesocyclesByDate[date.toDateString()]?.title}
                    </div>
                  </div>
                ))}
          </>

          {/* Mesocycle Selection Dialog */}
          {selectedDate && (
            <SelectMesocycle
              selectedDate={selectedDate}
              mesocycles={initialMesocycles}
              onSelect={(mesocycle) => {
                setMesocyclesByDate((prev) => ({
                  ...prev,
                  [selectedDate.toDateString()]: mesocycle,
                }))
                setSelectedDate(null)
              }}
              onRemove={() => {
                const newMesocycles = { ...mesocyclesByDate }
                delete newMesocycles[selectedDate.toDateString()]
                setMesocyclesByDate(newMesocycles)
                setSelectedDate(null)
              }}
              onClose={() => setSelectedDate(null)}
              hasSelection={!!mesocyclesByDate[selectedDate.toDateString()]}
            />
          )}
        </div>
      </div>
    </div>
  )
}
