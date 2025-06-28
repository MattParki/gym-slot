"use client"

import { useState } from "react"
import { ClassLibrary } from "./class-library"
import { CalendarView } from "./calendar-view"
import { DayDetailModal } from "./day-detail-modal"
import { ClassDetailModal } from "./class-detail-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import { useEffect } from "react"
import { addDoc } from "firebase/firestore"

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedClass, setSelectedClass] = useState<{ gymClass: GymClass; scheduled: ScheduledClass } | null>(null)

  const handleAddClass = async (newClass: Omit<GymClass, "id">): Promise<GymClass> => {
    const docRef = await addDoc(collection(db, "classes"), newClass);
    const classWithId = { ...newClass, id: docRef.id };
    setClasses((prev) => [...prev, classWithId]);
    return classWithId;
  };

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const snapshot = await getDocs(collection(db, "classes"))
        const loaded: GymClass[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as GymClass[]

        setClasses(loaded)
      } catch (err) {
        console.error("Failed to load gym classes:", err)
      }
    }

    const fetchScheduledClasses = async () => {
      try {
        const snapshot = await getDocs(collection(db, "scheduledClasses"))
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
          }
        })

        setScheduledClasses(loaded)
      } catch (err) {
        console.error("Failed to load scheduled classes:", err)
      }
    }

    fetchClasses()
    fetchScheduledClasses()
  }, [])


  const handleUpdateClass = (updatedClass: GymClass) => {
    setClasses(classes.map((cls) => (cls.id === updatedClass.id ? updatedClass : cls)))
  }

  const handleDeleteClass = (classId: string) => {
    setClasses(classes.filter((cls) => cls.id !== classId))
    // Also remove any scheduled instances of this class
    setScheduledClasses(scheduledClasses.filter((scheduled) => scheduled.classId !== classId))
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="classes">Manage Classes</TabsTrigger>
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
