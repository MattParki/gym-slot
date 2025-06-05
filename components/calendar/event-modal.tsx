"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon, Trash2 } from "lucide-react"
import { format } from "date-fns"
import type { CalendarEvent } from "./calendar-booking"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Sample resources (gym areas)
const resources = [
  { id: "yoga-room", name: "Yoga Room" },
  { id: "weights-area", name: "Weights Area" },
  { id: "cardio-zone", name: "Cardio Zone" },
  { id: "pool", name: "Swimming Pool" },
  { id: "boxing-ring", name: "Boxing Ring" },
]

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (event: CalendarEvent | Omit<CalendarEvent, "id">) => void
  onDelete?: () => void
  event: CalendarEvent | null
  initialSlot: { start: Date; end: Date } | null
}

export function EventModal({ isOpen, onClose, onSave, onDelete, event, initialSlot }: EventModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [startTime, setStartTime] = useState("12:00")
  const [endTime, setEndTime] = useState("13:00")
  const [resourceId, setResourceId] = useState("")

  // Reset form when modal opens with event data or initial slot
  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setDescription(event.description || "")
      setStartDate(event.start)
      setEndDate(event.end)
      setStartTime(format(event.start, "HH:mm"))
      setEndTime(format(event.end, "HH:mm"))
      setResourceId(event.resourceId || "")
    } else if (initialSlot) {
      setTitle("")
      setDescription("")
      setStartDate(initialSlot.start)
      setEndDate(initialSlot.end)
      setStartTime(format(initialSlot.start, "HH:mm"))
      setEndTime(format(initialSlot.end, "HH:mm"))
      setResourceId("")
    }
  }, [event, initialSlot, isOpen])

  const handleSave = () => {
    // Combine date and time
    const start = new Date(startDate)
    const [startHours, startMinutes] = startTime.split(":").map(Number)
    start.setHours(startHours, startMinutes)

    const end = new Date(endDate)
    const [endHours, endMinutes] = endTime.split(":").map(Number)
    end.setHours(endHours, endMinutes)

    if (event) {
      onSave({
        ...event,
        title,
        description,
        start,
        end,
        resourceId,
      })
    } else {
      onSave({
        title,
        description,
        start,
        end,
        resourceId,
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Booking" : "Add New Booking"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Booking title" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="resource">Gym Area</Label>
            <Select value={resourceId} onValueChange={setResourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                {resources.map((resource) => (
                  <SelectItem key={resource.id} value={resource.id}>
                    {resource.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this booking"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <div>
            {event && onDelete && (
              <Button variant="destructive" onClick={onDelete} type="button">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
