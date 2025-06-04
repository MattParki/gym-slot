"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { FileText } from "lucide-react";

export default function Navigation() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[#141E33] text-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2 font-bold text-xl">
          <Link href="/" className="flex items-center">
            <FileText className="h-6 w-6 mr-2" />
            <span>ProspectsEasy</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium hover:text-white/80 transition-colors"
          >
            Home
          </Link>

          {user ? (
            <>
              <Link
                href="/my-proposals"
                className="text-sm font-medium hover:text-white/80 transition-colors"
              >
                My Proposals
              </Link>

              <button
                onClick={handleLogout}
                className="text-sm font-medium hover:text-white/80 transition-colors"
              >
                Log Out
              </button>

              <span className="text-white/70 text-sm ml-2">{user.email}</span>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium hover:text-white/80 transition-colors"
              >
                Log In
              </Link>
              {(environment === "development" || environment === "demo") && (
                <Link
                  href="/signup"
                  className="text-sm font-medium hover:text-white/80 transition-colors"
                >
                  Sign Up
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Mobile Burger Menu */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#141E33] text-white mx-auto w-11/12 rounded-lg shadow-lg">
          <nav className="flex flex-col items-center gap-4 py-6">
            <Link
              href="/"
              className="w-full text-sm font-medium hover:text-white/90 transition-colors py-2 border-b border-white/10 text-center"
            >
              Home
            </Link>

            {user ? (
              <>
                <Link
                  href="/my-proposals"
                  className="w-full text-sm font-medium hover:text-white/90 transition-colors py-2 border-b border-white/10 text-center"
                >
                  My Proposals
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full text-sm font-medium hover:text-white/90 transition-colors py-2 border-b border-white/10 text-center"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="w-full text-sm font-medium hover:text-white/90 transition-colors py-2 border-b border-white/10 text-center"
                >
                  Log In
                </Link>
                {(environment === "development" || environment === "demo") && (
                  <Link
                    href="/signup"
                    className="w-full inline-flex items-center justify-center rounded-md bg-white text-[#141E33] px-6 py-3 font-medium hover:bg-white/90 transition-colors mt-4"
                  >
                    Sign Up
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}