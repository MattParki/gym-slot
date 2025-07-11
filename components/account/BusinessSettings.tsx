"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Users, UserCheck, Building, FolderOpen, Loader2, Edit2, Key, UserX } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  getBusiness,
  updateBusiness,
  addStaffMember,
  removeBusinessMember,
  removeBusinessStaffMember,
  updateBusinessStaffMember,
  sendPasswordResetEmail,
  removeDuplicateStaffMembers,
  BusinessMember,
  AddMemberResult
} from "@/services/businessService";
import { getUserProfile } from "@/services/userService";
import { MobileTooltip } from "@/components/MobileTooltip";
import toast from 'react-hot-toast';
import CategoryManagement from "./CategoryManagement";
import GymMemberManagement from "./GymMemberManagement";
import LoadingScreen from "@/components/LoadingScreen";

// BusinessMember interface is now imported from businessService

// Define available staff roles
const STAFF_ROLES = [
  { value: "staff", label: "Staff", description: "General staff member with basic admin access" },
  { value: "personal_trainer", label: "Personal Trainer", description: "Fitness professional who conducts training sessions" },
  { value: "administrator", label: "Administrator", description: "Advanced admin with full management capabilities" },
  { value: "manager", label: "Manager", description: "Department or facility manager" },
  { value: "receptionist", label: "Receptionist", description: "Front desk and customer service staff" }
];

