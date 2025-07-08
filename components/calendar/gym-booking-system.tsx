"use client"

import { useState } from "react"
import { ClassLibrary } from "./class-library"
import { CalendarView } from "./calendar-view"
import { DayDetailModal } from "./day-detail-modal"
import { ClassDetailModal } from "./class-detail-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/lib/firebase"
import { collection, getDocs, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore"
import { useEffect } from "react"
import { addDoc } from "firebase/firestore"
import toast from "react-hot-toast"

// Define the class template type
export type GymClass = {
  id: string
  name: string
  description: string
  duration: number // in minutes
  instructor: string
  capacity: number
  category: string
  color: string
  requirements?: string
}

// Define the scheduled class instance type
export type ScheduledClass = {
  id: string
  classId: string
  date: string | Date
  startTime: string
  endTime: string
  bookedSpots: number
  status?: "active" | "cancelled"
  cancelledAt?: Date
  cancellationReason?: string
  cancelledBy?: string
}

// Define booking type for real-time updates
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

// Sample gym classes
const initialClasses: GymClass[] = [
  {
    id: "1",
    name: "Morning Yoga",
    description: "Start your day with gentle stretches and mindfulness",
    duration: 60,
    instructor: "Sarah Johnson",
    capacity: 20,
    category: "Yoga",
    color: "#10b981",
    requirements: "Bring your own mat",
  },
  {
    id: "2",
    name: "HIIT Training",
    description: "High-intensity interval training for maximum results",
    duration: 45,
    instructor: "Mike Chen",
    capacity: 15,
    category: "Cardio",
    color: "#f59e0b",
    requirements: "Towel and water bottle required",
  },
  {
    id: "3",
    name: "Strength Training",
    description: "Build muscle and increase strength with guided workouts",
    duration: 90,
    instructor: "Alex Rodriguez",
    capacity: 12,
    category: "Strength",
    color: "#ef4444",
  },
]

export function GymBookingSystem() {
  const [classes, setClasses] = useState<GymClass[]>([])
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedClass, setSelectedClass] = useState<{ gymClass: GymClass; scheduled: ScheduledClass } | null>(null)

  const handleAddClass = async (newClass: Omit<GymClass, "id">): Promise<GymClass> => {
    const docRef = await addDoc(collection(db, "classes"), newClass);
    const classWithId = { ...newClass, id: docRef.id };
    setClasses((prev) => {
      // Check if class already exists to prevent duplicates
      const existingClass = prev.find(cls => cls.id === classWithId.id);
      if (existingClass) {
        return prev; // Don't add duplicate
      }
      return [...prev, classWithId];
    });
    return classWithId;
  };

  // Real-time listener for classes
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "classes"),
      (snapshot) => {
        const loaded: GymClass[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as GymClass[]

        // Deduplicate classes by ID to prevent duplicate key errors
        const uniqueClasses = loaded.reduce((acc: GymClass[], current) => {
          const existingClass = acc.find(cls => cls.id === current.id)
          if (!existingClass) {
            acc.push(current)
          }
          return acc
        }, [])

        setClasses(uniqueClasses)
        console.log("📡 Real-time classes update:", uniqueClasses.length, "classes loaded")
      },
      (error) => {
        console.error("Failed to load gym classes:", error)
      }
    )

    return () => unsubscribe()
  }, [])

  // Real-time listener for scheduled classes
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "scheduledClasses"),
      (snapshot) => {
        const loaded: ScheduledClass[] = snapshot.docs.map((doc) => {
          const data = doc.data()
          const dateObj =
            data.date instanceof Date
              ? data.date
              : data.date?.toDate?.() ?? new Date(data.date)

          return {
            id: doc.id,
            classId: data.classId,
            date: dateObj,
            startTime: data.startTime,
            endTime: data.endTime,
            bookedSpots: data.bookedSpots ?? 0,
            status: data.status || "active", // Default to active if no status
            cancelledAt: data.cancelledAt ? data.cancelledAt.toDate() : undefined,
            cancellationReason: data.cancellationReason || undefined,
            cancelledBy: data.cancelledBy || undefined,
          }
        })

        setScheduledClasses(loaded)
        console.log("📡 Real-time scheduled classes update:", loaded.length, "scheduled classes loaded")
        console.log(`🚫 Cancelled classes: ${loaded.filter(sc => sc.status === "cancelled").length}`)
      },
      (error) => {
        console.error("Failed to load scheduled classes:", error)
      }
    )

    return () => unsubscribe()
  }, [])

  // Real-time listener for bookings to update booking counts
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "bookings"),
      (snapshot) => {
        const loaded: Booking[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Booking[]

        setBookings(loaded)
        console.log("📡 Real-time bookings update:", loaded.length, "bookings loaded")
      },
      (error) => {
        console.error("Failed to load bookings:", error)
      }
    )

    return () => unsubscribe()
  }, [])

  // Update scheduled classes with real-time booking counts
  useEffect(() => {
    if (scheduledClasses.length > 0 && bookings.length >= 0) {
      const updatedScheduledClasses = scheduledClasses.map((scheduled) => {
        // Count active bookings for this scheduled class
        const activeBookings = bookings.filter(
          (booking) =>
            booking.scheduledClassId === scheduled.id &&
            booking.status === "active"
        ).length

        // Only update if the count has changed
        if (activeBookings !== scheduled.bookedSpots) {
          console.log(`📊 Updating booking count for scheduled class ${scheduled.id}: ${scheduled.bookedSpots} → ${activeBookings}`)
          return {
            ...scheduled,
            bookedSpots: activeBookings,
          }
        }
        return scheduled
      })

      // Only update state if there are actual changes
      const hasChanges = updatedScheduledClasses.some(
        (updated, index) => updated.bookedSpots !== scheduledClasses[index].bookedSpots
      )

      if (hasChanges) {
        setScheduledClasses(updatedScheduledClasses)
        console.log("✅ Scheduled classes updated with real-time booking counts")
      }
    }
  }, [bookings, scheduledClasses])

  const handleUpdateClass = (updatedClass: GymClass) => {
    setClasses((prev) => {
      // Ensure we only update the specific class and don't create duplicates
      const updatedClasses = prev.map((cls) => (cls.id === updatedClass.id ? updatedClass : cls))
      
      // Double-check for duplicates after update
      const uniqueClasses = updatedClasses.reduce((acc: GymClass[], current) => {
        const existingClass = acc.find(cls => cls.id === current.id)
        if (!existingClass) {
          acc.push(current)
        }
        return acc
      }, [])
      
      return uniqueClasses
    })
  }

  const handleDeleteClass = async (classId: string) => {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, "classes", classId))
      
      // Update local state - but this will be handled by the real-time listener
      // setClasses(classes.filter((cls) => cls.id !== classId))
      // setScheduledClasses(scheduledClasses.filter((scheduled) => scheduled.classId !== classId))
      
      toast.success("Class deleted successfully")
    } catch (error) {
      console.error("Error deleting class:", error)
      toast.error("Failed to delete class")
    }
  }

  const handleScheduleClass = (classId: string, date: Date, startTime: string) => {
    const gymClass = classes.find((cls) => cls.id === classId)
    if (!gymClass) return

    // Calculate end time based on duration
    const [hours, minutes] = startTime.split(":").map(Number)
    const endDate = new Date(date)
    endDate.setHours(hours, minutes + gymClass.duration)
    const endTime = endDate.toTimeString().slice(0, 5)

    const scheduledClass: ScheduledClass = {
      id: Math.random().toString(36).substring(2, 9),
      classId,
      date,
      startTime,
      endTime,
      bookedSpots: 0,
    }

    setScheduledClasses([...scheduledClasses, scheduledClass])
  }

  const handleDeleteScheduledClass = (scheduledId: string) => {
    setScheduledClasses(scheduledClasses.filter((scheduled) => scheduled.id !== scheduledId))
  }

  const getClassesForDate = (date: Date) => {
    return scheduledClasses
      .filter((scheduled) => {
        const scheduledDate = new Date(scheduled.date)
        return (
          scheduledDate.getDate() === date.getDate() &&
          scheduledDate.getMonth() === date.getMonth() &&
          scheduledDate.getFullYear() === date.getFullYear()
        )
      })
      .map((scheduled) => ({
        scheduled,
        gymClass: classes.find((cls) => cls.id === scheduled.classId)!,
      }))
      .filter((item) => item.gymClass)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-50 border border-gray-200 rounded-lg">
          <TabsTrigger value="calendar" className="font-medium text-gray-600 hover:text-gray-900 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-500">Calendar View</TabsTrigger>
          <TabsTrigger value="classes" className="font-medium text-gray-600 hover:text-gray-900 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-500">Manage Classes</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <CalendarView
            classes={classes}
            scheduledClasses={scheduledClasses}
            onScheduleClass={handleScheduleClass}
            onDateClick={setSelectedDate}
            onClassClick={(gymClass, scheduled) => setSelectedClass({ gymClass, scheduled })}
          />
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <ClassLibrary
            onAddClass={handleAddClass}
            onUpdateClass={handleUpdateClass}
            onDeleteClass={handleDeleteClass}
          />
        </TabsContent>
      </Tabs>

      {/* Day Detail Modal */}
      {selectedDate && (
        <DayDetailModal
          isOpen={!!selectedDate}
          onClose={() => setSelectedDate(null)}
          date={selectedDate}
          classesForDay={getClassesForDate(selectedDate)}
          onClassClick={(gymClass, scheduled) => {
            setSelectedClass({ gymClass, scheduled })
            setSelectedDate(null)
          }}
          onDeleteClass={handleDeleteScheduledClass}
        />
      )}

      {/* Class Detail Modal */}
      {selectedClass && (
        <ClassDetailModal
          isOpen={!!selectedClass}
          onClose={() => setSelectedClass(null)}
          gymClass={selectedClass.gymClass}
          scheduledClass={selectedClass.scheduled}
          onDeleteClass={handleDeleteScheduledClass}
        />
      )}
    </div>
  )
}
