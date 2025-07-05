"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Clock, Users, AlertCircle, Ban, Loader2, Mail, UserX } from "lucide-react"
import { format } from "date-fns"
import { doc, updateDoc, getDocs, collection, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useState } from "react"
import toast from "react-hot-toast"
import type { GymClass, ScheduledClass } from "./gym-booking-system"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ClassDetailModalProps {
  isOpen: boolean
  onClose: () => void
  gymClass: GymClass
  scheduledClass: ScheduledClass
  onDeleteClass: (scheduledId: string) => void
}

interface Booking {
  id: string
  scheduledClassId: string
  classId: string
  userId: string
  userEmail: string
  status: string
  bookingDate: string
  classDate: string
}

export function ClassDetailModal({ isOpen, onClose, gymClass, scheduledClass, onDeleteClass }: ClassDetailModalProps) {
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")
  const [showCancellationDialog, setShowCancellationDialog] = useState(false)
  
  const availableSpots = gymClass.capacity - scheduledClass.bookedSpots
  const isFullyBooked = availableSpots <= 0
  const isCancelled = scheduledClass.status === "cancelled"

  const sendCancellationEmails = async (bookedUsers: Booking[], reason: string) => {
    const className = gymClass.name
    const classDate = format(new Date(scheduledClass.date), "EEEE, MMMM d, yyyy")
    const classTime = `${scheduledClass.startTime} - ${scheduledClass.endTime}`

    const emailPromises = bookedUsers.map(async (booking) => {
      try {
        const emailData = {
          from: "noreply@gym-slot.com",
          to: booking.userEmail,
          subject: `Class Cancelled: ${className} on ${classDate}`,
          html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
              <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Class Cancelled</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                  We're sorry for any inconvenience
                </p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Unfortunately, your booked class has been cancelled:
                </p>
                
                <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
                  <h3 style="color: #111827; margin: 0 0 10px 0; font-size: 18px;">${className}</h3>
                  <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Date:</strong> ${classDate}</p>
                  <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Time:</strong> ${classTime}</p>
                  <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Instructor:</strong> ${gymClass.instructor}</p>
                </div>
                
                ${reason ? `
                  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                    <h4 style="color: #92400e; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">Cancellation Reason:</h4>
                    <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">${reason}</p>
                  </div>
                ` : ''}
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                  Your booking has been automatically cancelled and you will not be charged for this class.
                </p>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                  We apologize for any inconvenience this may cause. Please check our schedule for alternative classes.
                </p>
                
                <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                    Need help? Contact us at support@gym-slot.com
                  </p>
                </div>
              </div>
            </div>
          `,
          text: `
Class Cancelled: ${className}

Unfortunately, your booked class has been cancelled:

Class: ${className}
Date: ${classDate}
Time: ${classTime}
Instructor: ${gymClass.instructor}

${reason ? `Reason: ${reason}\n\n` : ''}

Your booking has been automatically cancelled and you will not be charged for this class.

We apologize for any inconvenience this may cause. Please check our schedule for alternative classes.

Need help? Contact us at support@gym-slot.com
          `,
        }

        console.log(`📧 Sending cancellation email to ${booking.userEmail}:`, {
          to: emailData.to,
          subject: emailData.subject,
          textLength: emailData.text.length,
          htmlLength: emailData.html.length
        })

        const response = await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailData),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error(`❌ Email API error for ${booking.userEmail}:`, {
            status: response.status,
            statusText: response.statusText,
            errorData
          })
          throw new Error(`Failed to send email to ${booking.userEmail}: ${errorData.error || response.statusText}`)
        }

        const result = await response.json()
        console.log(`✅ Cancellation email sent to ${booking.userEmail}`, result)
      } catch (error) {
        console.error(`❌ Failed to send email to ${booking.userEmail}:`, error)
        throw error
      }
    })

    await Promise.all(emailPromises)
  }

  const handleCancelClass = async () => {
    if (!cancellationReason.trim()) {
      toast.error("Please provide a reason for cancellation")
      return
    }

    try {
      setIsCancelling(true)

      // 1. Get all bookings for this scheduled class
      console.log("🔍 Finding bookings for scheduled class:", scheduledClass.id)
      const bookingsQuery = query(
        collection(db, "bookings"),
        where("scheduledClassId", "==", scheduledClass.id),
        where("status", "==", "active")
      )
      const bookingsSnapshot = await getDocs(bookingsQuery)
      const bookedUsers: Booking[] = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[]

      console.log(`📧 Found ${bookedUsers.length} users to notify:`, bookedUsers.map(b => b.userEmail))

      // 2. Update the scheduled class to cancelled status
      await updateDoc(doc(db, "scheduledClasses", scheduledClass.id), {
        status: "cancelled",
        cancelledAt: new Date(),
        cancellationReason: cancellationReason.trim(),
        cancelledBy: "admin" // You could get this from auth context
      })

      // 3. Update all related bookings to cancelled status
      const bookingUpdatePromises = bookedUsers.map(booking =>
        updateDoc(doc(db, "bookings", booking.id), {
          status: "cancelled",
          cancelledAt: new Date(),
          cancellationReason: cancellationReason.trim()
        })
      )
      await Promise.all(bookingUpdatePromises)

      // 4. Send cancellation emails to all booked users
      if (bookedUsers.length > 0) {
        try {
          await sendCancellationEmails(bookedUsers, cancellationReason.trim())
          toast.success(`Class cancelled and ${bookedUsers.length} users notified by email`)
        } catch (emailError) {
          console.error("Some emails failed to send:", emailError)
          toast.success(`Class cancelled, but some email notifications may have failed`)
        }
      } else {
        toast.success("Class cancelled successfully (no users to notify)")
      }

      setShowCancellationDialog(false)
      setCancellationReason("")
      onClose()

    } catch (error) {
      console.error("Error cancelling class:", error)
      toast.error("Failed to cancel class")
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div 
              className={`h-3 w-full rounded-t-lg -mx-6 -mt-6 mb-4 ${
                isCancelled ? 'bg-red-500' : ''
              }`} 
              style={!isCancelled ? { backgroundColor: gymClass.color } : {}} 
            />
            <DialogTitle className="text-2xl flex items-center gap-2">
              {gymClass.name}
              {isCancelled && (
                <Badge variant="destructive" className="text-sm">
                  <UserX className="h-3 w-3 mr-1" />
                  Cancelled
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Cancellation Notice */}
            {isCancelled && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Ban className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold text-red-800">Class Cancelled</h3>
                </div>
                <p className="text-sm text-red-700 mb-2">
                  This class was cancelled on {format(new Date(scheduledClass.cancelledAt!), "MMM d, yyyy 'at' h:mm a")}
                </p>
                {scheduledClass.cancellationReason && (
                  <div className="bg-red-100 rounded p-3 mt-2">
                    <p className="text-sm font-medium text-red-800 mb-1">Reason:</p>
                    <p className="text-sm text-red-700">{scheduledClass.cancellationReason}</p>
                  </div>
                )}
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {gymClass.category}
                </Badge>
                {!isCancelled && isFullyBooked && (
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
                    <p className="text-muted-foreground flex items-center gap-2">
                      {scheduledClass.bookedSpots}/{gymClass.capacity} booked
                      {!isCancelled && (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          🔴 Live
                        </span>
                      )}
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
            {!isCancelled && (
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
            )}
          </div>

          <DialogFooter className="flex justify-between">
            {!isCancelled ? (
              <AlertDialog open={showCancellationDialog} onOpenChange={setShowCancellationDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isCancelling}>
                    <Ban className="mr-2 h-4 w-4" />
                    Cancel Class
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <Ban className="h-5 w-5 text-red-600" />
                      Cancel Class
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel "{gymClass.name}" on {format(new Date(scheduledClass.date), "MMM d, yyyy")}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  
                  <div className="space-y-4">
                    {scheduledClass.bookedSpots > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="h-4 w-4 text-amber-600" />
                          <span className="font-medium text-amber-800">Email Notifications</span>
                        </div>
                        <p className="text-sm text-amber-700">
                          {scheduledClass.bookedSpots} user(s) will be automatically notified by email about this cancellation.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="cancellation-reason" className="text-sm font-medium">
                        Reason for cancellation *
                      </Label>
                      <Textarea
                        id="cancellation-reason"
                        placeholder="Please explain why this class is being cancelled (e.g., instructor illness, facility maintenance, etc.)"
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        rows={3}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        This reason will be included in the email notifications sent to participants.
                      </p>
                    </div>
                  </div>
                  
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isCancelling}>
                      Keep Class
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelClass}
                      disabled={isCancelling || !cancellationReason.trim()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isCancelling ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <Ban className="mr-2 h-4 w-4" />
                          Cancel Class & Notify Users
                        </>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <div className="text-sm text-muted-foreground">
                Cancelled classes cannot be reinstated
              </div>
            )}
            <Button onClick={onClose} disabled={isCancelling}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
