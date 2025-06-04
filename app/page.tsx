"use client"

import LayoutWrapper from "@/components/LayoutWrapper"
import Link from "next/link"
import { PlusCircle, LogIn, CalendarCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useState, useEffect } from "react"
import { getUserProfile } from "@/services/userService"
import FeatureCards from "@/components/FeatureCards"
import DailyMessage from "@/components/DailyMessage"

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
            <div className="bg-[#141E33] text-white rounded-lg">
              <div className="container mx-auto px-8 py-8 md:py-8">
                <h1 className="text-4xl md:text-4xl font-bold mb-4">
                  Effortless Gym Booking Starts Here
                </h1>
                <p className="text-lg md:text-xl text-white/80 mb-8">
                  Book your gym sessions in seconds. Manage your workout schedule and never miss a slot with Gym Slot.
                </p>

                <Link href="/login">
                  <Button className="bg-white text-[#141E33] hover:bg-white/90">
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign in to Book a Slot
                  </Button>
                </Link>
              </div>
            </div>

            {/* Feature cards for non-logged in users */}
            <FeatureCards />

            {/* CTA for non-logged in */}
            <div className="container mx-auto px-4 pb-12 flex justify-center">
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 rounded-lg shadow-lg font-medium transition-all hover:shadow-xl">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Header with action button for logged-in users */}
            <div className="container mx-auto px-4 py-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold">
                    Welcome back, {greeting}! <br /> <span className="text-green-500">Happy {dayOfWeek}!</span>
                  </h1>
                  <DailyMessage day={dayOfWeek} />
                </div>

                <div className="mt-4 md:mt-0">
                  <Link href="/book-slot">
                    <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md font-medium transition-all hover:shadow-lg w-full md:w-auto">
                      <PlusCircle className="h-5 w-5 mr-2" />
                      Book a Gym Slot
                    </Button>
                  </Link>
                </div>
                {/* My Bookings Link - mobile only */}
                <div className="md:hidden">
                  <Link href="/my-bookings">
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2 text-sm"
                    >
                      <CalendarCheck className="h-5 w-5" />
                      My Bookings
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </LayoutWrapper>
  )
}