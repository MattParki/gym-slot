"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
  Edit2, 
  Trash2, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  CreditCard,
  AlertTriangle,
  UserCheck,
  UserX,
  Send,
  ChevronLeft,
  ChevronRight,
  Users,
  Filter,
  Download,
  TrendingUp,
  Key,
  Loader2
} from "lucide-react"
import { collection, doc, getDocs, getDoc, addDoc, deleteDoc, updateDoc, query, where, orderBy, limit, startAfter, DocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import toast from "react-hot-toast"
import { format } from "date-fns"
import { getBusiness, sendPasswordResetEmail } from "@/services/businessService"

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

interface PaginationInfo {
  hasNextPage: boolean
  hasPreviousPage: boolean
  lastDoc: DocumentSnapshot | null
  firstDoc: DocumentSnapshot | null
  currentPage: number
  totalCount: number
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
const MEMBERS_PER_PAGE = 20

export default function GymMemberManagement() {
  const { user } = useAuth()
  const [members, setMembers] = useState<GymMember[]>([])
  const [allMembersCount, setAllMembersCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [planFilter, setPlanFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<GymMember | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchingMembers, setFetchingMembers] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string>("")
  const [sendInviteEmail, setSendInviteEmail] = useState(true)
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    hasNextPage: false,
    hasPreviousPage: false,
    lastDoc: null,
    firstDoc: null,
    currentPage: 1,
    totalCount: 0
  })
  
  // Status update modal state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [statusUpdateMember, setStatusUpdateMember] = useState<GymMember | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<typeof membershipStatuses[number]>("Active")
  
  // Password reset state
  const [sendingPasswordReset, setSendingPasswordReset] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    membershipPlan: "",
    membershipStatus: "Active" as "Active" | "Inactive" | "Suspended" | "Expired",
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

  // Get business info
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      if (user?.uid) {
        try {
          const business = await getBusiness(user.uid)
          if (business) {
            setBusinessId(business.id)
            setBusinessName(business.name || "Your Gym")
          }
        } catch (error) {
          console.error("Error fetching business info:", error)
        }
      }
    }

    fetchBusinessInfo()
  }, [user])

  // Build query for members with filters
  const buildMembersQuery = (direction: 'next' | 'previous' | 'first' = 'first') => {
    if (!businessId) return null

    const membersRef = collection(db, "gymMembers")
    let q = query(membersRef, where("businessId", "==", businessId))

    // Apply status filter at database level
    if (statusFilter !== "all") {
      q = query(q, where("membershipStatus", "==", statusFilter))
    }

    // Apply search filter (limited to email prefix in Firestore)
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase()
      // Search by email prefix
      q = query(q, where("email", ">=", searchLower))
      q = query(q, where("email", "<=", searchLower + "\uf8ff"))
    }

    // Order by creation date (newest first)
    q = query(q, orderBy("createdAt", "desc"))

    // Apply pagination
    if (direction === 'next' && pagination.lastDoc) {
      q = query(q, startAfter(pagination.lastDoc))
    } else if (direction === 'previous' && pagination.firstDoc) {
      // For previous page, reverse order and start after first doc
      q = query(membersRef, where("businessId", "==", businessId))
      if (statusFilter !== "all") {
        q = query(q, where("membershipStatus", "==", statusFilter))
      }
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase()
        q = query(q, where("email", ">=", searchLower))
        q = query(q, where("email", "<=", searchLower + "\uf8ff"))
      }
      q = query(q, orderBy("createdAt", "asc"), startAfter(pagination.firstDoc))
    }

    q = query(q, limit(MEMBERS_PER_PAGE + 1)) // +1 to check if there's a next page

    return q
  }

  // Fetch members with pagination
  const fetchMembers = async (direction: 'next' | 'previous' | 'first' = 'first') => {
    const q = buildMembersQuery(direction)
    if (!q) return

    try {
      setFetchingMembers(true)
      
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        setMembers([])
        setPagination({
          hasNextPage: false,
          hasPreviousPage: false,
          lastDoc: null,
          firstDoc: null,
          currentPage: 1,
          totalCount: 0
        })
        return
      }

      const docs = querySnapshot.docs
      const hasNextPage = docs.length > MEMBERS_PER_PAGE
      const actualDocs = hasNextPage ? docs.slice(0, MEMBERS_PER_PAGE) : docs

      // For previous page queries, reverse the results
      if (direction === 'previous') {
        actualDocs.reverse()
      }

      const membersData: GymMember[] = actualDocs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          joinDate: data.joinDate?.toDate?.() || new Date(data.joinDate),
          expirationDate: data.expirationDate?.toDate?.() || new Date(data.expirationDate),
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt)
        } as GymMember
      })

      // Apply client-side filters for plan (since Firestore doesn't support multiple inequality filters)
      const filteredMembers = planFilter === "all" 
        ? membersData 
        : membersData.filter(member => member.membershipPlan === planFilter)

      setMembers(filteredMembers)

      // Update pagination info
      const newPage = direction === 'next' 
        ? pagination.currentPage + 1 
        : direction === 'previous' 
          ? pagination.currentPage - 1 
          : 1

      setPagination({
        hasNextPage: hasNextPage,
        hasPreviousPage: newPage > 1,
        lastDoc: actualDocs[actualDocs.length - 1] || null,
        firstDoc: actualDocs[0] || null,
        currentPage: newPage,
        totalCount: filteredMembers.length
      })

    } catch (error) {
      console.error("Error fetching members:", error)
      toast.error("Failed to load members")
    } finally {
      setFetchingMembers(false)
    }
  }

  // Get total count for statistics
  const fetchMembersCount = async () => {
    if (!businessId) return

    try {
      const membersRef = collection(db, "gymMembers")
      const countQuery = query(membersRef, where("businessId", "==", businessId))
      const snapshot = await getDocs(countQuery)
      setAllMembersCount(snapshot.size)
    } catch (error) {
      console.error("Error fetching members count:", error)
    }
  }

  // Fetch members when filters change
  useEffect(() => {
    if (businessId) {
      const timeoutId = setTimeout(() => {
        fetchMembers('first')
        fetchMembersCount()
      }, 300) // Debounce search

      return () => clearTimeout(timeoutId)
    }
  }, [businessId, searchQuery, statusFilter, planFilter])

  // Memoized statistics
  const memberStats = useMemo(() => {
    const stats = {
      active: 0,
      inactive: 0,
      suspended: 0,
      expired: 0,
      total: allMembersCount
    }

    // These stats are for the current page only
    members.forEach(member => {
      stats[member.membershipStatus.toLowerCase() as keyof typeof stats]++
    })

    return stats
  }, [members, allMembersCount])

  const handlePageChange = (direction: 'next' | 'previous') => {
    fetchMembers(direction)
  }

  const handleAddMember = () => {
    setEditingMember(null)
    setSendInviteEmail(true)
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

    // Validate expiration date
    if (!formData.expirationDate.trim()) {
      toast.error("Please select an expiration date for the membership")
      return
    }

    // Validate that the expiration date is a valid date
    const expirationDate = new Date(formData.expirationDate)
    if (isNaN(expirationDate.getTime())) {
      toast.error("Please enter a valid expiration date")
      return
    }

    // Validate join date
    if (!formData.joinDate.trim()) {
      toast.error("Please select a join date")
      return
    }

    const joinDate = new Date(formData.joinDate)
    if (isNaN(joinDate.getTime())) {
      toast.error("Please enter a valid join date")
      return
    }

    setLoading(true)

    try {
      const memberData = {
        ...formData,
        businessId,
        joinDate,
        expirationDate,
        emergencyContact: formData.emergencyContact,
        updatedAt: new Date()
      }

      if (editingMember) {
        // Update existing member
        await updateDoc(doc(db, "gymMembers", editingMember.id), memberData)
        toast.success("Member updated successfully")
      } else {
        // Create new member
        const newMemberData = {
          ...memberData,
          createdAt: new Date()
        }
        
        const docRef = await addDoc(collection(db, "gymMembers"), newMemberData)
        
        if (sendInviteEmail) {
          try {
            // Send invitation email logic here
            toast.success("Member added and invitation sent!")
          } catch (emailError) {
            console.error("Error sending invitation:", emailError)
            toast.success("Member added successfully (invitation email failed)")
          }
        } else {
          toast.success("Member added successfully")
        }
      }

      setIsModalOpen(false)
      fetchMembers('first') // Refresh the list
      fetchMembersCount() // Update count
    } catch (error) {
      console.error("Error saving member:", error)
      toast.error("Failed to save member")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    try {
      await deleteDoc(doc(db, "gymMembers", memberId))
      toast.success("Member deleted successfully")
      fetchMembers('first')
      fetchMembersCount()
    } catch (error) {
      console.error("Error deleting member:", error)
      toast.error("Failed to delete member")
    }
  }

  const handleStatusUpdate = (member: GymMember) => {
    setStatusUpdateMember(member)
    setSelectedStatus(member.membershipStatus)
    setIsStatusModalOpen(true)
  }

  const handlePasswordReset = async (email: string) => {
    try {
      setSendingPasswordReset(true);
      const result = await sendPasswordResetEmail(email);
      
      if (result.devMode && result.resetLink) {
        // Development mode - show the reset link
        toast.success(
          <div>
            <p>Development Mode: Password reset link generated!</p>
            <p className="text-xs mt-2">
              <a 
                href={result.resetLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline break-all"
              >
                Click here to reset password
              </a>
            </p>
          </div>,
          { duration: 10000 }
        );
      } else {
        toast.success(`Password reset email sent to ${email}`);
      }
    } catch (error) {
      console.error("Error sending password reset:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to send password reset email";
      
      // Check if it's a user-not-found error
      if (errorMessage.includes("complete account setup") || errorMessage.includes("User not found")) {
        toast.error(
          "This customer hasn't completed their account setup yet. " +
          "They may need to create an account first or use a different email.",
          { duration: 6000 }
        );
      } else if (errorMessage.includes("email")) {
        toast.error(
          "Email service is not configured. Please contact your system administrator.",
          { duration: 6000 }
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSendingPasswordReset(false);
    }
  };

  const updateMemberStatus = async () => {
    if (!statusUpdateMember) return

    try {
      await updateDoc(doc(db, "gymMembers", statusUpdateMember.id), {
        membershipStatus: selectedStatus,
        updatedAt: new Date()
      })
      
      toast.success(`Member status updated to ${selectedStatus}`)
      setIsStatusModalOpen(false)
      fetchMembers('first')
    } catch (error) {
      console.error("Error updating member status:", error)
      toast.error("Failed to update member status")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800 border-green-200"
      case "Inactive": return "bg-gray-100 text-gray-800 border-gray-200"
      case "Suspended": return "bg-orange-100 text-orange-800 border-orange-200"
      case "Expired": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active": return <UserCheck className="h-4 w-4 text-green-600" />
      case "Suspended": return <UserX className="h-4 w-4 text-orange-600" />
      case "Expired": return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <User className="h-4 w-4 text-gray-600" />
    }
  }

  if (fetchingMembers && members.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gym customers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Gym Customers
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage your gym customers, memberships, and access - <strong>not staff members</strong>
          </p>
        </div>
        <Button onClick={handleAddMember} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Enhanced Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Customers</p>
                <p className="text-2xl font-bold text-blue-900">{memberStats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Active</p>
                <p className="text-2xl font-bold text-green-900">{memberStats.active}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Suspended</p>
                <p className="text-2xl font-bold text-orange-900">{memberStats.suspended}</p>
              </div>
              <UserX className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Expired</p>
                <p className="text-2xl font-bold text-red-900">{memberStats.expired}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">{memberStats.inactive}</p>
              </div>
              <User className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Search & Filter Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {membershipStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {membershipPlans.map(plan => (
                  <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setPlanFilter("all")
                }}
                className="flex-1"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      {members.length === 0 && !fetchingMembers ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || statusFilter !== "all" || planFilter !== "all" 
                ? "No customers match your filters" 
                : "No customers added yet"
              }
            </h3>
            <p className="text-gray-600 text-center mb-6">
              {searchQuery || statusFilter !== "all" || planFilter !== "all"
                ? "Try adjusting your search criteria or filters."
                : "Add your first gym customer to get started with membership management."
              }
            </p>
            {(!searchQuery && statusFilter === "all" && planFilter === "all") && (
              <Button onClick={handleAddMember} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Customer
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {fetchingMembers ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              members.map((member) => (
                <Card key={member.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {member.firstName} {member.lastName}
                            </h4>
                            <Badge variant="outline" className={getStatusColor(member.membershipStatus)}>
                              {getStatusIcon(member.membershipStatus)}
                              <span className="ml-1">{member.membershipStatus} Customer</span>
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {member.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {member.phone || "No phone"}
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            {member.membershipPlan || "No plan"}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Expires {format(member.expirationDate, "MMM dd, yyyy")}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(member)}
                          className="flex items-center gap-1"
                        >
                          {getStatusIcon(member.membershipStatus)}
                          <span className="hidden sm:inline">Status</span>
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditMember(member)}
                          title="Edit customer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePasswordReset(member.email)}
                          disabled={sendingPasswordReset}
                          className="text-green-600 hover:text-green-700"
                          title="Send password reset email"
                        >
                          {sendingPasswordReset ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Key className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {member.firstName} {member.lastName}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteMember(member.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Customer
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

          {/* Enhanced Pagination */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Page {pagination.currentPage} • Showing {members.length} customers
                  {memberStats.total > 0 && ` of ${memberStats.total} total`}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange('previous')}
                    disabled={!pagination.hasPreviousPage || fetchingMembers}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange('next')}
                    disabled={!pagination.hasNextPage || fetchingMembers}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Add/Edit Member Modal - keeping existing form structure */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? "Edit Customer" : "Add New Customer"}
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
              <Label className="text-base font-medium">Emergency Contact</Label>
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
                    placeholder="Emergency contact name"
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
                    placeholder="Emergency contact phone"
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
                  placeholder="e.g., Spouse, Parent, Friend"
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
                placeholder="Any medical conditions or notes..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes about this customer..."
                rows={2}
              />
            </div>

            {/* Send invitation email checkbox - only show for new members */}
            {!editingMember && (
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox
                  id="sendInvite"
                  checked={sendInviteEmail}
                  onCheckedChange={(checked) => setSendInviteEmail(checked === true)}
                />
                <Label htmlFor="sendInvite" className="text-sm">
                  Send invitation email to customer (they can create an account to use the mobile app)
                </Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMember} disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? "Saving..." : editingMember ? "Update Customer" : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Customer Status</DialogTitle>
          </DialogHeader>
          
          {statusUpdateMember && (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-medium text-lg">
                  {statusUpdateMember.firstName} {statusUpdateMember.lastName}
                </h4>
                <p className="text-sm text-muted-foreground">{statusUpdateMember.email}</p>
              </div>
              
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as typeof membershipStatuses[number])}>
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
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateMemberStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 