"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient, getClient, updateClient } from "@/services/clientService"
import { Client } from "@/models/Client"
import { MobileTooltip } from "@/components/MobileTooltip";
import toast from 'react-hot-toast'
import { RefreshCw } from "lucide-react"

interface ClientFormProps {
  clientId?: string // Optional: if provided, we're editing an existing client
}

export default function ClientForm({ clientId }: ClientFormProps) {
  const { user } = useAuth()
  const router = useRouter()
  const isEditing = !!clientId

  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [hasBeenContacted, setHasBeenContacted] = useState(false)

  // Form state
  const [formData, setFormData] = useState<Omit<Client, 'id' | 'createdAt'>>({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    website: "",
    status: "lead",
    lastContactDate: new Date().toISOString().split('T')[0], // Default to today
    notes: "",
    userId: user?.uid || "",
  })

  // Load client data if editing
  useEffect(() => {
    if (isEditing && user) {
      const loadClient = async () => {
        try {
          const client = await getClient(user.uid, clientId)
          if (client) {
            const hasBeenContacted = client.lastContactDate !== "not_contacted";
            setHasBeenContacted(hasBeenContacted);

            // Format date to YYYY-MM-DD for input
            const formattedDate = client.lastContactDate && client.lastContactDate !== "not_contacted"
              ? new Date(client.lastContactDate).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0]

            setFormData({
              name: client.name,
              email: client.email,
              phone: client.phone,
              company: client.company,
              website: client.website,
              address: client.address,
              status: client.status,
              lastContactDate: formattedDate,
              notes: client.notes,
              userId: client.userId,
            })
          }
        } catch (err) {
          setError("Failed to load client data")
          toast.error("Failed to load client data")
        } finally {
          setIsLoading(false)
        }
      }

      loadClient()
    } else {
      setIsLoading(false)
    }
  }, [clientId, isEditing, user])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Add new function to mark the task as completed
  const markClientTaskComplete = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();

      await fetch('/api/user-tasks', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId: "create-client", completed: true })
      });
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSaving(true)

    const loadingToast = toast.loading(isEditing ? "Updating client..." : "Creating client...");

    if (!user) {
      setError("You must be logged in to save a client")
      setIsSaving(false)
      toast.error("You must be logged in to save a client");
      toast.dismiss(loadingToast);
      return
    }

    try {
      const finalData = {
        ...formData,
        lastContactDate: hasBeenContacted ? formData.lastContactDate : "not_contacted"
      };

      if (isEditing) {
        await updateClient(clientId, finalData)
        toast.success("Client updated successfully");
      } else {
        await createClient({
          ...finalData,
          userId: user.uid
        })

        await markClientTaskComplete();

        toast.success("Client created successfully");
      }

      router.push("/clients")
    } catch (err) {
      const errorMessage = `Failed to ${isEditing ? 'update' : 'create'} client`;
      setError(errorMessage)
      console.error(err)
      toast.error(errorMessage);
    } finally {
      setIsSaving(false)
      toast.dismiss(loadingToast);
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-6">Loading client data...</div>
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Client" : "Add New Client"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Buyer Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="status">Status</Label>
                <MobileTooltip
                  content={
                    <div className="space-y-2 max-w-xs">
                      <p><strong>Lead:</strong> A business who we haven't reached out to before (cold)</p>
                      <p><strong>Prospect:</strong> A business we have reached out to and may have shown some interest</p>
                      <p><strong>Client:</strong> An existing business who has purchased from us before</p>
                    </div>
                  }
                />
              </div>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactStatus">Contact Status</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasBeenContacted"
                    checked={hasBeenContacted}
                    onChange={(e) => setHasBeenContacted(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="hasBeenContacted" className="text-sm text-gray-700">
                    Has been contacted
                  </label>
                </div>

                {hasBeenContacted && (
                  <Input
                    id="lastContactDate"
                    name="lastContactDate"
                    type="date"
                    value={formData.lastContactDate}
                    onChange={handleChange}
                  />
                )}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="min-h-[120px]"
                placeholder="Add any notes about this client..."
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEditing ? "Update Client" : "Create Client"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}