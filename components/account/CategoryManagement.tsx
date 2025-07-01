"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Plus, Trash2, Edit2, Check, X } from "lucide-react"
import { collection, doc, getDocs, getDoc, addDoc, deleteDoc, updateDoc, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import toast from "react-hot-toast"

interface Category {
  id: string
  name: string
  businessId: string
  createdAt: any
}

export default function CategoryManagement() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategoryName, setNewCategoryName] = useState("")
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [loading, setLoading] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)

  // Fetch businessId when user changes
  useEffect(() => {
    const fetchBusinessId = async () => {
      if (!user?.uid) return

      try {
        const userDocRef = doc(db, "users", user.uid)
        const userSnap = await getDoc(userDocRef)

        if (userSnap.exists()) {
          const data = userSnap.data() as { businessId?: string }
          if (data.businessId) {
            setBusinessId(data.businessId)
          } else {
            console.warn("User document has no businessId")
            setBusinessId(null)
            toast.error("No business ID found for your account")
          }
        } else {
          console.warn("No user document found")
          setBusinessId(null)
          toast.error("User document not found")
        }
      } catch (error) {
        console.error("Error fetching businessId:", error)
        toast.error("Error fetching your business ID")
      }
    }

    if (user) {
      fetchBusinessId()
    }
  }, [user])

  // Fetch categories when businessId changes
  useEffect(() => {
    const fetchCategories = async () => {
      if (!businessId) return

      try {
        const categoriesQuery = query(
          collection(db, "categories"),
          where("businessId", "==", businessId)
        )
        const snapshot = await getDocs(categoriesQuery)
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[]
        setCategories(list)
      } catch (error) {
        console.error("Error fetching categories:", error)
        toast.error("Failed to load categories")
      }
    }

    fetchCategories()
  }, [businessId])

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim()
    if (!trimmed || !businessId) {
      toast.error("Category name cannot be empty")
      return
    }
    if (categories.some(cat => cat.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Category already exists")
      return
    }
    setLoading(true)
    try {
      const docRef = await addDoc(collection(db, "categories"), {
        name: trimmed,
        businessId,
        createdAt: new Date(),
      })
      setCategories([...categories, { id: docRef.id, name: trimmed, businessId, createdAt: new Date() }])
      setNewCategoryName("")
      toast.success("Category added successfully")
    } catch (error) {
      console.error("Error adding category:", error)
      toast.error("Failed to add category")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    try {
      await deleteDoc(doc(db, "categories", id))
      setCategories(categories.filter(cat => cat.id !== id))
      toast.success(`"${name}" deleted successfully`)
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error("Failed to delete category")
    }
  }

  const handleEditSave = async (id: string) => {
    const trimmed = editName.trim()
    if (!trimmed) {
      toast.error("Category name cannot be empty")
      return
    }
    if (categories.some(cat => cat.id !== id && cat.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Category already exists")
      return
    }
    try {
      await updateDoc(doc(db, "categories", id), { name: trimmed })
      setCategories(categories.map(cat => (cat.id === id ? { ...cat, name: trimmed } : cat)))
      setEditingCategory(null)
      setEditName("")
      toast.success("Category updated successfully")
    } catch (error) {
      console.error("Error updating category:", error)
      toast.error("Failed to update category")
    }
  }

  const defaultCategories = ["Yoga", "Cardio", "Strength", "Pilates", "Dance", "Martial Arts", "Swimming", "Other"]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Manage Categories</h3>
        <p className="text-sm text-muted-foreground mb-4">Create custom categories for your classes.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter category name"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddCategory()}
              disabled={loading}
            />
            <Button onClick={handleAddCategory} disabled={!newCategoryName.trim() || loading}>
              <Plus className="h-4 w-4 mr-2" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No custom categories yet.</p>
          ) : (
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex justify-between items-center border rounded-lg p-3">
                  {editingCategory === cat.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") handleEditSave(cat.id)
                          if (e.key === "Escape") {
                            setEditingCategory(null)
                            setEditName("")
                          }
                        }}
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => handleEditSave(cat.id)} disabled={!editName.trim()}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingCategory(null); setEditName("") }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span>{cat.name}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingCategory(cat.id); setEditName(cat.name) }}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Category</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure you want to delete "{cat.name}"?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCategory(cat.id, cat.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Default Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {defaultCategories.map(name => (
              <span key={name} className="px-2 py-1 bg-muted rounded-md text-sm">{name}</span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}