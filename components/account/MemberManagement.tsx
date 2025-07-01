"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  CreditCard,
  AlertTriangle,
  Check,
  X,
  UserCheck,
  UserX
} from "lucide-react"
import { collection, doc, getDocs, getDoc, addDoc, deleteDoc, updateDoc, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import toast from "react-hot-toast"
import { format } from "date-fns"

interface GymMember {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  membershipPlan: string
  membershipStatus: "Active" | "Inactive" | "Suspended" | "Expired"
  joinDate: Date
  expirationDate: Date
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
  medicalNotes: string
  notes: string
  businessId: string
  createdAt: Date
}

const membershipPlans = [
  "Basic Monthly",
  "Premium Monthly", 
  "Basic Annual",
  "Premium Annual",
  "Student",
  "Senior",
  "Family",
  "Day Pass"
]

const membershipStatuses = ["Active", "Inactive", "Suspended", "Expired"] as const

export default function MemberManagement() {
  const { user } = useAuth()
  const [members, setMembers] = useState<GymMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<GymMember[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [planFilter, setPlanFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<GymMember | null>(null)
  const [loading, setLoading] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    membershipPlan: "",
    membershipStatus: "Active" as const,
    joinDate: format(new Date(), "yyyy-MM-dd"),
    expirationDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    emergencyContact: {
      name: "",
      phone: "",
      relationship: ""
    },
    medicalNotes: "",
    notes: ""
  })

  // Fetch business ID
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
          }
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

  // Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      if (!businessId) return

      try {
        const membersQuery = query(
          collection(db, "gymMembers"),
          where("businessId", "==", businessId)
        )
        const snapshot = await getDocs(membersQuery)
        const membersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          joinDate: doc.data().joinDate?.toDate() || new Date(),
          expirationDate: doc.data().expirationDate?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as GymMember[]
        
        setMembers(membersList)
        setFilteredMembers(membersList)
      } catch (error) {
        console.error("Error fetching members:", error)
        toast.error("Failed to load members")
      }
    }

    fetchMembers()
  }, [businessId])

  // Filter members
  useEffect(() => {
    let filtered = members

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(member =>
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.phone.includes(searchQuery)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(member => member.membershipStatus === statusFilter)
    }

    // Plan filter
    if (planFilter !== "all") {
      filtered = filtered.filter(member => member.membershipPlan === planFilter)
    }

    setFilteredMembers(filtered)
  }, [members, searchQuery, statusFilter, planFilter])

  const handleAddMember = () => {
    setEditingMember(null)
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      membershipPlan: "",
      membershipStatus: "Active",
      joinDate: format(new Date(), "yyyy-MM-dd"),
      expirationDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      emergencyContact: {
        name: "",
        phone: "",
        relationship: ""
      },
      medicalNotes: "",
      notes: ""
    })
    setIsModalOpen(true)
  }

  const handleEditMember = (member: GymMember) => {
    setEditingMember(member)
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      address: member.address,
      membershipPlan: member.membershipPlan,
      membershipStatus: member.membershipStatus,
      joinDate: format(member.joinDate, "yyyy-MM-dd"),
      expirationDate: format(member.expirationDate, "yyyy-MM-dd"),
      emergencyContact: member.emergencyContact,
      medicalNotes: member.medicalNotes || "",
      notes: member.notes || ""
    })
    setIsModalOpen(true)
  }

  const handleSaveMember = async () => {
    if (!businessId || !formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      const memberData = {
        ...formData,
        joinDate: new Date(formData.joinDate),
        expirationDate: new Date(formData.expirationDate),
        businessId,
        createdAt: editingMember ? editingMember.createdAt : new Date()
      }

      if (editingMember) {
        // Update existing member
        await updateDoc(doc(db, "gymMembers", editingMember.id), memberData)
        setMembers(prev => prev.map(member => 
          member.id === editingMember.id 
            ? { ...memberData, id: editingMember.id } as GymMember
            : member
        ))
        toast.success("Member updated successfully")
      } else {
        // Add new member
        const docRef = await addDoc(collection(db, "gymMembers"), memberData)
        const newMember = { ...memberData, id: docRef.id } as GymMember
        setMembers(prev => [...prev, newMember])
        toast.success("Member added successfully")
      }

      setIsModalOpen(false)
      setEditingMember(null)
    } catch (error) {
      console.error("Error saving member:", error)
      toast.error("Failed to save member")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    try {
      await deleteDoc(doc(db, "gymMembers", memberId))
      setMembers(prev => prev.filter(member => member.id !== memberId))
      toast.success(`${memberName} deleted successfully`)
    } catch (error) {
      console.error("Error deleting member:", error)
      toast.error("Failed to delete member")
    }
  }

  const updateMemberStatus = async (memberId: string, newStatus: GymMember["membershipStatus"]) => {
    try {
      await updateDoc(doc(db, "gymMembers", memberId), {
        membershipStatus: newStatus
      })
      setMembers(prev => prev.map(member =>
        member.id === memberId ? { ...member, membershipStatus: newStatus } : member
      ))
      toast.success("Member status updated")
    } catch (error) {
      console.error("Error updating member status:", error)
      toast.error("Failed to update member status")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800"
      case "Inactive": return "bg-gray-100 text-gray-800"
      case "Suspended": return "bg-red-100 text-red-800"
      case "Expired": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const isExpiringWithin30Days = (expirationDate: Date) => {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    return expirationDate <= thirtyDaysFromNow
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Gym Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage your gym members, memberships, and access
          </p>
        </div>
        <Button onClick={handleAddMember}>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {membershipStatuses.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            {membershipPlans.map(plan => (
              <SelectItem key={plan} value={plan}>{plan}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">Total Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {members.filter(m => m.membershipStatus === "Active").length}
            </div>
            <p className="text-xs text-muted-foreground">Active Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {members.filter(m => isExpiringWithin30Days(m.expirationDate)).length}
            </div>
            <p className="text-xs text-muted-foreground">Expiring Soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {members.filter(m => m.membershipStatus === "Expired").length}
            </div>
            <p className="text-xs text-muted-foreground">Expired</p>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <div className="space-y-4">
        {filteredMembers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No members found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {members.length === 0 
                  ? "Add your first gym member to get started"
                  : "Try adjusting your search or filters"
                }
              </p>
              {members.length === 0 && (
                <Button onClick={handleAddMember}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Member
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredMembers.map((member) => (
            <Card key={member.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold">
                        {member.firstName} {member.lastName}
                      </h4>
                      <Badge className={getStatusColor(member.membershipStatus)}>
                        {member.membershipStatus}
                      </Badge>
                      {isExpiringWithin30Days(member.expirationDate) && member.membershipStatus === "Active" && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Expiring Soon
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {member.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {member.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {member.membershipPlan}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Expires {format(member.expirationDate, "MMM dd, yyyy")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quick Status Actions */}
                    {member.membershipStatus === "Active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateMemberStatus(member.id, "Suspended")}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                    {member.membershipStatus === "Suspended" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateMemberStatus(member.id, "Active")}
                        className="text-green-600 hover:text-green-700"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditMember(member)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Member</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {member.firstName} {member.lastName}? 
                            This action cannot be undone and will remove all member data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteMember(member.id, `${member.firstName} ${member.lastName}`)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Member
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Member Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? "Edit Member" : "Add New Member"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City, State 12345"
                rows={2}
              />
            </div>

            {/* Membership Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="membershipPlan">Membership Plan</Label>
                <Select
                  value={formData.membershipPlan}
                  onValueChange={(value) => setFormData({ ...formData, membershipPlan: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {membershipPlans.map(plan => (
                      <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="membershipStatus">Status</Label>
                <Select
                  value={formData.membershipStatus}
                  onValueChange={(value) => setFormData({ ...formData, membershipStatus: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {membershipStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="joinDate">Join Date</Label>
                <Input
                  id="joinDate"
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expirationDate">Expiration Date</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h4 className="font-medium">Emergency Contact</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyName">Name</Label>
                  <Input
                    id="emergencyName"
                    value={formData.emergencyContact.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                    })}
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Phone</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                    })}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyRelationship">Relationship</Label>
                <Input
                  id="emergencyRelationship"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
                  })}
                  placeholder="Spouse, Parent, Friend, etc."
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="medicalNotes">Medical Notes</Label>
              <Textarea
                id="medicalNotes"
                value={formData.medicalNotes}
                onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                placeholder="Any medical conditions, allergies, or restrictions..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">General Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes about this member..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMember} disabled={loading}>
              {editingMember ? "Update Member" : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 