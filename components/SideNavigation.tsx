"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import {
  Home,
  CalendarCheck,
  LogOut,
  LogIn,
  ChevronLeft,
  ChevronRight,
  Users,
  Settings,
  UserPlus,
  User,
  BarChart3,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SideNavigation({ onSidebarToggle }: { onSidebarToggle?: (isOpen: boolean) => void }) {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  const handleToggle = (isOpen: boolean) => {
    setIsSidebarOpen(isOpen);
    if (onSidebarToggle) {
      onSidebarToggle(isOpen);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") {
      return true;
    }
    if (path !== "/" && pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  const navItems = [
    { href: "/", icon: Home, label: "Dashboard", requiresAuth: true },
    { href: "/bookings", icon: CalendarCheck, label: "My Bookings", requiresAuth: true },
    { href: "/members", icon: Users, label: "Members", requiresAuth: true },
    { href: "/account-settings", icon: Settings, label: "Settings", requiresAuth: true },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 shadow-lg transition-all duration-300 z-40 
        ${isSidebarOpen ? "w-72" : "w-20"}`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className={`flex items-center border-b border-gray-100 ${isSidebarOpen ? "justify-between p-6" : "justify-center p-4"}`}>
          {isSidebarOpen && (
            <Link
              href="/"
              className="flex items-center transition-opacity duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">GS</span>
                </div>
                <span className="text-xl font-bold text-gray-900">GymSlot</span>
              </div>
            </Link>
          )}
          <button
            onClick={() => handleToggle(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
          >
            {isSidebarOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 flex flex-col">
          {user ? (
            <>
              {/* User Info */}
              {isSidebarOpen ? (
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.displayName || "Gym Owner"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">Pro</Badge>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-b border-gray-100 flex justify-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <nav className={`flex-1 ${isSidebarOpen ? "px-4 py-6" : "px-2 py-6"}`}>
                <ul className={isSidebarOpen ? "space-y-3" : "space-y-4"}>
                  {navItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center rounded-xl transition-all duration-200 group ${
                          isSidebarOpen 
                            ? "px-4 py-3.5" 
                            : "w-12 h-12 justify-center mx-auto"
                        } ${
                          isActive(item.href)
                            ? "bg-gradient-to-r from-green-50 to-blue-50 text-green-700 border border-green-200"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <item.icon className={`h-5 w-5 ${isActive(item.href) ? "text-green-600" : ""}`} />
                        {isSidebarOpen && (
                          <span className="ml-3 text-sm font-medium">{item.label}</span>
                        )}
                        {isActive(item.href) && isSidebarOpen && (
                          <div className="ml-auto w-2 h-2 bg-green-600 rounded-full"></div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Logout Button */}
              <div className="px-4 py-5 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className={`flex items-center rounded-xl text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 ${
                    isSidebarOpen 
                      ? "w-full px-4 py-3.5" 
                      : "w-12 h-12 justify-center mx-auto"
                  }`}
                >
                  <LogOut className="h-5 w-5" />
                  {isSidebarOpen && <span className="ml-3 text-sm font-medium">Sign Out</span>}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Welcome Message for Non-Users */}
              {isSidebarOpen && (
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Welcome to GymSlot</h3>
                  <p className="text-sm text-gray-600">
                    Sign in to access your gym management dashboard
                  </p>
                </div>
              )}

              {/* Authentication Buttons */}
              <div className={`flex-1 flex flex-col justify-center ${isSidebarOpen ? "px-4" : "px-2"} py-6`}>
                <div className={isSidebarOpen ? "space-y-5" : "space-y-6 flex flex-col items-center"}>
                  <div className={isSidebarOpen ? "w-full" : ""}>
                    <Link href="/login">
                      <Button 
                        variant="default"
                        className={`${isSidebarOpen ? "w-full h-12" : "w-12 h-12 p-0"} bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white`}
                      >
                        <LogIn className="h-5 w-5" />
                        {isSidebarOpen && <span className="ml-2">Sign In</span>}
                      </Button>
                    </Link>
                  </div>
                  
                  <div className={isSidebarOpen ? "w-full" : ""}>
                    <Link href="/signup">
                      <Button 
                        variant="outline"
                        className={`${isSidebarOpen ? "w-full h-12" : "w-12 h-12 p-0"} border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900`}
                      >
                        <UserPlus className="h-5 w-5" />
                        {isSidebarOpen && <span className="ml-2">Sign Up</span>}
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Feature Highlights */}
                {isSidebarOpen && (
                  <div className="mt-8 p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-100">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Key Features</h4>
                    <ul className="space-y-2 text-xs text-gray-600">
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                        Member Management CRM
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                        Class Scheduling
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                        Mobile App for Members
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                        Business Analytics
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}