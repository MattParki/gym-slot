"use client"

import { useState } from "react"
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import { format } from "date-fns/format"
import { parse } from "date-fns/parse"
import { startOfWeek } from "date-fns/startOfWeek"
import { getDay } from "date-fns/getDay"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { EventModal } from "./event-modal"
import { DeleteEventDialog } from "./delete-event-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

// Setup the localizer for the calendar
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

// Define the event type
export type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  description?: string
  resourceId?: string
}

// Sample initial events
const initialEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Yoga Class",
    start: new Date(new Date().setHours(10, 0, 0)),
    end: new Date(new Date().setHours(11, 0, 0)),
    description: "Beginner friendly yoga session",
    resourceId: "yoga-room",
  },
  {
    id: "2",
    title: "Weight Training",
    start: new Date(new Date().setHours(14, 0, 0)),
    end: new Date(new Date().setHours(15, 30, 0)),
    description: "Strength building session",
    resourceId: "weights-area",
  },
]

export function CalendarBooking() {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date
    end: Date
  } | null>(null)

  // Handle adding a new event
  const handleAddEvent = (event: Omit<CalendarEvent, "id">) => {
    const newEvent = {
      ...event,
      id: Math.random().toString(36).substring(2, 9),
    }
    setEvents([...events, newEvent])
    setIsModalOpen(false)
  }

  // Handle updating an existing event
  const handleUpdateEvent = (updatedEvent: CalendarEvent) => {
    setEvents(events.map((event) => (event.id === updatedEvent.id ? updatedEvent : event)))
    setIsModalOpen(false)
    setSelectedEvent(null)
  }

  // Handle deleting an event
  const handleDeleteEvent = () => {
    if (selectedEvent) {
      setEvents(events.filter((event) => event.id !== selectedEvent.id))
      setIsDeleteDialogOpen(false)
      setSelectedEvent(null)
    }
  }

  // Handle clicking on an event
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  // Handle selecting a time slot
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end })
    setSelectedEvent(null)
    setIsModalOpen(true)
  }

  return (
    <div className="flex flex-col h-[80vh]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Booking Calendar</h2>
        <Button
          onClick={() => {
            setSelectedEvent(null)
            setSelectedSlot({
              start: new Date(),
              end: new Date(new Date().setHours(new Date().getHours() + 1)),
            })
            setIsModalOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Booking
        </Button>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          popup
          views={["month", "week", "day"]}
          className="rounded-lg p-4"
        />
      </div>

      {/* Modal for adding/editing events */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedEvent(null)
          setSelectedSlot(null)
        }}
        onSave={(event) => {
          if (selectedEvent) {
            // event is CalendarEvent
            handleUpdateEvent(event as CalendarEvent)
          } else {
            // event is Omit<CalendarEvent, "id">
            handleAddEvent(event as Omit<CalendarEvent, "id">)
          }
        }}
        event={selectedEvent}
        initialSlot={selectedSlot}
        onDelete={() => {
          setIsModalOpen(false)
          setIsDeleteDialogOpen(true)
        }}
      />

      {/* Dialog for confirming deletion */}
      <DeleteEventDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDelete={handleDeleteEvent}
        eventTitle={selectedEvent?.title || ""}
      />
    </div>
  )
}
