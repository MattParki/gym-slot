"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { usePathname } from "next/navigation"
import { Home, CalendarCheck, LogOut, LogIn, UserPlus, Settings } from "lucide-react"

export default function BottomNavigation() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const getActiveTab = (path: string) => {
    return pathname === path ? "text-blue-600" : "text-gray-600"
  }

  // A small line above the active tab on mobile
  const getActiveIndicator = (path: string) => {
    if (pathname === path) {
      return <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500"></div>
    }
    return null
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-50/95 border-t border-gray-200 z-40 backdrop-blur-sm">
      <div className="flex justify-around items-center h-16">
        {user ? (
          <>
            <Link 
              href="/" 
              className="relative flex flex-col items-center justify-center w-full h-full"
            >
              {getActiveIndicator('/')}
              <Home className={`h-6 w-6 ${getActiveTab('/')}`} />
              <span className={`text-xs mt-1 ${getActiveTab('/')}`}>Home</span>
            </Link>

            <Link 
              href="/bookings" 
              className="relative flex flex-col items-center justify-center w-full h-full"
            >
              {getActiveIndicator('/bookings')}
              <CalendarCheck className={`h-6 w-6 ${getActiveTab('/bookings')}`} />
              <span className={`text-xs mt-1 ${getActiveTab('/bookings')}`}>Bookings</span>
            </Link>

            <Link
              href="/account-settings"
              className="relative flex flex-col items-center justify-center w-full h-full"
            >
              {getActiveIndicator('/account-settings')}
              <Settings className={`h-6 w-6 ${getActiveTab('/account-settings')}`} />
              <span className={`text-xs mt-1 ${getActiveTab('/account-settings')}`}>Settings</span>
            </Link>

            <button
              onClick={handleLogout}
              className="relative flex flex-col items-center justify-center w-full h-full"
            >
              <LogOut className="h-6 w-6 text-gray-600" />
              <span className="text-xs mt-1 text-gray-600">Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link 
              href="/login" 
              className="relative flex flex-col items-center justify-center w-full h-full"
            >
              {getActiveIndicator('/login')}
              <LogIn className={`h-6 w-6 ${getActiveTab('/login')}`} />
              <span className={`text-xs mt-1 ${getActiveTab('/login')}`}>Login</span>
            </Link>
            {(environment === 'development' || environment === 'demo') && (
              <Link
                href="/signup"
                className="relative flex flex-col items-center justify-center w-full h-full"
              >
                {getActiveIndicator('/signup')}
                <UserPlus className={`h-6 w-6 ${getActiveTab('/signup')}`} />
                <span className={`text-xs mt-1 ${getActiveTab('/signup')}`}>Sign Up</span>
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  )
}