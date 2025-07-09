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
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Classes for {format(date, "EEEE, MMMM d, yyyy")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {sortedClasses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No classes scheduled for this day</p>
          ) : (
            sortedClasses.map(({ gymClass, scheduled }) => {
              const isCancelled = scheduled.status === "cancelled"
              
              return (
                <Card key={scheduled.id} className={isCancelled ? "opacity-75" : ""}>
                  <div 
                    className={`h-2 w-full rounded-t-lg ${isCancelled ? 'bg-red-500' : ''}`}
                    style={!isCancelled ? { backgroundColor: gymClass.color } : {}} 
                  />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className={`text-lg ${isCancelled ? 'text-red-600' : ''}`}>
                          {isCancelled ? '🚫 ' : ''}{gymClass.name}
                          {isCancelled && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              CANCELLED
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{gymClass.instructor}</p>
                        {isCancelled && scheduled.cancellationReason && (
                          <p className="text-xs text-red-600 mt-1 italic">
                            Reason: {scheduled.cancellationReason}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onClassClick(gymClass, scheduled)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!isCancelled && (
                          <Button variant="ghost" size="sm" onClick={() => onDeleteClass(scheduled.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className={isCancelled ? 'line-through text-muted-foreground' : ''}>
                          {scheduled.startTime} - {scheduled.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span className={isCancelled ? 'line-through text-muted-foreground' : ''}>
                          {scheduled.bookedSpots}/{gymClass.capacity}
                        </span>
                      </div>
                      <Badge variant="secondary">{gymClass.category}</Badge>
                    </div>

                    <p className={`text-sm text-muted-foreground ${isCancelled ? 'line-through' : ''}`}>
                      {gymClass.description}
                    </p>

                    {gymClass.requirements && (
                      <p className={`text-xs text-muted-foreground border-l-2 border-muted pl-2 ${isCancelled ? 'line-through' : ''}`}>
                        Requirements: {gymClass.requirements}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
