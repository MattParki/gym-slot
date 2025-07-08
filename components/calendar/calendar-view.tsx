"use client"
import { Calendar } from "react-big-calendar"
import dateFnsLocalizer from "react-big-calendar/lib/localizers/date-fns"
import { format } from "date-fns/format"
import { parse } from "date-fns/parse"
import { startOfWeek } from "date-fns/startOfWeek"
import { getDay } from "date-fns/getDay"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { ClassDropZone } from "./class-drop-zone"
import type { GymClass, ScheduledClass } from "./gym-booking-system"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2, X } from "lucide-react"

const locales = {
  "en-US": require("date-fns/locale/en-US"),
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface CalendarViewProps {
  classes: GymClass[]
  scheduledClasses: ScheduledClass[]
  onScheduleClass: (classId: string, date: Date, startTime: string) => void
  onDateClick: (date: Date) => void
  onClassClick: (gymClass: GymClass, scheduled: ScheduledClass) => void
}

export function CalendarView({
  classes,
  scheduledClasses,
  onScheduleClass,
  onDateClick,
  onClassClick,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<"month" | "week" | "day">("month")
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isFullscreen])

  // Prevent body scroll when fullscreen is active
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isFullscreen])

  const calendarEvents = scheduledClasses
    .map((scheduled) => {
      const gymClass = classes.find((cls) => cls.id === scheduled.classId)
      if (!gymClass || !scheduled.startTime || !scheduled.endTime) return null

      const eventDate = new Date(scheduled.date)
      const [startHours, startMinutes] = scheduled.startTime.split(":").map(Number)
      const [endHours, endMinutes] = scheduled.endTime.split(":").map(Number)

      const start = new Date(eventDate)
      start.setHours(startHours, startMinutes)

      const end = new Date(eventDate)
      end.setHours(endHours, endMinutes)

      const isCancelled = scheduled.status === "cancelled"

      return {
        id: scheduled.id,
        title: isCancelled ? `🚫 ${gymClass.name} - CANCELLED` : gymClass.name,
        start,
        end,
        resource: { gymClass, scheduled },
        style: {
          backgroundColor: isCancelled ? "#ef4444" : gymClass.color,
          borderColor: isCancelled ? "#dc2626" : gymClass.color,
          color: isCancelled ? "#ffffff" : "#ffffff",
          textDecoration: isCancelled ? "line-through" : "none",
          opacity: isCancelled ? 0.8 : 1,
        },
      }
    })
    .filter(Boolean)

  const handleSelectEvent = (event: any) => {
    const { gymClass, scheduled } = event.resource
    onClassClick(gymClass, scheduled)
  }

  const handleSelectSlot = ({ start }: { start: Date }) => {
    onDateClick(start)
  }

  if (isFullscreen) {
    return (
      <div className="calendar-fullscreen fixed inset-0 z-50 bg-gray-50 flex flex-col">
        {/* Fullscreen Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white/95 backdrop-blur-sm shadow-sm flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            📅 <span>Calendar</span>
          </h2>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <Minimize2 className="h-4 w-4" />
              <span className="hidden sm:inline">Exit</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsFullscreen(false)}
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Fullscreen Calendar */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full">
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              date={currentDate}
              view={currentView}
              onView={(view: "month" | "week" | "day") => setCurrentView(view)}
              onNavigate={(newDate: Date) => setCurrentDate(newDate)}
              style={{ height: "100%" }}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              views={["month", "week", "day"]}
              eventPropGetter={(event: any) => ({
                style: event.style,
              })}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ClassDropZone classes={classes} onScheduleClass={onScheduleClass} />

      <div className="relative">
        {/* Fullscreen Toggle Button */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsFullscreen(true)}
          className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white"
        >
          <Maximize2 className="h-4 w-4" />
          <span className="hidden sm:inline">Fullscreen</span>
        </Button>

        <div className="h-[500px] sm:h-[600px] bg-white rounded-lg shadow p-2 sm:p-4">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            date={currentDate}
            view={currentView}
            onView={(view: "month" | "week" | "day") => setCurrentView(view)}
            onNavigate={(newDate: Date) => setCurrentDate(newDate)}
            style={{ height: "100%" }}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            views={["month", "week", "day"]}
            eventPropGetter={(event: any) => ({
              style: event.style,
            })}
          />
        </div>
      </div>
    </div>
  )
}
