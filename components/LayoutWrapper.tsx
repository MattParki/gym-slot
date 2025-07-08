"use client"

import SideNavigation from "./SideNavigation"
import BottomNavigation from "./BottomNavigation"
import { useState, useEffect } from "react"

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

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
      {/* Side Navigation - Only on desktop */}
      {!isMobile && (
        <SideNavigation onSidebarToggle={setIsSidebarOpen} />
      )}
      
      {/* Main Content Area */}
      <main 
        className={`flex-1 transition-all duration-300 ${
          !isMobile && isSidebarOpen ? 'md:ml-72' : !isMobile ? 'md:ml-20' : ''
        } px-2 py-4 pb-20 md:p-6 md:pb-6`}
      >
        {children}
      </main>

      {/* Bottom Navigation - Only on mobile */}
      <BottomNavigation />
    </div>
  )
}