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
import { Maximize2, Minimize2, X, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"

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

// Custom Toolbar Component
interface CustomToolbarProps {
  date: Date
  view: string
  views: string[]
  label: string
  onNavigate: (action: string) => void
  onView: (view: string) => void
}

const CustomToolbar = ({ date, view, views, label, onNavigate, onView }: CustomToolbarProps) => {
  const goToToday = () => {
    onNavigate('TODAY')
  }

  const goToPrev = () => {
    onNavigate('PREV')
  }

  const goToNext = () => {
    onNavigate('NEXT')
  }

  return (
    <div className="calendar-custom-toolbar">
      {/* Mobile Layout */}
      <div className="block sm:hidden space-y-3">
        {/* Header with current month/date */}
        <div className="flex items-center justify-center">
          <h2 className="text-lg font-bold text-gray-900 text-center">{label}</h2>
        </div>
        
        {/* Navigation Row */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrev}
            className="flex-1 bg-white hover:bg-gray-50 border-gray-300"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={goToToday}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4"
          >
            <CalendarIcon className="h-4 w-4 mr-1" />
            Today
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            className="flex-1 bg-white hover:bg-gray-50 border-gray-300"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        {/* View Toggle Row */}
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {views.map((viewName) => (
            <Button
              key={viewName}
              variant="ghost"
              size="sm"
              onClick={() => onView(viewName)}
              className={`flex-1 text-xs font-medium transition-all ${
                view === viewName
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {viewName.charAt(0).toUpperCase() + viewName.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-between gap-4">
        {/* Left: Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrev}
            className="bg-white hover:bg-gray-50 border-gray-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={goToToday}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Today
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            className="bg-white hover:bg-gray-50 border-gray-300"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Center: Current Month/Date */}
        <div className="flex-1 text-center">
          <h2 className="text-xl font-bold text-gray-900">{label}</h2>
        </div>

        {/* Right: View Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {views.map((viewName) => (
            <Button
              key={viewName}
              variant="ghost"
              size="sm"
              onClick={() => onView(viewName)}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                view === viewName
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {viewName.charAt(0).toUpperCase() + viewName.slice(1)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
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

  // Prevent body scroll when fullscreen is active and force re-render
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
      // Force a small delay to ensure the calendar recalculates its dimensions
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
      }, 100)
      return () => clearTimeout(timer)
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
      <div className="calendar-fullscreen fixed inset-0 z-40 bg-gray-50 flex flex-col">
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
        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          {/* Debug info to verify events are loaded */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 mb-2">
              Events loaded: {calendarEvents.length} | Handlers: enabled
            </div>
          )}
          
          <div className="flex-1 min-h-0">
            <Calendar
              key={`fullscreen-${isFullscreen}`}
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              date={currentDate}
              view={currentView}
              onView={(view: "month" | "week" | "day") => setCurrentView(view)}
              onNavigate={(newDate: Date) => setCurrentDate(newDate)}
              style={{ 
                height: "100%",
                minHeight: "500px"
              }}
              onSelectEvent={(event: any) => {
                console.log('Fullscreen event clicked:', event.title) // Debug log
                handleSelectEvent(event)
              }}
              onSelectSlot={(slotInfo: any) => {
                console.log('Fullscreen slot clicked:', slotInfo.start) // Debug log
                handleSelectSlot(slotInfo)
              }}
              selectable
              views={["month", "week", "day"]}
              eventPropGetter={(event: any) => {
                return {
                  style: {
                    ...event.style,
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    cursor: 'pointer',
                    zIndex: 1,
                  }
                }
              }}
              components={{
                toolbar: CustomToolbar,
              }}
              formats={{
                eventTimeRangeFormat: () => '',
                timeGutterFormat: 'HH:mm',
              }}
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
        {/* Fullscreen Toggle Button - Mobile Only */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsFullscreen(true)}
          className="md:hidden absolute top-2 right-2 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white shadow-sm"
        >
          <Maximize2 className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Full</span>
        </Button>

        <div className="h-[500px] sm:h-[600px] bg-white rounded-lg shadow p-2 sm:p-4">
          {/* Debug info for regular calendar */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 mb-2">
              Regular calendar events: {calendarEvents.length}
            </div>
          )}
          
          <Calendar
            key={`regular-${isFullscreen}`}
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            date={currentDate}
            view={currentView}
            onView={(view: "month" | "week" | "day") => setCurrentView(view)}
            onNavigate={(newDate: Date) => setCurrentDate(newDate)}
            style={{ height: "calc(100% - 20px)" }}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            views={["month", "week", "day"]}
            eventPropGetter={(event: any) => {
              console.log('Regular event:', event.title, event.start) // Debug log
              return {
                style: event.style,
              }
            }}
            components={{
              toolbar: CustomToolbar,
            }}
          />
        </div>
      </div>
    </div>
  )
}
