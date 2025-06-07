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
import { useState } from "react"

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

      return {
        id: scheduled.id,
        title: gymClass.name,
        start,
        end,
        resource: { gymClass, scheduled },
        style: {
          backgroundColor: gymClass.color,
          borderColor: gymClass.color,
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

  return (
    <div className="space-y-4">
      <ClassDropZone classes={classes} onScheduleClass={onScheduleClass} />

      <div className="h-[600px] bg-white rounded-lg shadow p-4">
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
  )
}
