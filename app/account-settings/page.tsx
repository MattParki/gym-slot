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
    setIsLoading(true);
    
    if (!user) {
      setIsBusinessOwner(false);
      setIsLoading(false);
      return;
    }
    
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
      const business = await getBusiness(userId);
      return business !== null;
    } catch (error) {
      return false;
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
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-lg shadow-sm">
            <div className="container mx-auto p-8 md:py-8">
              <h1 className="text-4xl md:text-4xl font-bold mb-4 text-gray-900">
                Account Settings
              </h1>
            </div>
          </div>
          
          <div className="container mx-auto p-4 md:p-8">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="mb-6 h-auto bg-gradient-to-r from-gray-100 to-blue-100 border border-gray-200">
                <TabsTrigger 
                  value="profile" 
                  className="px-6 py-3 font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-teal-600 data-[state=active]:text-white"
                >
                  My Profile
                </TabsTrigger>
                {isBusinessOwner && (
                  <TabsTrigger 
                    value="business" 
                    className="px-6 py-3 font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-teal-600 data-[state=active]:text-white"
                  >
                    Business Settings
                  </TabsTrigger>
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