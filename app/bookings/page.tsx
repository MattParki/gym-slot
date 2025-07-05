"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, limit, startAfter, where, DocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"
import LayoutWrapper from "@/components/LayoutWrapper"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { CalendarIcon, Clock, User, Mail, Loader2, Filter, X, Search, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

interface GymClass {
  id: string
  name: string
  description: string
  category: string
  instructor: string
  color: string
  capacity: number
  duration: number
}

interface EnhancedBooking extends Booking {
  className?: string
  classCategory?: string
  classColor?: string
  instructor?: string
}

interface PaginationInfo {
  hasNextPage: boolean
  hasPreviousPage: boolean
  lastDoc: DocumentSnapshot | null
  firstDoc: DocumentSnapshot | null
  currentPage: number
  totalPages: number
  totalCount: number
}

export default function BookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<EnhancedBooking[]>([])
  const [classes, setClasses] = useState<GymClass[]>([])
  const [classesMap, setClassesMap] = useState<Map<string, GymClass>>(new Map())
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [pagination, setPagination] = useState<PaginationInfo>({
    hasNextPage: false,
    hasPreviousPage: false,
    lastDoc: null,
    firstDoc: null,
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  })
  const [error, setError] = useState<string | null>(null)
  
  const pageSize = 20 // Increased for better performance
  const availableCategories = [...new Set(classes.map(cls => cls.category))].sort()

  // Cache for efficient class lookups
  const fetchClasses = async () => {
    try {
      const classesSnapshot = await getDocs(collection(db, "classes"))
      const classesData: GymClass[] = classesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as GymClass[]
      
      console.log(`Loaded ${classesData.length} classes:`, classesData.map(c => ({ id: c.id, name: c.name })))
      
      setClasses(classesData)
      
      // Create a Map for O(1) lookups
      const classMap = new Map<string, GymClass>()
      classesData.forEach(cls => classMap.set(cls.id, cls))
      setClassesMap(classMap)
      
      console.log(`Classes map populated with ${classMap.size} entries`)
      
      return classesData
    } catch (error) {
      console.error("Error fetching classes:", error)
      setError("Failed to load class information")
      return []
    }
  }

  const buildQuery = (direction: 'next' | 'previous' | 'first' = 'first') => {
    const bookingsRef = collection(db, "bookings")
    let q = query(bookingsRef)

    // Apply filters at database level
    if (selectedStatus !== "all") {
      q = query(q, where("status", "==", selectedStatus))
    }

    // Add search filter (Note: This is limited with Firestore - consider using Algolia for full-text search)
    if (searchTerm) {
      // For now, we'll search by email prefix - limited but functional
      q = query(q, where("userEmail", ">=", searchTerm.toLowerCase()))
      q = query(q, where("userEmail", "<=", searchTerm.toLowerCase() + "\uf8ff"))
    }

    // Order by booking date (newest first)
    q = query(q, orderBy("bookingDate", "desc"))

    // Apply pagination
    if (direction === 'next' && pagination.lastDoc) {
      q = query(q, startAfter(pagination.lastDoc))
    } else if (direction === 'previous' && pagination.firstDoc) {
      // For previous page, we need to reverse the order and use startAfter
      q = query(bookingsRef, orderBy("bookingDate", "asc"))
      if (selectedStatus !== "all") {
        q = query(q, where("status", "==", selectedStatus))
      }
      if (searchTerm) {
        q = query(q, where("userEmail", ">=", searchTerm.toLowerCase()))
        q = query(q, where("userEmail", "<=", searchTerm.toLowerCase() + "\uf8ff"))
      }
      q = query(q, startAfter(pagination.firstDoc), limit(pageSize))
    }

    q = query(q, limit(pageSize + 1)) // +1 to check if there's a next page

    return q
  }

  const fetchBookings = async (direction: 'next' | 'previous' | 'first' = 'first') => {
    try {
      setLoading(true)
      setError(null)
      
      const q = buildQuery(direction)
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        setBookings([])
        setPagination({
          hasNextPage: false,
          hasPreviousPage: false,
          lastDoc: null,
          firstDoc: null,
          currentPage: 1,
          totalPages: 1,
          totalCount: 0
        })
        return
      }

      const docs = querySnapshot.docs
      const hasNextPage = docs.length > pageSize
      const actualDocs = hasNextPage ? docs.slice(0, pageSize) : docs

      // For previous page queries, reverse the results
      if (direction === 'previous') {
        actualDocs.reverse()
      }

      const bookingsData: EnhancedBooking[] = actualDocs.map((doc) => {
        const booking = { id: doc.id, ...doc.data() } as Booking
        const relatedClass = classesMap.get(booking.classId)
        
        // Debug logging for missing classes
        if (!relatedClass) {
          console.warn(`❌ No class found for classId: ${booking.classId}`, {
            bookingId: booking.id,
            userEmail: booking.userEmail,
            availableClassIds: Array.from(classesMap.keys()),
            classesMapSize: classesMap.size
          })
        } else {
          console.log(`✅ Found class for booking:`, {
            bookingId: booking.id,
            classId: booking.classId,
            className: relatedClass.name
          })
        }
        
        return {
          ...booking,
          className: relatedClass?.name || `Unknown Class (ID: ${booking.classId})`,
          classCategory: relatedClass?.category || 'Unknown',
          classColor: relatedClass?.color || '#6b7280',
          instructor: relatedClass?.instructor || 'Unknown Instructor'
        }
      })

      console.log(`Processed ${bookingsData.length} bookings with class info`)
      
      // Summary of class ID matches
      const classIdCounts = bookingsData.reduce((acc, booking) => {
        const originalBooking = { id: booking.id, ...actualDocs.find(doc => doc.id === booking.id)?.data() } as Booking
        acc[originalBooking.classId] = (acc[originalBooking.classId] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      console.log('📊 Class ID usage in bookings:', classIdCounts)
      console.log('📋 Available classes:', Array.from(classesMap.entries()).map(([id, cls]) => ({ id, name: cls.name })))

      // Filter by category on client side (since Firestore doesn't support nested queries easily)
      const filteredBookings = selectedCategory === "all" 
        ? bookingsData 
        : bookingsData.filter(booking => booking.classCategory === selectedCategory)

      setBookings(filteredBookings)

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
        totalPages: Math.max(1, newPage + (hasNextPage ? 1 : 0)), // Approximate
        totalCount: filteredBookings.length // This is per page, not total
      })

    } catch (error) {
      console.error("Error fetching bookings:", error)
      setError("Failed to load bookings. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Debounced search to avoid too many queries
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only fetch bookings if user is authenticated AND classes are loaded
      if (user && classesMap.size > 0) {
        fetchBookings('first')
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [user, selectedCategory, selectedStatus, searchTerm, classesMap])

  // Initialize classes on mount and fetch bookings when ready
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        await fetchClasses()
        // Classes are now loaded, fetchBookings will be triggered by the above useEffect
      }
    }
    
    loadData()
  }, [user])

  const handlePageChange = (direction: 'next' | 'previous') => {
    // Only paginate if classes are loaded
    if (classesMap.size > 0) {
      fetchBookings(direction)
    }
  }

  const clearFilters = () => {
    setSelectedCategory("all")
    setSelectedStatus("all")
    setSearchTerm("")
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

  const getCategoryBadge = (category: string, color: string) => {
    return (
      <Badge 
        variant="outline" 
        className="border-opacity-50"
        style={{ 
          backgroundColor: `${color}20`, 
          borderColor: color,
          color: color 
        }}
      >
        {category}
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

  const BookingCard = ({ booking }: { booking: EnhancedBooking }) => (
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
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm">{booking.className}</span>
            </div>
            {getCategoryBadge(booking.classCategory || 'Unknown', booking.classColor || '#gray')}
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
            Instructor: {booking.instructor} • Booked on {formatDate(booking.bookingDate)}
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
                    View and manage class bookings with advanced filtering
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
                  <div className="text-sm text-gray-600">Current Page</div>
                  <div className="text-2xl font-bold text-gray-900">{bookings.length} bookings</div>
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
                      Efficiently browse through all booking records with server-side filtering
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {error && (
                      <Alert className="mb-4" variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Enhanced Filter Controls */}
                    <div className="flex flex-col gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Filter & Search:</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Class Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Class Types</SelectItem>
                            {availableCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {(selectedCategory !== "all" || selectedStatus !== "all" || searchTerm) && (
                          <Button 
                            variant="outline" 
                            onClick={clearFilters}
                            className="whitespace-nowrap"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Clear All
                          </Button>
                        )}
                      </div>
                    </div>

                    {bookings.length === 0 && !loading ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
                        <p className="text-muted-foreground text-center">
                          {selectedCategory !== "all" || selectedStatus !== "all" || searchTerm
                            ? "No bookings match your current filters. Try adjusting your search criteria."
                            : "There are no bookings to display at the moment."
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Mobile View - Cards */}
                        <div className="md:hidden space-y-4">
                          {loading ? (
                            Array.from({ length: 5 }).map((_, index) => (
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
                                <TableHead className="w-[200px]">User</TableHead>
                                <TableHead className="w-[200px]">Class</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Booked On</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                  <TableRow key={`skeleton-${index}`}>
                                    <TableCell><div className="h-4 bg-muted animate-pulse rounded"></div></TableCell>
                                    <TableCell><div className="h-4 bg-muted animate-pulse rounded"></div></TableCell>
                                    <TableCell><div className="h-4 bg-muted animate-pulse rounded"></div></TableCell>
                                    <TableCell><div className="h-4 bg-muted animate-pulse rounded"></div></TableCell>
                                    <TableCell><div className="h-4 bg-muted animate-pulse rounded"></div></TableCell>
                                    <TableCell><div className="h-4 bg-muted animate-pulse rounded"></div></TableCell>
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
                                      <div className="space-y-1">
                                        <div className="font-medium">{booking.className}</div>
                                        <div className="flex items-center gap-2">
                                          {getCategoryBadge(booking.classCategory || 'Unknown', booking.classColor || '#gray')}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {booking.instructor}
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
                        
                        {/* Improved Pagination */}
                        <div className="flex justify-between items-center py-4">
                          <div className="text-sm text-gray-600">
                            Page {pagination.currentPage} • {bookings.length} results
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange('previous')}
                              disabled={!pagination.hasPreviousPage || loading}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange('next')}
                              disabled={!pagination.hasNextPage || loading}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
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