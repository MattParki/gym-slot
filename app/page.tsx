"use client"

import LayoutWrapper from "@/components/LayoutWrapper"
import Link from "next/link"
import { PlusCircle, LogIn, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useState, useEffect } from "react"
import { getUserProfile } from "@/services/userService"
import FeatureCards from "@/components/FeatureCards"
import GetStartedGuide from "@/components/GetStartedGuide"
import EmailDomainSetupGuide from "@/components/EmailDomainSetupGuide"
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
                  Generate a proposal instantly
                </h1>
                <p className="text-lg md:text-xl text-white/80 mb-8">
                  Create professional proposals in minutes with our AI-powered tool
                </p>

                <Link href="/login">
                  <Button className="bg-white text-[#141E33] hover:bg-white/90">
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign in to turn prospects into wins
                  </Button>
                </Link>
              </div>
            </div>

            {/* Feature cards for non-logged in users */}
            <FeatureCards />

            {/* CTA for non-logged in */}
            <div className="container mx-auto px-4 pb-12 flex justify-center">
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg shadow-lg font-medium transition-all hover:shadow-xl">
                  Sign Up for Free
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
                    Hi {greeting}, <span className="text-indigo-500">Happy {dayOfWeek}!</span>
                  </h1>
                  <DailyMessage day={dayOfWeek} />
                </div>

                <div className="mt-4 md:mt-0">
                  <Link href="/create-proposal">
                    <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-md font-medium transition-all hover:shadow-lg w-full md:w-auto">
                      <PlusCircle className="h-5 w-5 mr-2" />
                      Create New Proposal
                    </Button>
                  </Link>
                </div>
                {/* My Proposals Link - mobile only */}
                <div className="md:hidden">
                  <Link href="/my-proposals">
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2 text-sm"
                    >
                      <FileText className="h-5 w-5" />
                      My Proposals
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Dashboard content with guides */}
            <div className="container mx-auto px-4">
              <div className="space-y-6 py-4">
                {/* Get Started Guide */}
                {user && <GetStartedGuide />}

                {/* Email Domain Setup Guide */}
                {user && <EmailDomainSetupGuide />}
              </div>
            </div>


            {/* Empty space where future dashboard content will go */}
            <div className="container mx-auto px-4 py-4 flex-grow">
              {/* Future dashboard content will go here */}
            </div>
          </>
        )}
      </div>
    </LayoutWrapper>
  )
}