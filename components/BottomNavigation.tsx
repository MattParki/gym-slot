"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { usePathname } from "next/navigation"
import { Home, Users, LogOut, LogIn, UserPlus, Settings } from "lucide-react"

export default function BottomNavigation() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const getActiveTab = (path: string) => {
    return pathname === path ? "text-white" : "text-white/70"
  }

  // A small line above the active tab on mobile
  const getActiveIndicator = (path: string) => {
    if (pathname === path) {
      return <div className="absolute top-0 left-0 right-0 h-0.5 bg-white"></div>
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#141E33] border-t border-white/10 z-40">
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
              href="/clients" 
              className="relative flex flex-col items-center justify-center w-full h-full"
            >
              {getActiveIndicator('/clients')}
              <Users className={`h-6 w-6 ${getActiveTab('/clients')}`} />
              <span className={`text-xs mt-1 ${getActiveTab('/clients')}`}>Clients</span>
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
              <LogOut className="h-6 w-6 text-white/70" />
              <span className="text-xs mt-1 text-white/70">Logout</span>
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