export default function BusinessSettings() {
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessEmail, setBusinessEmail] = useState("");
  const [emailDomain, setEmailDomain] = useState("");
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [staffMembers, setStaffMembers] = useState<BusinessMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("staff");
  const [addingMember, setAddingMember] = useState(false);
  
  // Edit staff member modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<BusinessMember | null>(null);
  const [updatingMember, setUpdatingMember] = useState(false);
  const [sendingPasswordReset, setSendingPasswordReset] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    department: "",
    role: "staff",
    hasUserAccount: false,
    userAccountStatus: "" // "created" | "not_created" | "checking"
  });
  // Company Info section
  const [companyName, setCompanyName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const staffListenerUnsubscribe = useRef<(() => void) | null>(null);
  const [pendingDeleteMember, setPendingDeleteMember] = useState<BusinessMember | null>(null);
  const [deletePreview, setDeletePreview] = useState<{ bookingsCount: number; classesCount: number } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

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
            // Only set raw staffMembers, let real-time listener handle hasAccount/profile
            setStaffMembers(business.staffMembers || []);
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

  // Real-time listener for staff account status
  useEffect(() => {
    if (staffMembers.length === 0) return;
    if (staffListenerUnsubscribe.current) {
      staffListenerUnsubscribe.current();
      staffListenerUnsubscribe.current = null;
    }
    // Normalize emails to lowercase
    const staffEmails = staffMembers.map((m) => (m.email || "").trim().toLowerCase());
    if (staffEmails.length === 0) return;
    const usersRef = collection(db, "users");
    let unsubscribes: (() => void)[] = [];
    const updateStaffFromSnapshot = (docs: any[]) => {
      setStaffMembers((prev) =>
        prev.map((member) => {
          const memberEmail = (member.email || "").trim().toLowerCase();
          const userDoc = docs.find((d) => ((d.email || "").trim().toLowerCase() === memberEmail));
          if (userDoc) {
            return {
              ...member,
              hasAccount: true,
              id: userDoc.uid || member.id, // Sync id to UID if available
              firstName: userDoc.firstName || member.firstName,
              lastName: userDoc.lastName || member.lastName,
              phone: userDoc.phone || member.phone,
            };
          } else {
            return {
              ...member,
              hasAccount: false,
            };
          }
        })
      );
    };
    // Chunk staffEmails for Firestore 'in' query limit
    for (let i = 0; i < staffEmails.length; i += 10) {
      const chunk = staffEmails.slice(i, i + 10);
      const chunkQuery = query(usersRef, where("email", "in", chunk));
      const unsubscribe = onSnapshot(chunkQuery, (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ ...doc.data(), uid: doc.id }));
        updateStaffFromSnapshot(docs);
      });
      unsubscribes.push(unsubscribe);
    }
    staffListenerUnsubscribe.current = () => {
      unsubscribes.forEach((u) => u());
    };
    return () => {
      if (staffListenerUnsubscribe.current) staffListenerUnsubscribe.current();
    };
  }, [staffMembers.map((m) => (m.email || "").trim().toLowerCase()).join(",")]);

  // Update all staff member actions to use email as the primary key
  const findStaffByEmail = (email: string) => {
    const normalized = (email || "").trim().toLowerCase();
    return staffMembers.find((m) => (m.email || "").trim().toLowerCase() === normalized);
  };

  // Handler to start delete flow (now uses email)
  const handleRemoveMember = async (memberIdOrEmail: string) => {
    // Try to find by id, but fallback to email
    let member = staffMembers.find((m) => m.id === memberIdOrEmail) || findStaffByEmail(memberIdOrEmail);
    if (!member) return;
    setPendingDeleteMember(member);
    setDeleteLoading(true);
    setDeleteError(null);
    setDeletePreview(null);
    setDeleteConfirmed(false);
    // Call API to preview what will be deleted
    try {
      const res = await fetch("/api/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.id, email: member.email })
      });
      const data = await res.json();
      if (res.ok) {
        setDeletePreview({ bookingsCount: data.bookingsCount, classesCount: data.classesCount });
      } else {
        setDeleteError(data.error || "Failed to preview deletion");
      }
    } catch (e: any) {
      setDeleteError(e.message || "Failed to preview deletion");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handler to confirm delete
  const confirmDeleteMember = async () => {
    if (!pendingDeleteMember) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pendingDeleteMember.id, email: pendingDeleteMember.email, confirm: true })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDeleteConfirmed(true);
        // Remove from staff list in UI
        setStaffMembers((prev) => prev.filter((m) => m.id !== pendingDeleteMember.id));
      } else {
        setDeleteError(data.error || "Failed to delete user");
      }
    } catch (e: any) {
      setDeleteError(e.message || "Failed to delete user");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    if (!businessId) return;

    try {
      setLoading(true);
      await removeDuplicateStaffMembers(businessId);
      
      // Refresh the staff members list
      const business = await getBusiness(user!.uid);
      if (business) {
        setStaffMembers(business.staffMembers || []);
      }
      
      toast.success("Duplicate staff members removed successfully!");
    } catch (error) {
      console.error("Error removing duplicates:", error);
      toast.error("Failed to remove duplicates. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <LoadingScreen message="Loading business settings..." fullScreen={false} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Business Settings</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage your business information, staff members, and gym customers
        </p>
      </div>

      <Tabs defaultValue="gym-members" className="w-full max-w-full">
                    <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4 h-auto bg-gray-50 border border-gray-200 rounded-lg p-1">
          <TabsTrigger 
            value="staff" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md"
          >
            <UserCheck className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Staff Members</span>
            <span className="sm:hidden text-center">Staff</span>
          </TabsTrigger>
          <TabsTrigger 
            value="gym-members" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md"
          >
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Gym Customers</span>
            <span className="sm:hidden text-center">Customers</span>
          </TabsTrigger>
          <TabsTrigger 
            value="company" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md"
          >
            <Building className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Company Info</span>
            <span className="sm:hidden text-center">Company</span>
          </TabsTrigger>
          <TabsTrigger 
            value="categories" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md"
          >
            <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Categories</span>
            <span className="sm:hidden text-center">Categories</span>
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
              <div className="flex items-center gap-2">
                <div className="bg-white border rounded-lg px-3 py-1">
                  <span className="text-sm font-medium text-gray-700">{staffMembers.length} Staff Members</span>
                </div>
                {staffMembers.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveDuplicates}
                    disabled={loading}
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                    title="Remove duplicate staff members"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Clean Duplicates</span>
                        <span className="sm:hidden">Clean</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {staffMembers.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Staff Members Added</h3>
                  <p className="text-sm text-gray-500 mb-4">Add staff members who need access to your gym's admin system</p>
                </div>
              ) : (
                staffMembers.map((member) => {
                  const roleInfo = getRoleInfo(member.role);
                  return (
                    <div key={member.id} className="bg-white border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <UserCheck className="h-5 w-5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <span className="font-medium text-gray-900 truncate">
                                  {member.firstName && member.lastName 
                                    ? `${member.firstName} ${member.lastName}` 
                                    : member.email
                                  }
                                </span>
                                {member.firstName && member.lastName && (
                                  <span className="text-xs sm:text-sm text-gray-500 truncate">({member.email})</span>
                                )}
                                {/* Account status indicator */}
                                <div className="flex items-center gap-1">
                                  {member.hasAccount ? (
                                    <div className="flex items-center gap-1">
                                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                                      <span className="text-xs text-green-600 font-medium">Account Active</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                                      <span className="text-xs text-yellow-600 font-medium">Needs Account</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                                  🔑 {roleInfo.label}
                                </span>
                                <span className="text-xs text-gray-500 hidden sm:block">
                                  {roleInfo.description}
                                </span>
                                {!member.hasAccount && (
                                  <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                    ⚠ Send invitation
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col gap-1 mt-1">
                                {member.phone && (
                                  <div className="text-xs text-gray-500">
                                    📞 {member.phone}
                                  </div>
                                )}
                                {member.department && (
                                  <div className="text-xs text-gray-500">
                                    🏢 {member.department}
                                  </div>
                                )}
                                {member.hasAccount && (
                                  <div className="text-xs text-green-600">
                                    ✓ Profile data from user account
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditMember(member)}
                            disabled={loading || addingMember || updatingMember}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                            title="Edit staff member"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePasswordReset(member.email)}
                            disabled={loading || addingMember || sendingPasswordReset}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 w-8 p-0"
                            title="Send password reset email"
                          >
                            {sendingPasswordReset ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Key className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={loading || addingMember}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            title="Remove staff member"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="staff-email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="staff-email"
                        placeholder="Enter staff member's email address"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        disabled={loading || addingMember}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staff-role" className="text-sm font-medium">
                        Role
                      </Label>
                      <Select value={selectedRole} onValueChange={setSelectedRole} disabled={loading || addingMember}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {STAFF_ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              <div className="flex flex-col">
                                <span className="font-medium">{role.label}</span>
                                <span className="text-xs text-gray-500">{role.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <p className="text-xs text-gray-500">
                      They'll receive an invitation email to set up their staff account
                    </p>
                    <Button
                      type="button"
                      onClick={handleAddMember}
                      disabled={!newMemberEmail.trim() || loading || addingMember}
                      className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto sm:min-w-[160px]"
                    >
                      {addingMember ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          <span className="hidden sm:inline">Sending Invite...</span>
                          <span className="sm:hidden">Sending...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Add Staff Member</span>
                          <span className="sm:hidden">Add Staff</span>
                        </>
                      )}
                    </Button>
                  </div>
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

      {/* Edit Staff Member Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-blue-600" />
              Edit Staff Member
            </DialogTitle>
          </DialogHeader>
          
          {editingMember && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Email (cannot be changed)</div>
                <div className="font-medium">{editingMember.email}</div>
              </div>

              {/* Account Status Indicator */}
              <div className={`p-3 rounded-lg border ${
                editFormData.userAccountStatus === "created" 
                  ? "bg-green-50 border-green-200" 
                  : editFormData.userAccountStatus === "not_created"
                  ? "bg-yellow-50 border-yellow-200"
                  : editFormData.userAccountStatus === "checking"
                  ? "bg-blue-50 border-blue-200"
                  : "bg-gray-50 border-gray-200"
              }`}>
                <div className="flex items-center gap-2">
                  {editFormData.userAccountStatus === "created" && (
                    <>
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Account Created</span>
                    </>
                  )}
                  {editFormData.userAccountStatus === "not_created" && (
                    <>
                      <UserX className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Account Not Created</span>
                    </>
                  )}
                  {editFormData.userAccountStatus === "checking" && (
                    <>
                      <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                      <span className="text-sm font-medium text-blue-800">Checking account status...</span>
                    </>
                  )}
                  {editFormData.userAccountStatus === "error" && (
                    <>
                      <X className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-800">Unable to check account status</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {editFormData.userAccountStatus === "created" && 
                    "This staff member has created their account and can log in. Profile data is loaded from their account."
                  }
                  {editFormData.userAccountStatus === "not_created" && 
                    "This staff member hasn't created their account yet. Send them an invitation email to sign up."
                  }
                  {editFormData.userAccountStatus === "checking" && 
                    "Checking if this staff member has created their account..."
                  }
                  {editFormData.userAccountStatus === "error" && 
                    "Could not verify account status. Profile data shown is from business records only."
                  }
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First Name</Label>
                  <Input
                    id="edit-firstName"
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    placeholder={editFormData.hasUserAccount ? "From user account" : "Enter first name"}
                    disabled={updatingMember}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Last Name</Label>
                  <Input
                    id="edit-lastName"
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    placeholder={editFormData.hasUserAccount ? "From user account" : "Enter last name"}
                    disabled={updatingMember}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  placeholder={editFormData.hasUserAccount ? "From user account" : "Enter phone number"}
                  disabled={updatingMember}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Input
                  id="edit-department"
                  value={editFormData.department}
                  onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                  placeholder="Enter department"
                  disabled={updatingMember}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select 
                  value={editFormData.role} 
                  onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}
                  disabled={updatingMember}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{role.label}</span>
                          <span className="text-xs text-gray-500">{role.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
                  <Key className="h-4 w-4" />
                  Password Reset
                </div>
                <p className="text-xs text-blue-600 mb-2">
                  To change the password, send a password reset email to the staff member.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePasswordReset(editingMember.email)}
                  disabled={sendingPasswordReset}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  {sendingPasswordReset ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Key className="h-3 w-3 mr-1" />
                      Send Reset Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={updatingMember}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateMember}
              disabled={updatingMember}
              className="min-w-[120px]"
            >
              {updatingMember ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Staff Member"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Staff Member Confirmation Dialog */}
      <Dialog open={!!pendingDeleteMember} onOpenChange={(open) => { if (!open) setPendingDeleteMember(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Staff Member</DialogTitle>
          </DialogHeader>
          {pendingDeleteMember && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 p-3 rounded">
                <div className="font-medium text-red-700 mb-1">Warning: This action is permanent!</div>
                <div className="text-sm text-red-600">
                  This will <b>permanently delete</b> <span className="font-semibold">{pendingDeleteMember.email}</span> from the system, including their login, profile, and all business memberships.<br />
                  {deletePreview && (deletePreview.bookingsCount > 0 || deletePreview.classesCount > 0) && (
                    <>
                      <br />
                      <span className="font-semibold">This will also cancel:</span>
                      <ul className="list-disc ml-6">
                        {deletePreview.bookingsCount > 0 && <li>{deletePreview.bookingsCount} bookings</li>}
                        {deletePreview.classesCount > 0 && <li>{deletePreview.classesCount} classes</li>}
                      </ul>
                    </>
                  )}
                </div>
              </div>
              {deleteError && <div className="text-red-600 text-sm">{deleteError}</div>}
              {deleteConfirmed ? (
                <div className="text-green-700 font-medium">User deleted successfully.</div>
              ) : (
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPendingDeleteMember(null)} disabled={deleteLoading}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={confirmDeleteMember} disabled={deleteLoading || !deletePreview}>
                    {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Delete User
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}