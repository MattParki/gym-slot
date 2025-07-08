"use client"

import LayoutWrapper from "@/components/LayoutWrapper"
import Link from "next/link"
import { PlusCircle, LogIn, CalendarCheck, Smartphone, Users, Calendar, BarChart3, Download, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { useState, useEffect } from "react"
import { getUserProfile } from "@/services/userService"
import FeatureCards from "@/components/FeatureCards"
import DailyMessage from "@/components/DailyMessage"
import { GymBookingSystem } from "@/components/calendar/gym-booking-system"

export default function Home() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const currentDate = new Date();
  const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(currentDate);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uid) {
        try {
          const userProfile = await getUserProfile(user.uid);
          if (userProfile?.displayName) {
            const firstName = userProfile.displayName.split(' ')[0];
            setDisplayName(firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase());
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  // Fallback to first part of email if no display name is available
  const greeting = displayName || (user?.email ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1) : 'there');

  return (
    <LayoutWrapper>
      <div className="min-h-screen flex flex-col">
        {!user ? (
          <>
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-[#141E33] to-[#1a2442] text-white">
              <div className="container mx-auto px-4 py-16 md:px-8 md:py-20">
                <div className="max-w-4xl mx-auto text-center">
                  <Badge className="mb-6 bg-green-500/20 text-green-400 border-green-500/30">
                    Complete Gym Management Solution
                  </Badge>
                  <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                    Transform Your Gym with 
                    <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent"> Smart Management</span>
                  </h1>
                  <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
                    Complete business management platform with member CRM, class scheduling, and a branded mobile app for your gym members. Everything you need to run a modern fitness business.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link href="/signup">
                      <Button size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                        Start Free Trial
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                        <LogIn className="h-5 w-5 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Features Overview */}
            <div className="py-20 bg-gray-50">
              <div className="container mx-auto px-4 md:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Everything Your Gym Business Needs
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    From member management to mobile apps, we provide all the tools to modernize your gym operations and enhance member experience.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <Card className="text-center hover:shadow-lg transition-all border-0 shadow-md">
                    <CardContent className="pt-8">
                      <div className="h-16 w-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                        <Smartphone className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Mobile App for Members</h3>
                      <p className="text-gray-600">Branded mobile app that your members can download to book classes, view schedules, and manage their memberships.</p>
                    </CardContent>
                  </Card>

                  <Card className="text-center hover:shadow-lg transition-all border-0 shadow-md">
                    <CardContent className="pt-8">
                      <div className="h-16 w-16 mx-auto mb-4 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Member Management CRM</h3>
                      <p className="text-gray-600">Complete customer relationship management system to track members, memberships, payments, and communication.</p>
                    </CardContent>
                  </Card>

                  <Card className="text-center hover:shadow-lg transition-all border-0 shadow-md">
                    <CardContent className="pt-8">
                      <div className="h-16 w-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Class Management</h3>
                      <p className="text-gray-600">Schedule classes, manage instructors, track attendance, and handle bookings with our intuitive class management system.</p>
                    </CardContent>
                  </Card>

                  <Card className="text-center hover:shadow-lg transition-all border-0 shadow-md">
                    <CardContent className="pt-8">
                      <div className="h-16 w-16 mx-auto mb-4 bg-gradient-to-br from-green-600 to-teal-600 rounded-full flex items-center justify-center">
                        <BarChart3 className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Business Analytics</h3>
                      <p className="text-gray-600">Track revenue, member retention, class popularity, and business performance with detailed analytics and reports.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Mobile App Showcase */}
            <div className="py-20 bg-white">
              <div className="container mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
                      <Smartphone className="h-4 w-4 mr-1" />
                      Mobile Experience
                    </Badge>
                    <h2 className="text-4xl font-bold text-gray-900 mb-6">
                      Your Own Branded Mobile App
                    </h2>
                    <p className="text-xl text-gray-600 mb-8">
                      Give your members a premium experience with a custom mobile app they can download from app stores. Increase engagement and make booking classes effortless.
                    </p>
                    
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">Easy class booking and cancellation</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">Real-time schedule updates</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">Membership information and history</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">Push notifications for reminders</span>
                      </div>
                    </div>

                    <Link href="/download-app">
                      <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                        <Download className="h-4 w-4 mr-2" />
                        Learn About Mobile App
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="relative">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 text-center">
                      <div className="bg-white rounded-xl shadow-lg p-6 inline-block">
                        <Smartphone className="h-24 w-24 text-blue-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">GymSlot Mobile App</h3>
                        <p className="text-gray-600 text-sm">Available on iOS & Android</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CRM & Management Features */}
            <div className="py-20 bg-gray-50">
              <div className="container mx-auto px-4 md:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Powerful Business Management Tools
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Streamline your operations with our comprehensive CRM and management system designed specifically for fitness businesses.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-2xl">Member Management CRM</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-6">
                        Keep track of all your members with detailed profiles, membership status, payment history, and communication logs.
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-700">Member profiles & contact information</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-700">Membership status tracking</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-700">Automated email invitations</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-700">Emergency contacts & medical notes</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-2xl">Class & Schedule Management</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-6">
                        Create and manage classes, set capacity limits, assign instructors, and track attendance with ease.
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-700">Drag & drop class scheduling</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-700">Instructor management</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-700">Capacity and waitlist management</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-700">Real-time booking updates</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Enhanced Feature cards for non-logged in users */}
            <FeatureCards />

            {/* Benefits Section */}
            <div className="py-20 bg-white">
              <div className="container mx-auto px-4 md:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Why Choose GymSlot?
                  </h2>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Built specifically for fitness businesses, with features that grow with your gym.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="h-16 w-16 mx-auto mb-6 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Easy Setup</h3>
                    <p className="text-gray-600">Get started in minutes, not weeks. Our intuitive setup process gets your gym online quickly.</p>
                  </div>

                  <div className="text-center">
                    <div className="h-16 w-16 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Member Focused</h3>
                    <p className="text-gray-600">Enhance member experience with modern booking tools and seamless mobile access.</p>
                  </div>

                  <div className="text-center">
                    <div className="h-16 w-16 mx-auto mb-6 bg-gradient-to-br from-green-600 to-teal-600 rounded-full flex items-center justify-center">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Data Driven</h3>
                    <p className="text-gray-600">Make informed decisions with detailed analytics and insights into your business performance.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Final CTA */}
            <div className="py-20 bg-gradient-to-r from-[#141E33] to-[#1a2442] text-white">
              <div className="container mx-auto px-4 md:px-8 text-center">
                <h2 className="text-4xl font-bold mb-6">
                  Ready to Transform Your Gym?
                </h2>
                <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                  Join hundreds of gyms already using GymSlot to manage their business and delight their members.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/signup">
                    <Button size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                      Start Your Free Trial
                    </Button>
                  </Link>
                  <Link href="/download-app">
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Header with action button for logged-in users */}
            <div className="bg-gradient-to-r from-[#141E33] to-[#1a2442] text-white rounded-lg">
              <div className="container mx-auto px-2 md:px-4 py-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white">
                      Welcome back, {greeting}! <br /> <span className="text-green-400">Happy {dayOfWeek}!</span>
                    </h1>
                    <DailyMessage day={dayOfWeek} className="text-white/80" />
                  </div>

                  {/* My Bookings Link - mobile only */}
                  <div className="md:hidden">
                    <Link href="/bookings">
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2 text-sm border-white/30 text-white hover:bg-white/10"
                      >
                        <CalendarCheck className="h-5 w-5" />
                        My Bookings
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="container px-2 md:px-6 py-6">
              <GymBookingSystem />
            </div>
          </>
        )}
      </div>
    </LayoutWrapper>
  )
}