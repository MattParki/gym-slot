"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Trash2, Eye } from "lucide-react"
import { format } from "date-fns"
import type { GymClass, ScheduledClass } from "./gym-booking-system"

interface DayDetailModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date
  classesForDay: Array<{ gymClass: GymClass; scheduled: ScheduledClass }>
  onClassClick: (gymClass: GymClass, scheduled: ScheduledClass) => void
  onDeleteClass: (scheduledId: string) => void
}

export function DayDetailModal({
  isOpen,
  onClose,
  date,
  classesForDay,
  onClassClick,
  onDeleteClass,
}: DayDetailModalProps) {
  const sortedClasses = classesForDay.sort((a, b) => a.scheduled.startTime.localeCompare(b.scheduled.startTime))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Classes for {format(date, "EEEE, MMMM d, yyyy")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {sortedClasses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No classes scheduled for this day</p>
          ) : (
            sortedClasses.map(({ gymClass, scheduled }) => (
              <Card key={scheduled.id}>
                <div className="h-2 w-full rounded-t-lg" style={{ backgroundColor: gymClass.color }} />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{gymClass.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{gymClass.instructor}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => onClassClick(gymClass, scheduled)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDeleteClass(scheduled.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {scheduled.startTime} - {scheduled.endTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {scheduled.bookedSpots}/{gymClass.capacity}
                    </div>
                    <Badge variant="secondary">{gymClass.category}</Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">{gymClass.description}</p>

                  {gymClass.requirements && (
                    <p className="text-xs text-muted-foreground border-l-2 border-muted pl-2">
                      Requirements: {gymClass.requirements}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
