"use client"

import LayoutWrapper from "@/components/LayoutWrapper"
import Link from "next/link"
import { 
  Smartphone, 
  Users, 
  Calendar, 
  BarChart3, 
  CreditCard, 
  CheckCircle, 
  Download,
  MessageSquare,
  Shield,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function FeaturesShowcase() {
  return (
    <LayoutWrapper>
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#141E33] via-[#1a2847] to-[#0f1925] text-white py-20">
          <div className="container mx-auto px-8">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-6 bg-green-500/20 text-green-400 border-green-500/30">
                Complete Business Solution
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                See GymSlot in 
                <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent"> Action</span>
              </h1>
              <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
                Discover how GymSlot transforms gym operations with our comprehensive management platform. 
                From member CRM to mobile apps, see everything in action.
              </p>
              
              <div className="flex justify-center">
                <Link href="/signup">
                  <Button size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile App Section */}
        <div className="py-20 bg-gray-50">
          <div className="container mx-auto px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <Badge className="mb-4 bg-blue-100 text-blue-700">
                  <Smartphone className="h-4 w-4 mr-1" />
                  Mobile Experience
                </Badge>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Branded Mobile App for Your Members
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Give your members a premium mobile experience with a custom app featuring your gym's branding. 
                  Available on both iOS and Android app stores.
                </p>

                <div className="space-y-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Instant Class Booking</h3>
                      <p className="text-gray-600">Members can book classes, join waitlists, and receive real-time updates.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Membership Management</h3>
                      <p className="text-gray-600">View membership details, payment history, and access QR codes for check-in.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Push Notifications</h3>
                      <p className="text-gray-600">Automated reminders for classes, announcements, and special offers.</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800">
                    <Download className="h-4 w-4 mr-2" />
                    Download iOS App
                  </Button>
                  <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    <Download className="h-4 w-4 mr-2" />
                    Download Android App
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-8 shadow-2xl">
                  <div className="bg-white rounded-2xl p-6 text-center">
                    <Smartphone className="h-32 w-32 text-blue-600 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">GymSlot Mobile</h3>
                    <p className="text-gray-600 mb-4">Your gym in your members' pockets</p>
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      Available for iOS & Android
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CRM Features */}
        <div className="py-20 bg-white">
          <div className="container mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Powerful Member Management CRM
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Everything you need to manage your members, track their journey, and grow your business.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="h-12 w-12 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Member Profiles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Detailed member profiles with contact information, membership history, and preferences.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Contact & emergency information
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Medical notes & restrictions
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Membership status tracking
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Communication</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Automated email campaigns and personalized communication tools.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Welcome email sequences
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Renewal reminders
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Custom announcements
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="h-12 w-12 bg-gradient-to-br from-green-600 to-teal-600 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Data Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Enterprise-grade security to protect your members' sensitive information.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Encrypted data storage
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      GDPR compliant
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Regular security audits
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Class Management */}
        <div className="py-20 bg-gray-50">
          <div className="container mx-auto px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Class Schedule</h3>
                    <Badge variant="secondary">Live Preview</Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <div>
                        <h4 className="font-medium text-gray-900">Morning Yoga</h4>
                        <p className="text-sm text-gray-600">9:00 AM - 10:00 AM</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">8/12 spots</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <div>
                        <h4 className="font-medium text-gray-900">HIIT Training</h4>
                        <p className="text-sm text-gray-600">6:00 PM - 7:00 PM</p>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800">15/15 spots</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                      <div>
                        <h4 className="font-medium text-gray-900">Spin Class</h4>
                        <p className="text-sm text-gray-600">7:30 PM - 8:30 PM</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">5/20 spots</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <Badge className="mb-4 bg-purple-100 text-purple-700">
                  <Calendar className="h-4 w-4 mr-1" />
                  Class Management
                </Badge>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Effortless Class Scheduling
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Create, manage, and optimize your class schedule with our intuitive drag-and-drop interface. 
                  Track attendance, manage waitlists, and keep everything synchronized.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Drag & Drop Scheduling</h3>
                      <p className="text-gray-600">Easily create and modify class schedules with visual calendar interface.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Instructor Management</h3>
                      <p className="text-gray-600">Assign instructors, track availability, and manage substitutions seamlessly.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Waitlist Management</h3>
                      <p className="text-gray-600">Automatic waitlist notifications when spots become available.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="py-20 bg-white">
          <div className="container mx-auto px-8">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-green-100 text-green-700">
                <BarChart3 className="h-4 w-4 mr-1" />
                Business Intelligence
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Data-Driven Business Insights
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Make informed decisions with comprehensive analytics and reporting. 
                Track your gym's performance and identify growth opportunities with real-time dashboards and detailed reports.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="pt-8">
                  <div className="h-16 w-16 mx-auto mb-4 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Member Analytics</h3>
                  <p className="text-gray-600">Track member growth, retention rates, and engagement patterns to optimize your services.</p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="pt-8">
                  <div className="h-16 w-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Class Performance</h3>
                  <p className="text-gray-600">Monitor class attendance, popularity, and utilization to optimize your schedule.</p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="pt-8">
                  <div className="h-16 w-16 mx-auto mb-4 bg-gradient-to-br from-green-600 to-teal-600 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Revenue Tracking</h3>
                  <p className="text-gray-600">Comprehensive financial reports and revenue insights to grow your business.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="py-20 bg-gradient-to-br from-[#141E33] to-[#1a2847] text-white">
          <div className="container mx-auto px-8 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Transform Your Gym Business?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join hundreds of successful gym owners who have revolutionized their operations with GymSlot.
            </p>
            
            <div className="flex justify-center mb-12">
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                  <Zap className="h-5 w-5 mr-2" />
                  Start Your Free Trial
                </Button>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-white/60">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span>Setup in under 5 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
} 