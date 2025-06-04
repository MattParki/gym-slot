"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import {
  Home,
  FilePlus,
  FileText,
  LogOut,
  LogIn,
  ChevronLeft,
  ChevronRight,
  Users,
  Settings,
  Bell,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { db } from "@/lib/firebase";
import { query, collection, where, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function SideNavigation({ onSidebarToggle }: { onSidebarToggle?: (isOpen: boolean) => void }) {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<{ id: string; message: string; read: boolean }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isProduction,] = useState(false);



  useEffect(() => {
    if (!user) return;

    // Listen for changes in the "notifications" collection for this user
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications: { id: string; message: string; read: boolean }[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        newNotifications.push({
          id: doc.id,
          message: data.message || "",
          read: data.read || false,
        });
      });
      setNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, [user]);

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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = async () => {
    const batchUpdates = notifications
      .filter((n) => !n.read)
      .map(async (n) => {
        const notifRef = doc(db, "notifications", n.id);
        try {
          await updateDoc(notifRef, { read: true });
        } catch (error) {
          console.error(`Failed to update notification ${n.id}:`, error);
        }
      });

    toast.success("All notifications marked as read!");

    await Promise.all(batchUpdates);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <>
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
              <img src="/images/logo.png" alt="ProspectsEasy Logo" className="h-12 w-auto" />
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
              <>
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
                      href="/clients"
                      className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive("/clients")
                        ? "bg-white/10"
                        : "hover:bg-white/10"
                        }`}
                    >
                      <Users className="h-5 w-5" />
                      {isSidebarOpen && <span className="ml-3">Clients</span>}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/create-proposal"
                      className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive("/create-proposal")
                        ? "bg-white/10"
                        : "hover:bg-white/10"
                        }`}
                    >
                      <FilePlus className="h-5 w-5" />
                      {isSidebarOpen && <span className="ml-3">Create New Proposal</span>}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/my-proposals"
                      className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive("/my-proposals")
                        ? "bg-white/10"
                        : "hover:bg-white/10"
                        }`}
                    >
                      <FileText className="h-5 w-5" />
                      {isSidebarOpen && <span className="ml-3">My Proposals</span>}
                    </Link>
                  </li>
                </ul>
              </>
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
                {process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' || process.env.NEXT_PUBLIC_ENVIRONMENT === 'demo' && (
                  <li>
                    <Link
                      href={isProduction ? "https://www.prospectseasy.com/#pricing" : "/signup"}
                      className="flex items-center px-4 py-3 rounded-lg bg-white text-[#141E33] hover:bg-white/90 transition-colors"
                    >
                      <FileText className="h-5 w-5" />
                      {isSidebarOpen && <span className="ml-3">Sign Up</span>}
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </nav>

          {/* Notifications Button */}
          {user && (
            <div
              className={`border-t border-white/10 ${isSidebarOpen ? "px-3 py-1" : "flex justify-center py-3"
                }`}
            >
              <button
                onClick={() => {
                  setShowModal(true);
                }}
                className={`flex items-center ${isSidebarOpen ? "px-4 py-2" : "justify-center"
                  } rounded-lg hover:bg-white/10 transition-colors relative w-full`}
              >
                <Bell className="h-5 w-5" />
                {isSidebarOpen && <span className="ml-3">Notifications</span>}
                {unreadCount > 0 && (
                  <span
                    className={`absolute ${isSidebarOpen ? "right-4 top-3" : "top-0 right-0"
                      } bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center`}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {user && (
            <div
              className={`border-t border-white/10 ${isSidebarOpen ? "px-3 py-1" : "flex justify-center py-3"
                }`}
            >
              <Link
                href="/account-settings"
                className={`flex items-center px-4 py-2 rounded-lg transition-colors  ${isActive("/account-settings")
                  ? "bg-white/10"
                  : "hover:bg-white/10"
                  }`}
              >
                <Settings className="h-5 w-5" />
                {isSidebarOpen && <span className="ml-3">Account Settings</span>}
              </Link>
            </div>
          )}


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

      {/* Notifications Modal */}
      {user && showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Notifications</h2>

              {/* Only show unread notifications */}
              {notifications.filter((n) => !n.read).length > 0 ? (
                <ul className="space-y-4">
                  {notifications
                    .filter((n) => !n.read)
                    .map((notification, index) => (
                      <li
                        key={`${notification.id}-${index}`}
                        className="p-4 border rounded-md bg-gray-50 hover:bg-gray-100 transition flex items-center justify-between"
                      >
                        <Link
                          href="/my-proposals"
                          className="flex-1 text-gray-800 text-sm hover:underline"
                        >
                          {notification.message}
                        </Link>
                        <Link
                          href="/my-proposals"
                          className="text-blue-500 hover:text-blue-600 transition"
                          title="Go to My Proposals"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-gray-600 text-sm">You have no notifications yet.</p>
              )}
            </div>

            <div className="flex justify-end gap-4">
              {notifications.some(n => !n.read) && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Mark All as Read
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}