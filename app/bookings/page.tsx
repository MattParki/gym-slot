"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
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
import { CalendarIcon, Clock, User, Mail, Loader2 } from "lucide-react"
import { format } from "date-fns"

interface Booking {
  id: string
  bookingDate: string
  classDate: string
  classEndTime: string
  classId: string
  classStartTime: string
  scheduledClassId: string
  status: string
  userEmail: string
  userId: string
}

export default function BookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalBookings, setTotalBookings] = useState(0)
  
  const pageSize = 10
  const totalPages = Math.ceil(totalBookings / pageSize)

  const fetchBookings = async (page: number = 1) => {
    try {
      setLoading(true)
      const bookingsRef = collection(db, "bookings")
      
      // Calculate offset for the page
      const offset = (page - 1) * pageSize
      
      // For simplicity, we'll fetch all bookings and slice them
      // In a production app, you'd want server-side pagination
      const q = query(bookingsRef, orderBy("bookingDate", "desc"))
      const querySnapshot = await getDocs(q)
      
      const allBookings: Booking[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[]

      // Set total count
      setTotalBookings(allBookings.length)
      
      // Get the bookings for the current page
      const pageBookings = allBookings.slice(offset, offset + pageSize)
      setBookings(pageBookings)
      
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchBookings(1)
      setCurrentPage(1)
    }
  }, [user])

  const handlePageChange = (page: number) => {
    if (page === currentPage) return
    
    setCurrentPage(page)
    fetchBookings(page)
  }

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      active: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    }

    return (
      <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "PPP")
    } catch {
      return dateString
    }
  }

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(":")
      const date = new Date()
      date.setHours(parseInt(hours), parseInt(minutes))
      return format(date, "h:mm a")
    } catch {
      return timeString
    }
  }

  if (loading) {
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
          <div className="bg-[#141E33] text-white rounded-lg">
            <div className="container mx-auto p-8 md:py-8">
                              <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-4xl md:text-4xl font-bold mb-4">
                      Bookings
                    </h1>
                    <p className="text-white/80">
                      View and manage all class bookings
                    </p>
                  </div>
                  <div className="text-sm text-white/70">
                    {totalBookings} total bookings
                  </div>
                </div>
            </div>
          </div>
          
          <div className="container mx-auto p-4 md:p-8">
            <Tabs defaultValue="all-bookings" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="all-bookings">All Bookings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all-bookings">
                <Card>
                  <CardHeader>
                    <CardTitle>Class Bookings</CardTitle>
                    <CardDescription>
                      All booking records for your gym classes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bookings.length === 0 && !loading ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
                        <p className="text-muted-foreground text-center">
                          There are no bookings to display at the moment.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Booking ID</TableHead>
                              <TableHead>User</TableHead>
                              <TableHead>Class Date</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Booked On</TableHead>
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
                                  <TableCell>
                                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              bookings.map((booking) => (
                                <TableRow key={booking.id} className="hover:bg-muted/50">
                                  <TableCell className="font-medium">
                                    {booking.id.slice(0, 8)}...
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{booking.userEmail}</span>
                                      <span className="text-sm text-muted-foreground">
                                        {booking.userId.slice(0, 8)}...
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {formatDate(booking.classDate)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span>{formatTime(booking.classStartTime)}</span>
                                      <span className="text-sm text-muted-foreground">
                                        to {formatTime(booking.classEndTime)}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {getStatusBadge(booking.status)}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {formatDate(booking.bookingDate)}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                        
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