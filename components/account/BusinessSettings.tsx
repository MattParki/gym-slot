"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Users, UserCheck, Building, FolderOpen, Loader2, Edit2, Key } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  getBusiness,
  updateBusiness,
  addBusinessMember,
  removeBusinessMember,
  removeBusinessStaffMember,
  updateBusinessStaffMember,
  sendPasswordResetEmail,
  BusinessMember
} from "@/services/businessService";
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
    role: "staff"
  });
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

  // Helper function to get role display information
  const getRoleInfo = (roleValue: string) => {
    const role = STAFF_ROLES.find(r => r.value === roleValue);
    return role || { value: roleValue, label: roleValue.charAt(0).toUpperCase() + roleValue.slice(1), description: "Custom role" };
  };

  const handleEditMember = (member: BusinessMember) => {
    setEditingMember(member);
    setEditFormData({
      firstName: member.firstName || "",
      lastName: member.lastName || "",
      phone: member.phone || "",
      department: member.department || "",
      role: member.role
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateMember = async () => {
    if (!businessId || !editingMember) return;

    try {
      setUpdatingMember(true);
      await updateBusinessStaffMember(businessId, editingMember.id, editFormData);

      // Update local state
      setStaffMembers(staffMembers.map(member => 
        member.id === editingMember.id ? { ...member, ...editFormData } : member
      ));

      setIsEditModalOpen(false);
      setEditingMember(null);
      toast.success("Staff member updated successfully");
    } catch (error) {
      console.error("Error updating staff member:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update staff member");
    } finally {
      setUpdatingMember(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    try {
      setSendingPasswordReset(true);
      const result = await sendPasswordResetEmail(email);
      
      if (result.devMode && result.resetLink) {
        // Development mode - show the reset link
        toast.success(
          <div>
            <p>Development Mode: Password reset link generated!</p>
            <p className="text-xs mt-2">
              <a 
                href={result.resetLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline break-all"
              >
                Click here to reset password
              </a>
            </p>
          </div>,
          { duration: 10000 }
        );
      } else {
        toast.success(`Password reset email sent to ${email}`);
      }
    } catch (error) {
      console.error("Error sending password reset:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to send password reset email";
      
      // Check if it's a user-not-found error
      if (errorMessage.includes("complete account setup") || errorMessage.includes("User not found")) {
        toast.error(
          "This staff member hasn't completed their account setup yet. " +
          "Consider re-sending their invitation email instead.",
          { duration: 6000 }
        );
      } else if (errorMessage.includes("email")) {
        toast.error(
          "Email service is not configured. Please contact your system administrator.",
          { duration: 6000 }
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSendingPasswordReset(false);
    }
  };

  const handleAddMember = async () => {
    if (!businessId || !newMemberEmail.trim()) return;

    try {
      setAddingMember(true);
      const selectedRoleData = STAFF_ROLES.find(role => role.value === selectedRole);
      const newMember = await addBusinessMember(businessId, newMemberEmail.trim(), selectedRole);

      // Send staff invitation email
      const response = await fetch("/api/send-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newMember.email,
          businessId: businessId,
          businessName: companyName || "Your Business",
          role: selectedRole
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send invitation");
      }

      setStaffMembers([...staffMembers, newMember]);
      setNewMemberEmail("");
      setSelectedRole("staff"); // Reset to default

      toast.success(`${newMemberEmail} has been added as a ${selectedRoleData?.label || 'staff member'} and invited.`);
    } catch (error) {
      console.error("Error adding staff member:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add or invite staff member.");
    } finally {
      setAddingMember(false);
    }
  };


  const handleRemoveMember = async (memberId: string) => {
    if (!businessId) return;

    try {
      setLoading(true);
      await removeBusinessStaffMember(businessId, memberId);

      setStaffMembers(staffMembers.filter(member => member.id !== memberId));

      toast.success("Staff member has been removed from your business.");
    } catch (error) {
      toast.error("Failed to remove staff member. Please try again.");
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
              <div className="bg-white border rounded-lg px-3 py-1">
                <span className="text-sm font-medium text-gray-700">{staffMembers.length} Staff Members</span>
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
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                                  🔑 {roleInfo.label}
                                </span>
                                <span className="text-xs text-gray-500 hidden sm:block">
                                  {roleInfo.description}
                                </span>
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
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First Name</Label>
                  <Input
                    id="edit-firstName"
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    placeholder="Enter first name"
                    disabled={updatingMember}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Last Name</Label>
                  <Input
                    id="edit-lastName"
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    placeholder="Enter last name"
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
                  placeholder="Enter phone number"
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
    </div>
  );
}