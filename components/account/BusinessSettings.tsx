"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Users, UserCheck, Building, FolderOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getBusiness,
  updateBusiness,
  addBusinessMember,
  removeBusinessMember
} from "@/services/businessService";
import { MobileTooltip } from "@/components/MobileTooltip";
import toast from 'react-hot-toast';
import { sendBusinessInvite } from "@/services/emailService";
import CategoryManagement from "./CategoryManagement";
import GymMemberManagement from "./GymMemberManagement";
import LoadingScreen from "@/components/LoadingScreen";

interface BusinessMember {
  id: string;
  email: string;
  role: string;
}

export default function BusinessSettings() {
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessEmail, setBusinessEmail] = useState("");
  const [emailDomain, setEmailDomain] = useState("");
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  // Company Info section
  const [companyName, setCompanyName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Fetch business data
      const fetchBusinessData = async () => {
        try {
          const business = await getBusiness(user.uid);
          if (business) {
            setBusinessId(business.id);
            setBusinessEmail(business.email || "");
            if (business.email) {
              const domain = business.email.split('@')[1];
              setEmailDomain(domain || "");
            }
            setMembers(business.members || []);
            setCompanyName(business.companyName || "");
            setContactInfo(business.contactInfo || "");
          }
          setInitialLoading(false);
        } catch (error) {
          toast.error("Failed to load business data.");
          setInitialLoading(false);
        }
      };

      fetchBusinessData();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !businessId) return;

    setLoading(true);
    try {
      // Update business data in Firestore
      await updateBusiness(businessId, {
        members,
        companyName,
        contactInfo,
      });

      toast.success("Business settings have been updated.");
    } catch (error) {
      toast.error("Failed to update business settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!businessId || !newMemberEmail.trim()) return;

    try {
      setLoading(true);
      const newMember = await addBusinessMember(businessId, newMemberEmail.trim());

      // Send invitation email
      await sendBusinessInvite({
        to: newMember.email,
        businessId,
        inviterId: user?.uid || "",
      });

      setMembers([...members, newMember]);
      setNewMemberEmail("");

      toast.success(`${newMemberEmail} has been added and invited.`);
    } catch (error) {
      toast.error("Failed to add or invite member.");
    } finally {
      setLoading(false);
    }
  };


  const handleRemoveMember = async (memberId: string) => {
    if (!businessId) return;

    try {
      setLoading(true);
      await removeBusinessMember(businessId, memberId);

      setMembers(members.filter(member => member.id !== memberId));

      toast.success("Member has been removed from your business.");
    } catch (error) {
      toast.error("Failed to remove member. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <LoadingScreen message="Loading business settings..." fullScreen={false} />;
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Business Settings</h1>
        <p className="text-muted-foreground">
          Manage your business information, staff members, and gym customers
        </p>
      </div>

      <Tabs defaultValue="gym-members" className="w-full">
                    <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4 h-auto bg-gradient-to-r from-gray-100 to-blue-100 border border-gray-200">
          <TabsTrigger 
            value="staff" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-3 text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-teal-600 data-[state=active]:text-white"
          >
            <UserCheck className="h-4 w-4 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Staff Members</span>
            <span className="sm:hidden">Staff</span>
          </TabsTrigger>
          <TabsTrigger 
            value="gym-members" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-3 text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-teal-600 data-[state=active]:text-white"
          >
            <Users className="h-4 w-4 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Gym Customers</span>
            <span className="sm:hidden">Customers</span>
          </TabsTrigger>
          <TabsTrigger 
            value="company" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-3 text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-teal-600 data-[state=active]:text-white"
          >
            <Building className="h-4 w-4 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Company Info</span>
            <span className="sm:hidden">Company</span>
          </TabsTrigger>
          <TabsTrigger 
            value="categories" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-3 text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-teal-600 data-[state=active]:text-white"
          >
            <FolderOpen className="h-4 w-4 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Categories</span>
            <span className="sm:hidden">Categories</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-6">
          <div className="space-y-3">
            <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 p-4 rounded">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                Staff Member Management
              </h2>
              <p className="text-sm text-gray-700 mt-1">
                Manage employees and staff who can access your gym's admin system. These are <strong>not your gym customers</strong> - they are people who work for your business.
              </p>
              <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-800">
                <strong>Staff privileges:</strong> Can log in to admin dashboard, manage bookings, view customer information, and access business reports.
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="businessEmail">Business Owner Email</Label>
              <MobileTooltip
                content={
                  <p className="max-w-xs">
                    This is your primary business account. Email changes require verification. Please contact support to update your email address.
                  </p>
                }
              />
            </div>
            <Input
              id="businessEmail"
              type="email"
              value={businessEmail}
              readOnly
              className="bg-muted cursor-not-allowed"
              placeholder="business@example.com"
            />
            <p className="text-xs text-muted-foreground">
              👤 <strong>Business Owner</strong> - Full admin access
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Staff Members with Admin Access</Label>
                <p className="text-sm text-muted-foreground">
                  These staff members can log in and manage your gym's bookings, classes, and customers.
                </p>
              </div>
              <div className="bg-white border rounded-lg px-3 py-1">
                <span className="text-sm font-medium text-gray-700">{members.length} Staff Members</span>
              </div>
            </div>

            <div className="space-y-3">
              {members.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Staff Members Added</h3>
                  <p className="text-sm text-gray-500 mb-4">Add staff members who need access to your gym's admin system</p>
                </div>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <UserCheck className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{member.email}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                🔑 Staff Member
                              </span>
                              <span className="text-xs text-gray-500">
                                Admin Access • Can manage customers & bookings
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={loading}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}

              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter staff member's email address"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      disabled={loading}
                      className="bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      They'll receive an invitation email to set up their staff account
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddMember}
                    disabled={!newMemberEmail.trim() || loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff Member
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gym-members" className="space-y-6">
          <div className="space-y-3">
            <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-4 rounded">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Gym Customer Management
              </h2>
              <p className="text-sm text-gray-700 mt-1">
                Manage your gym customers who have memberships and book classes. These are your <strong>paying customers</strong>, not staff members.
              </p>
              <div className="mt-2 p-2 bg-green-100 rounded text-xs text-green-800">
                <strong>Customer features:</strong> Book classes, manage memberships, use mobile app, view schedules and personal bookings.
              </div>
            </div>
          </div>
          <GymMemberManagement />
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <div className="space-y-3">
            <div className="border-l-4 border-gray-300 pl-4 bg-gray-50 p-4 rounded">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Information
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Update your gym's basic information and contact details.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your Company Name"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactInfo">Contact Information</Label>
            <Input
              id="contactInfo"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="Your Contact Information (Website, Address, etc.)"
              disabled={loading}
            />
          </div>

        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="space-y-3">
            <div className="border-l-4 border-gray-300 pl-4 bg-gray-50 p-4 rounded">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Class Categories
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Organize your gym classes into categories for better organization and filtering.
              </p>
            </div>
          </div>
          <CategoryManagement />
        </TabsContent>
      </Tabs>

      <Button
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}