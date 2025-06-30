"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { GymClass } from "./gym-booking-system"
import { collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface ClassDropZoneProps {
  classes: GymClass[]
  onScheduleClass: (classId: string, date: Date, startTime: string) => void
}

export function ClassDropZone({ classes, onScheduleClass }: ClassDropZoneProps) {
  const [selectedClass, setSelectedClass] = useState<GymClass | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [startTime, setStartTime] = useState("09:00")

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const startDate = new Date(2000, 0, 1, hours, minutes)
    startDate.setMinutes(startDate.getMinutes() + durationMinutes)
    
    return `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`
  }

  const handleSchedule = async (classId: string, date: Date, startTime: string) => {
    if (selectedClass && selectedDate) {
      const endTime = calculateEndTime(startTime, selectedClass.duration)
      
      onScheduleClass(selectedClass.id, selectedDate, startTime)
      setSelectedClass(null)
      setSelectedDate(undefined)
      setStartTime("09:00")

      try {
        await addDoc(collection(db, "scheduledClasses"), {
          classId: classId,
          date: format(date, "yyyy-MM-dd"),
          startTime,
          endTime,
          scheduledAt: new Date().toISOString(),
        })
      } catch (error) {
        console.error("Error scheduling class:", error)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Schedule Classes</h3>
        <p className="text-sm text-muted-foreground">
          Click on a class below to select it, then choose a date and time to schedule it.
        </p>
      </div>

      {/* Class Selection */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {selectedClass ? `Selected: ${selectedClass.name}` : "Select a Class"}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {classes.map((gymClass) => (
            <Card
              key={gymClass.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md border-2",
                selectedClass?.id === gymClass.id 
                  ? "ring-2 ring-primary border-primary bg-primary/5" 
                  : "border-muted hover:border-primary/50",
              )}
              onClick={() => setSelectedClass(gymClass)}
            >
              <div className="h-2 w-full rounded-t-lg" style={{ backgroundColor: gymClass.color }} />
              <CardContent className="p-3">
                <h4 className="font-medium text-sm">{gymClass.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{gymClass.instructor}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {gymClass.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {gymClass.duration}m
                  </div>
                </div>
                {selectedClass?.id === gymClass.id && (
                  <div className="mt-2 text-xs text-primary font-medium">
                    ✓ Selected
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Scheduling Controls */}
      {selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Schedule: {selectedClass.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                {selectedClass && (
                  <p className="text-xs text-muted-foreground">
                    End time: {calculateEndTime(startTime, selectedClass.duration)} ({selectedClass.duration} minutes)
                  </p>
                )}
              </div>

              <div className="flex items-end md:col-span-2">
                <Button
                  onClick={() => {
                    if (selectedClass && selectedDate) {
                      handleSchedule(selectedClass.id, selectedDate, startTime)
                    }
                  }}
                  disabled={!selectedDate}
                  className="w-full"
                >
                  Schedule Class
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Duration: {selectedClass.duration} minutes • Capacity: {selectedClass.capacity} people
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
