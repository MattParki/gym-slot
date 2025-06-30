"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Smartphone, Download, Calendar, Users } from "lucide-react"
import Link from "next/link"

export default function DownloadAppPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
            <Smartphone className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome to Gym Slot!
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Your account has been created successfully. To start booking classes, please download our mobile app.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Book Classes</h3>
                <p className="text-sm text-gray-600">
                  View and book available gym classes directly from your phone
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Manage Bookings</h3>
                <p className="text-sm text-gray-600">
                  Track your bookings and receive notifications about your classes
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Always Connected</h3>
                <p className="text-sm text-gray-600">
                  Stay up-to-date with class schedules and gym announcements
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="font-medium text-gray-900 mb-3">Download the App:</h3>
            <div className="space-y-3">
              <Button 
                className="w-full bg-black hover:bg-gray-800" 
                onClick={() => window.open('https://apps.apple.com/app/gym-slot', '_blank')}
              >
                <Download className="mr-2 h-4 w-4" />
                Download for iOS
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full border-gray-300"
                onClick={() => window.open('https://play.google.com/store/apps/details?id=com.gymslot', '_blank')}
              >
                <Download className="mr-2 h-4 w-4" />
                Download for Android
              </Button>
            </div>
          </div>
          
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-500 mb-3">
              Need help? Contact your gym for assistance.
            </p>
            <Link href="/login">
              <Button variant="ghost" className="text-blue-600">
                Back to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 