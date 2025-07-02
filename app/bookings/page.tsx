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
      active: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
    }

    return (
      <Badge variant="outline" className={statusColors[status] || "bg-gray-100 text-gray-800 border-gray-200"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
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

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">{booking.userEmail}</span>
            </div>
            {getStatusBadge(booking.status)}
          </div>
          
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{formatDate(booking.classDate)}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {formatTime(booking.classStartTime)} - {formatTime(booking.classEndTime)}
            </span>
          </div>
          
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Booked on {formatDate(booking.bookingDate)}
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
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-28 bg-muted animate-pulse rounded"></div>
          </div>
          <div className="h-3 w-20 bg-muted animate-pulse rounded pt-2"></div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading && bookings.length === 0) {
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
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-lg shadow-sm">
            <div className="container mx-auto p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">
                    Bookings
                  </h1>
                  <p className="text-gray-700">
                    View and manage all class bookings
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
                  <div className="text-sm text-gray-600">Total Bookings</div>
                  <div className="text-2xl font-bold text-gray-900">{totalBookings}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="container mx-auto p-4 md:p-8">
            <Tabs defaultValue="all-bookings" className="w-full">
              <TabsList className="mb-6 bg-gradient-to-r from-gray-100 to-blue-100 border border-gray-200">
                <TabsTrigger value="all-bookings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-teal-600 data-[state=active]:text-white">All Bookings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all-bookings">
                <Card>
                  <CardHeader className="pb-4">
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
                        {/* Mobile View - Cards */}
                        <div className="md:hidden space-y-4">
                          {loading ? (
                            Array.from({ length: pageSize }).map((_, index) => (
                              <LoadingCard key={`loading-card-${index}`} />
                            ))
                          ) : (
                            bookings.map((booking) => (
                              <BookingCard key={booking.id} booking={booking} />
                            ))
                          )}
                        </div>

                        {/* Desktop View - Table */}
                        <div className="hidden md:block">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[250px]">User</TableHead>
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
                                  </TableRow>
                                ))
                              ) : (
                                bookings.map((booking) => (
                                  <TableRow key={booking.id} className="hover:bg-muted/50">
                                    <TableCell>
                                      <div className="flex items-center space-x-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                          <div className="font-medium">{booking.userEmail}</div>
                                          <div className="text-xs text-muted-foreground">
                                            ID: {booking.userId.slice(0, 8)}...
                                          </div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center space-x-2">
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        <span>{formatDate(booking.classDate)}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center space-x-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                          <div>{formatTime(booking.classStartTime)}</div>
                                          <div className="text-xs text-muted-foreground">
                                            to {formatTime(booking.classEndTime)}
                                          </div>
                                        </div>
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