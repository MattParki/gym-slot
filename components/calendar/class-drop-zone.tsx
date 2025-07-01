"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Search, Filter } from "lucide-react"
import { format } from "date-fns"
import type { GymClass } from "./gym-booking-system"
import { collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface ClassDropZoneProps {
  classes: GymClass[]
  onScheduleClass: (classId: string, date: Date, startTime: string) => void
}

export function ClassDropZone({ classes, onScheduleClass }: ClassDropZoneProps) {
  const [selectedClass, setSelectedClass] = useState<GymClass | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [startTime, setStartTime] = useState("09:00")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Get unique categories from classes
  const categories = Array.from(new Set(classes.map(c => c.category)))

  // Filter classes based on search and category
  const filteredClasses = classes.filter(gymClass => {
    const matchesSearch = searchQuery === "" || 
      gymClass.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gymClass.instructor.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === "all" || gymClass.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const startDate = new Date(2000, 0, 1, hours, minutes)
    startDate.setMinutes(startDate.getMinutes() + durationMinutes)
    
    return `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`
  }

  const handleClassClick = (gymClass: GymClass) => {
    setSelectedClass(gymClass)
    setIsModalOpen(true)
    // Reset form when opening modal
    setSelectedDate(undefined)
    setStartTime("09:00")
  }

  const handleSchedule = async () => {
    if (selectedClass && selectedDate) {
      const endTime = calculateEndTime(startTime, selectedClass.duration)
      
      onScheduleClass(selectedClass.id, selectedDate, startTime)
      
      // Close modal and reset form
      setIsModalOpen(false)
      setSelectedClass(null)
      setSelectedDate(undefined)
      setStartTime("09:00")

      try {
        await addDoc(collection(db, "scheduledClasses"), {
          classId: selectedClass.id,
          date: format(selectedDate, "yyyy-MM-dd"),
          startTime,
          endTime,
          scheduledAt: new Date().toISOString(),
        })
      } catch (error) {
        console.error("Error scheduling class:", error)
      }
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedClass(null)
    setSelectedDate(undefined)
    setStartTime("09:00")
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Schedule Classes</h3>
        <p className="text-sm text-muted-foreground">
          Click on a class below to schedule it.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes or instructors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 sm:w-48">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.filter(category => category && category.trim() !== "").map((category, index) => (
                <SelectItem key={`filter-category-${index}-${category}`} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Class Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Available Classes
          </h4>
          <span className="text-xs text-muted-foreground">
            {filteredClasses.length} of {classes.length} classes
          </span>
        </div>
        {filteredClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredClasses.map((gymClass) => (
              <Card
                key={gymClass.id}
                className="cursor-pointer transition-all hover:shadow-md border-2 border-muted hover:border-primary/50"
                onClick={() => handleClassClick(gymClass)}
              >
                <div className="h-2 w-full rounded-t-lg" style={{ backgroundColor: gymClass.color }} />
                <CardContent className="p-3">
                  <h4 className="font-medium text-sm">{gymClass.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{gymClass.instructor}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {gymClass.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {gymClass.duration}m
                    </div>
                  </div>
                </CardContent>
              </Card> 
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-2">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No classes found</h3>
              <p className="text-sm">
                Try adjusting your search terms or category filter
              </p>
            </div>
            {(searchQuery || selectedCategory !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                }}
                className="mt-4"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Scheduling Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-3 sm:p-6 mx-2 sm:mx-auto flex flex-col">
          <DialogHeader className="text-center pb-2 sm:pb-4 flex-shrink-0">
            <DialogTitle className="text-lg sm:text-xl font-semibold">
              Schedule Class
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            {selectedClass && (
              <div className="space-y-3 sm:space-y-6 pb-4">
                {/* Class Info Card - Compact */}
                <div className="relative overflow-hidden rounded-lg border bg-card">
                  <div className="h-1.5 w-full" style={{ backgroundColor: selectedClass.color }} />
                  <div className="p-2.5 sm:p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-lg font-semibold truncate">{selectedClass.name}</h3>
                        <p className="text-xs sm:text-base text-muted-foreground truncate">{selectedClass.instructor}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {selectedClass.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{selectedClass.duration}m</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>👥</span>
                        <span>{selectedClass.capacity}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date & Time Selection - Mobile Optimized */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                  {/* Date Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Select Date</Label>
                    <div className="border rounded-lg p-1.5 sm:p-3 bg-muted/20 flex justify-center">
                      <Calendar 
                        mode="single" 
                        selected={selectedDate} 
                        onSelect={setSelectedDate} 
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus 
                        classNames={{
                          months: "flex w-full flex-col",
                          month: "space-y-2 w-full flex flex-col",
                          caption: "flex justify-center pt-1 relative items-center mb-1",
                          caption_label: "text-sm sm:text-base font-medium",
                          nav: "space-x-1 flex items-center",
                          nav_button: "h-7 w-7 sm:h-8 sm:w-8 bg-transparent p-0 hover:bg-accent hover:text-accent-foreground rounded-md",
                          table: "w-full border-collapse",
                          head_row: "flex w-full mb-1",
                          head_cell: "text-muted-foreground rounded-md w-8 h-6 sm:w-10 sm:h-8 font-medium text-xs text-center flex items-center justify-center",
                          row: "flex w-full mb-0.5",
                          cell: "text-center p-0 relative w-8 h-8 sm:w-10 sm:h-10 [&:has([aria-selected])]:bg-accent focus-within:relative focus-within:z-20",
                          day: "h-8 w-8 sm:h-10 sm:w-10 p-0 font-medium text-xs sm:text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground font-bold",
                          day_outside: "text-muted-foreground opacity-40",
                          day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
                          day_hidden: "invisible",
                        }}
                      />
                    </div>
                  </div>

                  {/* Time Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="startTime" className="text-sm font-medium">Start Time</Label>
                    <div className="space-y-2 sm:space-y-3">
                      <Input 
                        id="startTime" 
                        type="time" 
                        value={startTime} 
                        onChange={(e) => setStartTime(e.target.value)}
                        className="text-base sm:text-lg py-2 sm:py-3 text-center h-10 sm:h-12 font-medium"
                      />
                      <div className="p-2.5 sm:p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Session Duration
                        </p>
                        <p className="text-sm sm:text-lg font-semibold mb-0.5">
                          {startTime} - {calculateEndTime(startTime, selectedClass.duration)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedClass.duration} minutes
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons - Fixed at bottom */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 border-t flex-shrink-0 bg-background">
            <Button
              variant="outline"
              onClick={handleModalClose}
              className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base font-medium h-10 sm:h-12"
              size="lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSchedule}
              disabled={!selectedDate}
              className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base font-medium h-10 sm:h-12"
              size="lg"
            >
              Schedule Class
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
