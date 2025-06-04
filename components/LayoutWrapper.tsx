"use client"

import SideNavigation from "./SideNavigation"
import BottomNavigation from "./BottomNavigation"
import UserPreferencesModal from "@/components/user-preferences";
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIfMobile()
    
    window.addEventListener("resize", checkIfMobile)
    
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Preferences Modal - Only shows for authenticated users */}
      {user && <UserPreferencesModal />}

      {/* Side Navigation - Only on desktop */}
      {!isMobile && (
        <SideNavigation onSidebarToggle={setIsSidebarOpen} />
      )}
      
      {/* Main Content Area */}
      <main 
        className={`flex-1 transition-all duration-300 ${
          !isMobile && isSidebarOpen ? 'md:ml-64' : !isMobile ? 'md:ml-20' : ''
        } p-4 pb-20 md:pb-4`}
      >
        {children}
      </main>

      {/* Bottom Navigation - Only on mobile */}
      <BottomNavigation />
    </div>
  )
}