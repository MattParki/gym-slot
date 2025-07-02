"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"
import LayoutWrapper from "@/components/LayoutWrapper"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination } from "@/components/ui/pagination"  
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import toast from "react-hot-toast"
import { Users, Mail, UserCheck, Loader2, Calendar, UserPlus, Send } from "lucide-react"
import { format } from "date-fns"

interface Member {
  email: string
  joinedAt: string
  role?: string
  status?: string
  name?: string
}

export default function MembersPage() {
  const { user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalMembers, setTotalMembers] = useState(0)
  const [businessName, setBusinessName] = useState("")
  const [businessId, setBusinessId] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  
  const pageSize = 10
  const totalPages = Math.ceil(totalMembers / pageSize)

  const fetchMembers = async (page: number = 1) => {
    if (!user?.email) return
    
    try {
      setLoading(true)
      const businessesRef = collection(db, "businesses")
      
      // Find the business owned by the current user
      const businessQuery = query(businessesRef, where("email", "==", user.email))
      const businessSnapshot = await getDocs(businessQuery)
      
      if (businessSnapshot.empty) {
        console.log("No business found for user")
        setMembers([])
        setTotalMembers(0)
        return
      }

      const businessDoc = businessSnapshot.docs[0]
      const businessData = businessDoc.data()
      setBusinessName(businessData.name || "Your Business")
      setBusinessId(businessDoc.id)
      
      // Get members from the business and ensure they have proper date formatting
      const businessMembers = (businessData.members || []).map((member: any) => ({
        ...member,
        joinedAt: member.joinedAt || member.createdAt || new Date().toISOString(),
        status: member.status || "active",
        role: member.role || "member"
      }))
      
      // Set total count
      setTotalMembers(businessMembers.length)
      
      // Calculate offset for the page
      const offset = (page - 1) * pageSize
      
      // Get the members for the current page
      const pageMembers = businessMembers.slice(offset, offset + pageSize)
      setMembers(pageMembers)
      
    } catch (error) {
      console.error("Error fetching members:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchMembers(1)
      setCurrentPage(1)
    }
  }, [user])

  const handlePageChange = (page: number) => {
    if (page === currentPage) return
    
    setCurrentPage(page)
    fetchMembers(page)
  }

  const sendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address")
      return
    }

    if (!businessId) {
      toast.error("Business not found")
      return
    }

    try {
      setInviteLoading(true)
      
      const response = await fetch("/api/send-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          businessId: businessId,
          businessName: businessName
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send invite")
      }

      toast.success(`Invite sent to ${inviteEmail}`)
      setInviteEmail("")
      setIsInviteDialogOpen(false)
      
      // Optionally refresh members list
      fetchMembers(currentPage)
      
    } catch (error) {
      console.error("Error sending invite:", error)
      toast.error(error instanceof Error ? error.message : "Failed to send invite")
    } finally {
      setInviteLoading(false)
    }
  }

  const getStatusBadge = (status: string = "active") => {
    const statusColors: { [key: string]: string } = {
      active: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      inactive: "bg-red-100 text-red-800 border-red-200",
      suspended: "bg-orange-100 text-orange-800 border-orange-200",
    }

    return (
      <Badge variant="outline" className={statusColors[status] || "bg-gray-100 text-gray-800 border-gray-200"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getRoleBadge = (role: string = "member") => {
    const roleColors: { [key: string]: string } = {
      admin: "bg-purple-100 text-purple-800 border-purple-200",
      manager: "bg-blue-100 text-blue-800 border-blue-200",
      trainer: "bg-indigo-100 text-indigo-800 border-indigo-200",
      member: "bg-gray-100 text-gray-800 border-gray-200",
    }

    return (
      <Badge variant="outline" className={roleColors[role] || "bg-gray-100 text-gray-800 border-gray-200"}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "MMM d, yyyy")
    } catch {
      return dateString
    }
  }

  const MemberCard = ({ member }: { member: Member }) => (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">{member.name || member.email}</span>
            </div>
            {getStatusBadge(member.status)}
          </div>
          
          {member.name && (
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{member.email}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              {getRoleBadge(member.role)}
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Joined {formatDate(member.joinedAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const LoadingCard = () => (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
            </div>
            <div className="h-6 w-16 bg-muted animate-pulse rounded-full"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
              <div className="h-6 w-16 bg-muted animate-pulse rounded-full"></div>
            </div>
          </div>
          <div className="h-3 w-20 bg-muted animate-pulse rounded pt-2"></div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading && members.length === 0) {
    return (
      <ProtectedRoute>
        <LayoutWrapper>
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </LayoutWrapper>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <LayoutWrapper>
        <div className="min-h-screen flex flex-col">
          <div className="bg-gradient-to-r from-[#141E33] to-[#1a2442] text-white rounded-lg">
            <div className="container mx-auto p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    Members
                  </h1>
                  <p className="text-white/80">
                    Manage your gym members and their information
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <div className="text-sm text-white/70">Total Members</div>
                  <div className="text-2xl font-bold">{totalMembers}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="container mx-auto p-4 md:p-8">
            <Tabs defaultValue="all-members" className="w-full">
              <TabsList className="mb-6 bg-gradient-to-r from-gray-100 to-blue-100 border border-gray-200">
                <TabsTrigger value="all-members" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-teal-600 data-[state=active]:text-white">All Members</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all-members">
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle>Gym Members</CardTitle>
                        <CardDescription>
                          All members registered at {businessName}
                        </CardDescription>
                      </div>
                      
                      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-[#141E33] hover:bg-[#1a2442] text-white w-full sm:w-auto">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Invite Member
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] p-0 gap-0">
                          <div className="bg-gradient-to-r from-[#141E33] to-[#1a2442] p-6 rounded-t-lg">
                            <DialogHeader className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <div className="bg-white/20 p-2 rounded-full">
                                  <UserPlus className="h-5 w-5 text-white" />
                                </div>
                                <DialogTitle className="text-xl text-white">Invite New Member</DialogTitle>
                              </div>
                              <DialogDescription className="text-white/80">
                                Send an invitation to join <span className="font-semibold">{businessName}</span> as a member
                              </DialogDescription>
                            </DialogHeader>
                          </div>
                          
                          <div className="p-6 space-y-6">
                            <div className="space-y-3">
                              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                Email Address
                              </Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  id="email"
                                  type="email"
                                  placeholder="member@example.com"
                                  value={inviteEmail}
                                  onChange={(e) => setInviteEmail(e.target.value)}
                                  className="pl-10 h-12 text-base"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      sendInvite()
                                    }
                                  }}
                                />
                              </div>
                              <p className="text-sm text-gray-500">
                                They'll receive an email with a link to join your gym
                              </p>
                            </div>
                          </div>
                          
                          <DialogFooter className="p-6 pt-0 flex-col sm:flex-row gap-3">
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={() => {
                                setIsInviteDialogOpen(false)
                                setInviteEmail("")
                              }}
                              className="w-full sm:w-auto"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="button" 
                              onClick={sendInvite}
                              disabled={inviteLoading || !inviteEmail.trim()}
                              className="w-full sm:w-auto bg-[#141E33] hover:bg-[#1a2442]"
                            >
                              {inviteLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Sending Invite...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2" />
                                  Send Invitation
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {members.length === 0 && !loading ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No members found</h3>
                        <p className="text-muted-foreground text-center">
                          There are no members to display at the moment.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Mobile View - Cards */}
                        <div className="md:hidden space-y-4">
                          {loading ? (
                            Array.from({ length: pageSize }).map((_, index) => (
                              <LoadingCard key={`loading-card-${index}`} />
                            ))
                          ) : (
                            members.map((member, index) => (
                              <MemberCard key={`${member.email}-${index}`} member={member} />
                            ))
                          )}
                        </div>

                        {/* Desktop View - Table */}
                        <div className="hidden md:block">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[250px]">Member</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {loading ? (
                                // Loading skeleton rows
                                Array.from({ length: pageSize }).map((_, index) => (
                                  <TableRow key={`skeleton-${index}`}>
                                    <TableCell>
                                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                members.map((member, index) => (
                                  <TableRow key={`${member.email}-${index}`} className="hover:bg-muted/50">
                                    <TableCell>
                                      <div className="flex items-center space-x-2">
                                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                          <div className="font-medium">{member.name || member.email}</div>
                                          {member.name && (
                                            <div className="text-xs text-muted-foreground">
                                              {member.email}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center space-x-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        {getRoleBadge(member.role)}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {getStatusBadge(member.status)}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      <div className="flex items-center space-x-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>{formatDate(member.joinedAt)}</span>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                        
                        {totalPages > 1 && (
                          <div className="flex justify-center py-4">
                            <Pagination
                              currentPage={currentPage}
                              totalPages={totalPages}
                              onPageChange={handlePageChange}
                              loading={loading}
                              mode="pages"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </LayoutWrapper>
    </ProtectedRoute>
  )
} 