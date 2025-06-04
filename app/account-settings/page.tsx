"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LayoutWrapper from "@/components/LayoutWrapper";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserProfileSettings from "@/components/account/UserProfileSettings";
import BusinessSettings from "@/components/account/BusinessSettings";
import { Loader2 } from "lucide-react";
import { getBusiness } from "@/services/businessService";

export default function AccountSettingsPage() {
  const { user, loading } = useAuth();
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset loading state when user changes
    setIsLoading(true);
    
    // Check if user is logged in
    if (!user) {
      setIsBusinessOwner(false);
      setIsLoading(false);
      return;
    }
    
    // Check if user is a business owner
    const checkOwnerStatus = async () => {
      try {
        const isOwner = await checkIfBusinessOwner(user.uid);
        setIsBusinessOwner(isOwner);
      } catch (error) {
        console.error("Error checking business owner status:", error);
        setIsBusinessOwner(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkOwnerStatus();
  }, [user]);

  const checkIfBusinessOwner = async (userId: string): Promise<boolean> => {
    try {
      // Use the getBusiness function from businessService
      const business = await getBusiness(userId);
      // If a business is found where this user is the owner, return true
      return business !== null;
    } catch (error) {
      console.error("Error checking business owner status:", error);
      return false; // Default to false if there's an error
    }
  };

  if (loading || isLoading) {
    return (
      <ProtectedRoute>
        <LayoutWrapper>
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </LayoutWrapper>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <LayoutWrapper>
        <div className="min-h-screen flex flex-col">
          <div className="bg-[#141E33] text-white rounded-lg">
            <div className="container mx-auto p-8 md:py-8">
              <h1 className="text-4xl md:text-4xl font-bold mb-4">
                Account Settings
              </h1>
            </div>
          </div>
          
          <div className="container mx-auto p-4 md:p-8">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="profile">My Profile</TabsTrigger>
                {isBusinessOwner && (
                  <TabsTrigger value="business">Business Settings</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>User Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <UserProfileSettings />
                  </CardContent>
                </Card>
              </TabsContent>
              
              {isBusinessOwner && (
                <TabsContent value="business">
                  <Card>
                    <CardHeader>
                      <CardTitle>Business Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BusinessSettings />
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </LayoutWrapper>
    </ProtectedRoute>
  );
}