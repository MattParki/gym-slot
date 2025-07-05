"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, limit, startAfter, where, DocumentSnapshot, onSnapshot } from "firebase/firestore"
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
import { CalendarIcon, Clock, User, Mail, Loader2, Filter, X, Search, AlertCircle, Wifi, WifiOff } from "lucide-react"
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
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false)
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
  
  const pageSize = 20
  const availableCategories = [...new Set(classes.map(cls => cls.category))].sort()

  // Real-time listener for classes
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "classes"),
      (snapshot) => {
        const classesData: GymClass[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as GymClass[]
        
        console.log(`📡 Real-time classes update: ${classesData.length} classes loaded`)
        
        setClasses(classesData)
        
        // Create a Map for O(1) lookups
        const classMap = new Map<string, GymClass>()
        classesData.forEach(cls => classMap.set(cls.id, cls))
        setClassesMap(classMap)
        
        setIsRealTimeConnected(true)
      },
      (error) => {
        console.error("Real-time classes error:", error)
        setError("Failed to load class information")
        setIsRealTimeConnected(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Real-time listener for all bookings
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "bookings"),
      (snapshot) => {
        const bookingsData: Booking[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Booking[]
        
        console.log(`📡 Real-time bookings update: ${bookingsData.length} bookings loaded`)
        
        setAllBookings(bookingsData)
        setIsRealTimeConnected(true)
      },
      (error) => {
        console.error("Real-time bookings error:", error)
        setError("Failed to load bookings")
        setIsRealTimeConnected(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Process bookings when classes or bookings change
  useEffect(() => {
    if (classesMap.size > 0 && allBookings.length >= 0) {
      // Apply filters
      let filteredBookings = allBookings

      // Search filter
      if (searchTerm.trim()) {
        filteredBookings = filteredBookings.filter(booking =>
          booking.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.userId.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      // Status filter
      if (selectedStatus !== "all") {
        filteredBookings = filteredBookings.filter(booking => booking.status === selectedStatus)
      }

      // Enhance bookings with class information
      const enhancedBookings: EnhancedBooking[] = filteredBookings.map((booking) => {
        const relatedClass = classesMap.get(booking.classId)
        
        return {
          ...booking,
          className: relatedClass?.name || `Unknown Class (ID: ${booking.classId})`,
          classCategory: relatedClass?.category || 'Unknown',
          classColor: relatedClass?.color || '#6b7280',
          instructor: relatedClass?.instructor || 'Unknown Instructor'
        }
      })

      // Category filter (applied after enhancement)
      const finalBookings = selectedCategory === "all" 
        ? enhancedBookings 
        : enhancedBookings.filter(booking => booking.classCategory === selectedCategory)

      // Sort by booking date (newest first)
      finalBookings.sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())

      // Simple pagination (client-side for now, but can be optimized later)
      const startIndex = (pagination.currentPage - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedBookings = finalBookings.slice(startIndex, endIndex)

      setBookings(paginatedBookings)
      
      // Update pagination info
      const totalPages = Math.ceil(finalBookings.length / pageSize)
      setPagination(prev => ({
        ...prev,
        hasNextPage: pagination.currentPage < totalPages,
        hasPreviousPage: pagination.currentPage > 1,
        totalPages,
        totalCount: finalBookings.length
      }))

      setLoading(false)
      
      console.log(`✅ Processed ${finalBookings.length} bookings, showing ${paginatedBookings.length} on page ${pagination.currentPage}`)
    }
  }, [classesMap, allBookings, selectedCategory, selectedStatus, searchTerm, pagination.currentPage])

  // Debounced search to avoid too many filter updates
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Reset to first page when filters change
      if (pagination.currentPage !== 1) {
        setPagination(prev => ({ ...prev, currentPage: 1 }))
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [selectedCategory, selectedStatus, searchTerm])

  const handlePageChange = (direction: 'next' | 'previous') => {
    const newPage = direction === 'next' 
      ? pagination.currentPage + 1 
      : pagination.currentPage - 1
    
    setPagination(prev => ({ ...prev, currentPage: newPage }))
  }

  const clearFilters = () => {
    setSelectedCategory("all")
    setSelectedStatus("all")
    setSearchTerm("")
    setPagination(prev => ({ ...prev, currentPage: 1 }))
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
          
          <div className="text-xs text-muted-foreground pt-2">
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
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-gray-600">Loading bookings...</p>
            </div>
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
                  <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 flex items-center gap-3">
                    Bookings
                    {isRealTimeConnected ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <Wifi className="h-5 w-5" />
                        <span className="text-sm font-normal">Live</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <WifiOff className="h-5 w-5" />
                        <span className="text-sm font-normal">Offline</span>
                      </div>
                    )}
                  </h1>
                  <p className="text-gray-700">
                    View and manage class bookings with real-time updates
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
                  <div className="text-sm text-gray-600">Total Found</div>
                  <div className="text-2xl font-bold text-gray-900">{pagination.totalCount} bookings</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="container mx-auto py-6 space-y-6">
            {/* Real-time connection status */}
            {!isRealTimeConnected && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  Real-time updates are currently disconnected. Data may not be current.
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="all-bookings" className="w-full">
              <TabsList className="mb-6 bg-gradient-to-r from-gray-100 to-blue-100 border border-gray-200">
                <TabsTrigger value="all-bookings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-teal-600 data-[state=active]:text-white">
                  All Bookings {isRealTimeConnected && <span className="ml-2 text-xs">🔴 LIVE</span>}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all-bookings">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle>Class Bookings</CardTitle>
                    <CardDescription>
                      Real-time booking records with automatic updates when changes occur
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Enhanced Filters */}
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by user email or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="w-full md:w-48">
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
                          <SelectTrigger className="w-full md:w-40">
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
                        
                        <Button 
                          variant="outline" 
                          onClick={clearFilters}
                          className="whitespace-nowrap"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear
                        </Button>
                      </div>

                      {error && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-700">
                            {error}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Responsive Display */}
                      <div className="block md:hidden">
                        {/* Mobile Card View */}
                        <div className="grid gap-4">
                          {loading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                              <LoadingCard key={`loading-${index}`} />
                            ))
                          ) : bookings.length === 0 ? (
                            <div className="text-center py-8">
                              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                              <p className="text-gray-600">
                                {searchTerm || selectedCategory !== "all" || selectedStatus !== "all"
                                  ? "Try adjusting your filters"
                                  : "No bookings have been made yet"
                                }
                              </p>
                            </div>
                          ) : (
                            bookings.map((booking) => (
                              <BookingCard key={booking.id} booking={booking} />
                            ))
                          )}
                        </div>
                      </div>

                      <div className="hidden md:block">
                        {/* Desktop Table View */}
                        <div className="rounded-md border">
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
                              ) : bookings.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center py-8">
                                    <div className="flex flex-col items-center space-y-2">
                                      <CalendarIcon className="h-8 w-8 text-gray-400" />
                                      <p className="text-gray-600">No bookings found</p>
                                    </div>
                                  </TableCell>
                                </TableRow>
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
                      </div>
                        
                      {/* Enhanced Pagination */}
                      {pagination.totalCount > 0 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
                          <div className="text-sm text-gray-600">
                            Showing {Math.min((pagination.currentPage - 1) * pageSize + 1, pagination.totalCount)} to {Math.min(pagination.currentPage * pageSize, pagination.totalCount)} of {pagination.totalCount} results
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange('previous')}
                              disabled={!pagination.hasPreviousPage}
                            >
                              Previous
                            </Button>
                            <div className="flex items-center gap-2 px-3 py-1 text-sm">
                              Page {pagination.currentPage} of {pagination.totalPages}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange('next')}
                              disabled={!pagination.hasNextPage}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
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