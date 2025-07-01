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
import { collection, doc, updateDoc, addDoc, getDoc, getDocs, query, where } from "firebase/firestore"
import toast from "react-hot-toast"
import { getAuth } from "firebase/auth";

const defaultCategories = ["Yoga", "Cardio", "Strength", "Pilates", "Dance", "Martial Arts", "Swimming", "Other"]
const colors = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316", "#ec4899"]

interface ClassFormModalProps {
  isOpen: boolean
  onClose: () => void
  initialClass?: GymClass | null
  onSave: (classData: GymClass | Omit<GymClass, "id">) => Promise<void>
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
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [existingClasses, setExistingClasses] = useState<GymClass[]>([]);

  // Fetch categories and existing classes when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchExistingClasses();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      // Get user's business ID
      const userDocRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) return;

      const { businessId } = userSnap.data();
      if (!businessId) return;

      setBusinessId(businessId);

      // Fetch custom categories for this business
      const categoriesQuery = query(
        collection(db, "categories"),
        where("businessId", "==", businessId)
      );
      const snapshot = await getDocs(categoriesQuery);
      const customCategories = snapshot.docs.map(doc => doc.data().name);

      // Combine default and custom categories, removing duplicates
      const allCategories = [...defaultCategories, ...customCategories];
      const uniqueCategories = Array.from(new Set(allCategories));
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Fall back to default categories
      setCategories(defaultCategories);
    }
  };

  const fetchExistingClasses = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      // Get user's business ID
      const userDocRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) return;

      const { businessId } = userSnap.data();
      if (!businessId) return;

      // Fetch existing classes for this business
      const classesQuery = query(
        collection(db, "classes"),
        where("businessId", "==", businessId)
      );
      const snapshot = await getDocs(classesQuery);
      const classes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GymClass[];

      setExistingClasses(classes);
    } catch (error) {
      console.error("Error fetching existing classes:", error);
    }
  };

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

  // Check if current name is duplicate
  const isDuplicateName = existingClasses.some(
    cls => cls.name.toLowerCase().trim() === formData.name.toLowerCase().trim() && 
           cls.id !== initialClass?.id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Check for duplicate class names
      const duplicateClass = existingClasses.find(
        cls => cls.name.toLowerCase().trim() === formData.name.toLowerCase().trim() && 
               cls.id !== initialClass?.id // Allow editing the same class
      );

      if (duplicateClass) {
        toast.error(`A class named "${formData.name}" already exists. Please choose a different name.`);
        setIsSubmitting(false);
        return;
      }

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

      if (initialClass?.id) {
        // For editing existing classes, update Firestore directly
        const classDocRef = doc(db, "classes", initialClass.id);
        await updateDoc(classDocRef, classData);
        toast.success("Class updated!");
        await onSave({ ...classData, id: initialClass.id });
      } else {
        // For new classes, let the parent handle Firestore operations
        toast.success("Class added!");
        await onSave(classData as Omit<GymClass, "id">);
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
              className={isDuplicateName ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {isDuplicateName && formData.name.trim() && (
              <p className="text-sm text-red-500">
                A class named "{formData.name}" already exists. Please choose a different name.
              </p>
            )}
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
                {categories.filter(category => category && category.trim() !== "").map((category, index) => (
                  <SelectItem key={`category-${index}-${category}`} value={category}>
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
            <Button type="submit" disabled={isSubmitting || isDuplicateName}>
              {initialClass ? "Update Class" : "Add Class"}
            </Button>

          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
