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
} from "lucide-react";
import { usePathname } from "next/navigation";

export default function SideNavigation({ onSidebarToggle }: { onSidebarToggle?: (isOpen: boolean) => void }) {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const isProduction = process.env.NODE_ENV === "production";

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

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#141E33] text-white transition-all duration-300 z-40 
        ${isSidebarOpen ? "w-64" : "w-20"}`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Link
            href="/"
            className={`flex items-center ${isSidebarOpen ? "" : "hidden"}`}
          >
            <img src="/images/logo.png" alt="Gym Slot Logo" className="h-12 w-auto" />
          </Link>
          <button
            onClick={() => handleToggle(!isSidebarOpen)}
            className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${isSidebarOpen ? "" : "mx-auto mt-4"}`}
          >
            {isSidebarOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 flex flex-col">
          {user ? (
            <ul className="space-y-2 px-3 py-6">
              <li>
                <Link
                  href="/"
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive("/")
                    ? "bg-white/10"
                    : "hover:bg-white/10"
                    }`}
                >
                  <Home className="h-5 w-5" />
                  {isSidebarOpen && <span className="ml-3">Home</span>}
                </Link>
              </li>
              <li>
                <Link
                  href="/bookings"
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive("/bookings")
                    ? "bg-white/10"
                    : "hover:bg-white/10"
                    }`}
                >
                  <CalendarCheck className="h-5 w-5" />
                  {isSidebarOpen && <span className="ml-3">Bookings</span>}
                </Link>
              </li>
              <li>
                <Link
                  href="/members"
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive("/members")
                    ? "bg-white/10"
                    : "hover:bg-white/10"
                    }`}
                >
                  <Users className="h-5 w-5" />
                  {isSidebarOpen && <span className="ml-3">Members</span>}
                </Link>
              </li>
              <li>
                <Link
                  href="/account-settings"
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors  ${isActive("/account-settings")
                    ? "bg-white/10"
                    : "hover:bg-white/10"
                    }`}
                >
                  <Settings className="h-5 w-5" />
                  {isSidebarOpen && <span className="ml-3">Account Settings</span>}
                </Link>
              </li>
            </ul>
          ) : (
            <ul className="space-y-2 px-3 py-6">
              <li>
                <Link
                  href="/login"
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive("/login")
                    ? "bg-white/10"
                    : "hover:bg-white/10"
                    }`}
                >
                  <LogIn className="h-5 w-5" />
                  {isSidebarOpen && <span className="ml-3">Log In</span>}
                </Link>
              </li>
              {(environment === 'development' || environment === 'demo') && (
                <li>
                  <Link
                    href={isProduction ? "https://www.gym-slot.com/#pricing" : "/signup"}
                    className="flex items-center px-4 py-3 rounded-lg bg-white text-[#141E33] hover:bg-white/90 transition-colors"
                  >
                    <UserPlus className="h-5 w-5" />
                    {isSidebarOpen && <span className="ml-3">Sign Up</span>}
                  </Link>
                </li>
              )}
            </ul>
          )}
        </nav>

        {/* Logout button */}
        {user && (
          <div
            className={`border-t border-white/10 ${isSidebarOpen ? "px-3 py-1" : "flex justify-center py-3"
              }`}
          >
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <LogOut className="h-5 w-5" />
              {isSidebarOpen && <span className="ml-3">Log Out</span>}
            </button>
          </div>
        )}
        {/* User info */}
        {user && isSidebarOpen && (
          <div className="p-4 border-t border-white/10">
            <p className="text-sm text-white/70 truncate">{user.email}</p>
          </div>
        )}
      </div>
    </aside>
  );
}