"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, limit, startAfter, where, DocumentSnapshot, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"
import LayoutWrapper from "@/components/LayoutWrapper"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { CalendarIcon, Clock, User, Mail, Loader2, Filter, X, Search, AlertCircle, Wifi, WifiOff, MapPin, UserCheck, Calendar } from "lucide-react"
import { format } from "date-fns"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  cancellationReason?: string
  cancelledAt?: string
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
  
  const pageSize = 50
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
    }
  }, [classesMap, allBookings, searchTerm, selectedCategory, selectedStatus, pagination.currentPage])

  const handlePageChange = (direction: 'next' | 'previous') => {
    setPagination(prev => ({
      ...prev,
      currentPage: direction === 'next' ? prev.currentPage + 1 : prev.currentPage - 1
    }))
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("all")
    setSelectedStatus("all")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Completed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getCategoryBadge = (category: string, color: string) => {
    return (
      <Badge 
        variant="outline" 
        className="text-xs font-medium border-gray-200"
        style={{ 
          backgroundColor: `${color}15`, 
          borderColor: color,
          color: color 
        }}
      >
        {category}
      </Badge>
    )
  }

  const formatDate = (timestamp: any) => {
    try {
      if (!timestamp) return 'Unknown Date'
      
      let date: Date
      
      if (typeof timestamp === 'string') {
        date = new Date(timestamp)
      } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate()
      } else if (timestamp instanceof Date) {
        date = timestamp
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000)
      } else {
        return 'Invalid Date'
      }
      
      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }
      
      return format(date, "MMM dd, yyyy")
    } catch (error) {
      console.error('Error formatting date:', error, timestamp)
      return 'Error'
    }
  }

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':')
      const date = new Date()
      date.setHours(parseInt(hours), parseInt(minutes))
      return format(date, "h:mm a")
    } catch {
      return timeString
    }
  }

  const EnhancedBookingCard = ({ booking }: { booking: EnhancedBooking }) => {
    const isCancelled = booking.status === "cancelled"
    
    return (
      <div className={`border rounded-lg hover:shadow-sm transition-all duration-150 border-l-4 ${
        isCancelled 
          ? 'bg-red-50/50 border-l-red-400 border-red-200' 
          : booking.status === 'active'
          ? 'bg-green-50/30 border-l-green-400 border-gray-200'
          : booking.status === 'pending'
          ? 'bg-yellow-50/30 border-l-yellow-400 border-gray-200'
          : 'bg-white border-l-blue-400 border-gray-200'
      }`}>
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center p-3">
          {/* User Info */}
          <div className="flex items-center space-x-3 min-w-0" style={{ width: '280px' }}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              isCancelled 
                ? 'bg-red-100' 
                : booking.status === 'active'
                ? 'bg-green-100'
                : 'bg-blue-100'
            }`}>
              <User className={`h-4 w-4 ${
                isCancelled 
                  ? 'text-red-600' 
                  : booking.status === 'active'
                  ? 'text-green-600'
                  : 'text-blue-600'
              }`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className={`font-medium text-sm truncate ${isCancelled ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {booking.userEmail}
              </div>
              <div className="text-xs text-gray-500 truncate">
                ID: {booking.userId.slice(0, 8)}...
              </div>
            </div>
          </div>

          {/* Class Info */}
          <div className="flex items-center space-x-4 min-w-0" style={{ width: '300px' }}>
            <div className="min-w-0 flex-1">
              <div className={`font-medium text-sm truncate ${isCancelled ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {isCancelled ? '🚫 ' : ''}{booking.className}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {booking.instructor}
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-center space-x-4 min-w-0" style={{ width: '200px' }}>
            <div className="min-w-0 flex-1">
              <div className={`text-sm ${isCancelled ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {formatDate(booking.classDate)}
              </div>
              <div className={`text-xs ${isCancelled ? 'line-through text-gray-400' : 'text-gray-500'}`}>
                {formatTime(booking.classStartTime)} - {formatTime(booking.classEndTime)}
              </div>
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex items-center space-x-3" style={{ width: '180px' }}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 mb-1">
                {getStatusBadge(booking.status)}
                {/* Cancellation reason inline */}
                {isCancelled && booking.cancellationReason && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-xs text-red-600 truncate cursor-help">
                          ({booking.cancellationReason})
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{booking.cancellationReason}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {formatDate(booking.bookingDate)}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden p-4">
          <div className="space-y-3">
            {/* Header Row - Customer & Status */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1 mr-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCancelled 
                    ? 'bg-red-100' 
                    : booking.status === 'active'
                    ? 'bg-green-100'
                    : 'bg-blue-100'
                }`}>
                  <User className={`h-5 w-5 ${
                    isCancelled 
                      ? 'text-red-600' 
                      : booking.status === 'active'
                      ? 'text-green-600'
                      : 'text-blue-600'
                  }`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`font-medium text-base truncate ${isCancelled ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {booking.userEmail}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {booking.userId.slice(0, 8)}...
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                {getStatusBadge(booking.status)}
              </div>
            </div>

            {/* Class Info Row */}
            <div className="bg-gray-50/50 rounded-lg p-3">
              <div className={`font-semibold text-lg ${isCancelled ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {isCancelled ? '🚫 ' : ''}{booking.className}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                with {booking.instructor}
              </div>
            </div>

            {/* Date & Time Row */}
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-sm font-medium ${isCancelled ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {formatDate(booking.classDate)}
                </div>
                <div className={`text-xs ${isCancelled ? 'line-through text-gray-400' : 'text-gray-500'}`}>
                  {formatTime(booking.classStartTime)} - {formatTime(booking.classEndTime)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Booked</div>
                <div className="text-xs text-gray-400">
                  {formatDate(booking.bookingDate)}
                </div>
              </div>
            </div>

            {/* Cancellation Reason Row (if applicable) */}
            {isCancelled && booking.cancellationReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-sm text-red-700">
                  <span className="font-medium">Cancellation reason:</span>
                </div>
                <div className="text-sm text-red-600 mt-1">
                  {booking.cancellationReason}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const LoadingCard = () => (
    <div className="border rounded-lg border-l-4 border-l-gray-300 border-gray-200">
      {/* Desktop Loading Layout */}
      <div className="hidden md:flex items-center p-3">
        {/* User Info Skeleton */}
        <div className="flex items-center space-x-3 min-w-0" style={{ width: '280px' }}>
          <div className="w-8 h-8 bg-gray-200 animate-pulse rounded-full flex-shrink-0"></div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-3 w-20 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>

        {/* Class Info Skeleton */}
        <div className="flex items-center space-x-4 min-w-0" style={{ width: '300px' }}>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="h-4 w-28 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-3 w-24 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>

        {/* Date & Time Skeleton */}
        <div className="flex items-center space-x-4 min-w-0" style={{ width: '200px' }}>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-3 w-32 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>

        {/* Status & Date Skeleton */}
        <div className="flex items-center space-x-3" style={{ width: '180px' }}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <div className="h-6 w-16 bg-gray-200 animate-pulse rounded-full"></div>
            </div>
            <div className="h-3 w-20 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </div>

      {/* Mobile Loading Layout */}
      <div className="md:hidden p-4">
        <div className="space-y-3">
          {/* Header Row Skeleton */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1 mr-3">
              <div className="w-10 h-10 bg-gray-200 animate-pulse rounded-full flex-shrink-0"></div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-40 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-3 w-24 bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>
            <div className="h-6 w-16 bg-gray-200 animate-pulse rounded-full flex-shrink-0"></div>
          </div>

          {/* Class Info Skeleton */}
          <div className="bg-gray-50/50 rounded-lg p-3 space-y-2">
            <div className="h-5 w-32 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-28 bg-gray-200 animate-pulse rounded"></div>
          </div>

          {/* Date & Time Skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-3 w-32 bg-gray-200 animate-pulse rounded"></div>
            </div>
            <div className="text-right space-y-1">
              <div className="h-3 w-12 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-3 w-16 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
        <div className="min-h-screen">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-[#141E33] to-[#1a2442] text-white rounded-lg shadow-sm mb-8">
            <div className="container mx-auto p-4 md:p-8">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
                <div className="space-y-3">
                  <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                    📋 Bookings
                    {isRealTimeConnected ? (
                      <div className="flex items-center gap-2 text-green-400">
                        <Wifi className="h-5 w-5" />
                        <span className="text-sm font-normal bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Live</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-400">
                        <WifiOff className="h-5 w-5" />
                        <span className="text-sm font-normal bg-red-500/20 text-red-400 px-2 py-1 rounded-full">Offline</span>
                      </div>
                    )}
                  </h1>
                  <p className="text-lg text-white/80 max-w-2xl">
                    Monitor and manage class bookings with real-time updates and detailed customer information
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 shadow-sm">
                  <div className="text-center">
                    <div className="text-sm text-white/70 mb-1">Total Found</div>
                    <div className="text-3xl font-bold text-white">{pagination.totalCount}</div>
                    <div className="text-sm text-white/60">bookings</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="container mx-auto px-2 md:px-0 space-y-8">
            {/* Real-time connection status */}
            {!isRealTimeConnected && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  Real-time updates are currently disconnected. Data may not be current.
                </AlertDescription>
              </Alert>
            )}

            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Class Bookings</CardTitle>
                    <CardDescription className="text-base">
                      Real-time booking records with automatic updates when changes occur
                    </CardDescription>
                  </div>
                  <div className="text-sm text-gray-500">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Enhanced Filters */}
                  <div className="bg-gray-50/50 rounded-lg p-4 space-y-4">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Search & Filter
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search by email or user ID..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-white"
                        />
                      </div>
                      
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="bg-white">
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
                        <SelectTrigger className="bg-white">
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
                    </div>
                    
                    {(searchTerm || selectedCategory !== "all" || selectedStatus !== "all") && (
                      <Button 
                        variant="outline" 
                        onClick={clearFilters}
                        className="w-full md:w-auto"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All Filters
                      </Button>
                    )}
                  </div>

                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Column Headers */}
                  <div className="hidden md:flex items-center px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b bg-gray-50/50">
                    <div className="flex items-center space-x-3 min-w-0" style={{ width: '280px' }}>Customer</div>
                    <div className="flex items-center space-x-4 min-w-0" style={{ width: '300px' }}>Class Details</div>
                    <div className="flex items-center space-x-4 min-w-0" style={{ width: '200px' }}>Date & Time</div>
                    <div className="flex items-center space-x-3" style={{ width: '180px' }}>Status & Details</div>
                  </div>

                  {/* Bookings List */}
                  <div className="space-y-2">
                    {loading ? (
                      Array.from({ length: 8 }).map((_, index) => (
                        <LoadingCard key={`loading-${index}`} />
                      ))
                    ) : bookings.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <CalendarIcon className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">No bookings found</h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                          {searchTerm || selectedCategory !== "all" || selectedStatus !== "all"
                            ? "Try adjusting your search criteria or filters to find more results."
                            : "No bookings have been made yet. Bookings will appear here as customers book classes."
                          }
                        </p>
                      </div>
                    ) : (
                      bookings.map((booking) => (
                        <EnhancedBookingCard key={booking.id} booking={booking} />
                      ))
                    )}
                  </div>
                    
                  {/* Enhanced Pagination */}
                  {pagination.totalCount > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t">
                      <div className="text-sm text-gray-600">
                        Showing {Math.min((pagination.currentPage - 1) * pageSize + 1, pagination.totalCount)} to {Math.min(pagination.currentPage * pageSize, pagination.totalCount)} of {pagination.totalCount} results
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange('previous')}
                          disabled={!pagination.hasPreviousPage}
                          className="min-w-20"
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-50 rounded-md">
                          Page {pagination.currentPage} of {pagination.totalPages}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange('next')}
                          disabled={!pagination.hasNextPage}
                          className="min-w-20"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </LayoutWrapper>
    </ProtectedRoute>
  )
} 