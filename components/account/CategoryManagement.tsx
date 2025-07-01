"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Plus, Trash2, Edit2, Check, X } from "lucide-react"
import { collection, doc, getDocs, addDoc, deleteDoc, updateDoc, query, where } from "firebase/firestore"
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

  useEffect(() => {
    if (user) {
      fetchBusinessId()
    }
  }, [user])

  useEffect(() => {
    if (businessId) {
      fetchCategories()
    }
  }, [businessId])

  const fetchBusinessId = async () => {
    if (!user) return
    
    try {
      const userDoc = await getDocs(query(collection(db, "users"), where("email", "==", user.email)))
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data()
        setBusinessId(userData.businessId || user.uid)
      } else {
        setBusinessId(user.uid)
      }
    } catch (error) {
      console.error("Error fetching business ID:", error)
      setBusinessId(user.uid)
    }
  }

  const fetchCategories = async () => {
    if (!businessId) return

    try {
      const categoriesQuery = query(
        collection(db, "categories"),
        where("businessId", "==", businessId)
      )
      const snapshot = await getDocs(categoriesQuery)
      const categoryList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[]

      setCategories(categoryList)
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast.error("Failed to load categories")
    }
  }

  const handleAddCategory = async () => {
    const trimmedName = newCategoryName.trim()
    
    if (!trimmedName || !businessId) {
      toast.error("Category name cannot be empty")
      return
    }

    if (categories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error("Category already exists")
      return
    }

    setLoading(true)
    try {
      const docRef = await addDoc(collection(db, "categories"), {
        name: trimmedName,
        businessId,
        createdAt: new Date()
      })

      const newCategory = {
        id: docRef.id,
        name: trimmedName,
        businessId,
        createdAt: new Date()
      }

      setCategories([...categories, newCategory])
      setNewCategoryName("")
      toast.success("Category added successfully")
    } catch (error) {
      console.error("Error adding category:", error)
      toast.error("Failed to add category")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    try {
      await deleteDoc(doc(db, "categories", categoryId))
      setCategories(categories.filter(cat => cat.id !== categoryId))
      toast.success(`"${categoryName}" deleted successfully`)
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error("Failed to delete category")
    }
  }

  const handleEditStart = (category: Category) => {
    setEditingCategory(category.id)
    setEditName(category.name)
  }

  const handleEditSave = async (categoryId: string) => {
    const trimmedName = editName.trim()
    
    if (!trimmedName) {
      toast.error("Category name cannot be empty")
      return
    }

    if (categories.some(cat => cat.id !== categoryId && cat.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error("Category name already exists")
      return
    }

    try {
      await updateDoc(doc(db, "categories", categoryId), {
        name: trimmedName
      })

      setCategories(categories.map(cat => 
        cat.id === categoryId ? { ...cat, name: trimmedName } : cat
      ))
      setEditingCategory(null)
      setEditName("")
      toast.success("Category updated successfully")
    } catch (error) {
      console.error("Error updating category:", error)
      toast.error("Failed to update category")
    }
  }

  const handleEditCancel = () => {
    setEditingCategory(null)
    setEditName("")
  }

  const defaultCategories = ["Yoga", "Cardio", "Strength", "Pilates", "Dance", "Martial Arts", "Swimming", "Other"]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Manage Categories</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create custom categories for your classes. These will be available when creating or editing classes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                disabled={loading}
              />
            </div>
            <Button
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim() || loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
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
            <div className="text-center py-8 text-muted-foreground">
              <p>No custom categories yet.</p>
              <p className="text-sm mt-1">Add your first category above to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                  {editingCategory === category.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") handleEditSave(category.id)
                          if (e.key === "Escape") handleEditCancel()
                        }}
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleEditSave(category.id)}
                        disabled={!editName.trim()}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEditCancel}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium">{category.name}</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditStart(category)}
                        >
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
                              <AlertDialogDescription>
                                Are you sure you want to delete "{category.name}"? This action cannot be undone.
                                Existing classes using this category will keep their current category assignment.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCategory(category.id, category.name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
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
          <p className="text-sm text-muted-foreground mb-3">
            These default categories are always available for your classes:
          </p>
          <div className="flex flex-wrap gap-2">
            {defaultCategories.map((category) => (
              <span
                key={category}
                className="px-2 py-1 bg-muted rounded-md text-sm"
              >
                {category}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 