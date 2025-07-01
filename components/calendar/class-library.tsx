"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Users, Clock } from "lucide-react"
import { ClassFormModal } from "./class-form-modal"
import type { GymClass } from "./gym-booking-system"
import { useEffect } from "react"
import { collection, getDocs, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface ClassLibraryProps {
  onAddClass: (newClass: Omit<GymClass, "id">) => void
  onUpdateClass: (updatedClass: GymClass) => void
  onDeleteClass: (classId: string) => Promise<void>
}

export function ClassLibrary({ onAddClass, onUpdateClass, onDeleteClass }: ClassLibraryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<GymClass | null>(null)
  const [classes, setClasses] = useState<GymClass[]>([])

  const handleEdit = (gymClass: GymClass) => {
    setEditingClass(gymClass)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingClass(null)
    setIsModalOpen(true)
  }

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const snapshot = await getDocs(collection(db, "classes"))
        const classList: GymClass[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<GymClass, "id">),
        }))
        setClasses(classList)
      } catch (err) {
        console.error("Error loading classes:", err)
      }
    }

    fetchClasses()
  }, [])

  const handleSave = async (savedClass: GymClass) => {
  if (editingClass) {
    onUpdateClass(savedClass)
    setClasses((prev) => prev.map(cls => (cls.id === savedClass.id ? savedClass : cls)))
  } else {
    onAddClass(savedClass)
    setClasses((prev) => [...prev, savedClass])
  }

  setIsModalOpen(false)
  setEditingClass(null)
}

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Class Library</h2>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add New Class
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((gymClass) => (
          <Card key={gymClass.id} className="relative">
            <div
              className="absolute top-0 left-0 w-full h-2 rounded-t-lg"
              style={{ backgroundColor: gymClass.color }}
            />
            <CardHeader className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{gymClass.name}</CardTitle>
                  <CardDescription className="mt-1">{gymClass.instructor}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(gymClass)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Class</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{gymClass.name}"? This will also remove all scheduled instances of this class. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            await onDeleteClass(gymClass.id)
                            setClasses(prev => prev.filter(cls => cls.id !== gymClass.id))
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{gymClass.description}</p>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{gymClass.category}</Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {gymClass.duration} min
                </div>  
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {gymClass.capacity} max
                </div>
              </div>

              {gymClass.requirements && (
                <p className="text-xs text-muted-foreground border-l-2 border-muted pl-2">{gymClass.requirements}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <ClassFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingClass(null)
        }}
        onSave={handleSave}
        initialClass={editingClass}
      />
    </div>
  )
}
