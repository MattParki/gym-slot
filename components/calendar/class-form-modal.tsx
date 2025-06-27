"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { GymClass } from "./gym-booking-system"
import { db } from "@/lib/firebase"
import { collection, doc, updateDoc, addDoc, getDoc } from "firebase/firestore"
import toast from "react-hot-toast"
import { getAuth } from "firebase/auth";

const categories = ["Yoga", "Cardio", "Strength", "Pilates", "Dance", "Martial Arts", "Swimming", "Other"]
const colors = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316", "#ec4899"]

interface ClassFormModalProps {
  isOpen: boolean
  onClose: () => void
  initialClass?: GymClass | null
  onSave: (classData: GymClass) => Promise<void>
}

export function ClassFormModal({ isOpen, onClose, initialClass, onSave }: ClassFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 60,
    instructor: "",
    capacity: 20,
    category: "",
    color: colors[0],
    requirements: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    if (initialClass) {
      setFormData({
        name: initialClass.name,
        description: initialClass.description,
        duration: initialClass.duration,
        instructor: initialClass.instructor,
        capacity: initialClass.capacity,
        category: initialClass.category,
        color: initialClass.color,
        requirements: initialClass.requirements || "",
      })
    } else {
      setFormData({
        name: "",
        description: "",
        duration: 60,
        instructor: "",
        capacity: 20,
        category: "",
        color: colors[0],
        requirements: "",
      })
    }
  }, [initialClass, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      console.log("Current User:", currentUser);

      if (!currentUser) {
        toast.error("User not authenticated.");
        setIsSubmitting(false);
        return;
      }

      // Get businessId from user document
      const userDocRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        toast.error("User document not found.");
        setIsSubmitting(false);
        return;
      }

      const { businessId } = userSnap.data();
      if (!businessId) {
        toast.error("No businessId associated with this user.");
        setIsSubmitting(false);
        return;
      }

      const classData = {
        ...formData,
        businessId,
      };

      const classesRef = collection(db, "classes");

      if (initialClass?.id) {
        const classDocRef = doc(classesRef, initialClass.id);
        await updateDoc(classDocRef, classData);
        toast.success("Class updated!");
        await onSave({ ...classData, id: initialClass.id });
      } else {
        const newDoc = await addDoc(classesRef, classData);
        toast.success("Class added!");
        await onSave({ ...classData, id: newDoc.id });
      }

      onClose();
    } catch (error) {
      console.error("Error saving class:", error);
      toast.error("Failed to save class.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>

      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialClass ? "Edit Class" : "Add New Class"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Class Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructor">Instructor</Label>
            <Input
              id="instructor"
              value={formData.instructor}
              onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                max="180"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number.parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Max Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="100"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number.parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? "border-gray-800" : "border-gray-300"
                    }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements (optional)</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              rows={2}
              placeholder="e.g., Bring your own mat, towel required"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {initialClass ? "Update Class" : "Add Class"}
            </Button>

          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
