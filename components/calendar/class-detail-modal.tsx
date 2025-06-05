"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, Users, AlertCircle, Trash2 } from "lucide-react"
import { format } from "date-fns"
import type { GymClass, ScheduledClass } from "./gym-booking-system"

interface ClassDetailModalProps {
  isOpen: boolean
  onClose: () => void
  gymClass: GymClass
  scheduledClass: ScheduledClass
  onDeleteClass: (scheduledId: string) => void
}

export function ClassDetailModal({ isOpen, onClose, gymClass, scheduledClass, onDeleteClass }: ClassDetailModalProps) {
  const availableSpots = gymClass.capacity - scheduledClass.bookedSpots
  const isFullyBooked = availableSpots <= 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="h-3 w-full rounded-t-lg -mx-6 -mt-6 mb-4" style={{ backgroundColor: gymClass.color }} />
          <DialogTitle className="text-2xl">{gymClass.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {gymClass.category}
              </Badge>
              {isFullyBooked && (
                <Badge variant="destructive" className="text-sm">
                  Fully Booked
                </Badge>
              )}
            </div>

            <p className="text-muted-foreground">{gymClass.description}</p>
          </div>

          <Separator />

          {/* Schedule Details */}
          <div className="space-y-3">
            <h3 className="font-semibold">Schedule Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Time</p>
                  <p className="text-muted-foreground">
                    {scheduledClass.startTime} - {scheduledClass.endTime}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Capacity</p>
                  <p className="text-muted-foreground">
                    {scheduledClass.bookedSpots}/{gymClass.capacity} booked
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm">
              <p className="font-medium">Date</p>
              <p className="text-muted-foreground">{format(new Date(scheduledClass.date), "EEEE, MMMM d, yyyy")}</p>
            </div>
          </div>

          <Separator />

          {/* Instructor Info */}
          <div className="space-y-2">
            <h3 className="font-semibold">Instructor</h3>
            <p className="text-muted-foreground">{gymClass.instructor}</p>
          </div>

          {/* Requirements */}
          {gymClass.requirements && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <h3 className="font-semibold">Requirements</h3>
                </div>
                <p className="text-sm text-muted-foreground">{gymClass.requirements}</p>
              </div>
            </>
          )}

          {/* Availability */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Available Spots</p>
                <p className="text-sm text-muted-foreground">
                  {availableSpots} of {gymClass.capacity} spots remaining
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: gymClass.color }}>
                  {availableSpots}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={() => {
              onDeleteClass(scheduledClass.id)
              onClose()
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Remove Class
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
