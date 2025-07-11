"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, userProfile, loading, isStaffMember } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user && userProfile) {
      // If user is authenticated but not a staff member, redirect to download app page
      if (!isStaffMember) {
        router.push("/download-app");
      }
    }
  }, [user, userProfile, loading, isStaffMember, router]);

  if (loading) {
    return <LoadingScreen message="Verifying your access..." />;
  }

  if (!user) {
    return null;
  }

  // If user is authenticated but not a staff member, show loading while redirecting
  if (!isStaffMember && userProfile) {
    return <LoadingScreen message="Redirecting to mobile app download..." />;
  }

  // If userProfile is not loaded yet, show loading
  if (!userProfile) {
    return <LoadingScreen message="Loading your profile..." />;
  }

  return <>{children}</>;
}