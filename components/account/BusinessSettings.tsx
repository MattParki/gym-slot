"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
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
            // Extract domain from email
            if (business.email) {
              const domain = business.email.split('@')[1];
              setEmailDomain(domain || "");
            }
            setMembers(business.members || []);
            // Set company info
            setCompanyName(business.companyName || "");
            setContactInfo(business.contactInfo || "");
            setSpecialty(business.specialty || "");
          }
          setInitialLoading(false);
        } catch (error) {
          console.error("Error fetching business data:", error);
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
        specialty
      });

      toast.success("Business settings have been updated.");
    } catch (error) {
      console.error("Error updating business:", error);
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
      console.error("Error adding/inviting member:", error);
      toast.error("Failed to add or invite member.");
    } finally {
      setLoading(false);
    }
  };


  const handleRemoveMember = async (memberId: string) => {
    if (!businessId) return;

    try {
      setLoading(true);
      // Remove member from the business
      await removeBusinessMember(businessId, memberId);

      // Update local state
      setMembers(members.filter(member => member.id !== memberId));

      toast.success("Member has been removed from your business.");
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div>Loading business data...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="company">Company Info</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="businessEmail">Business Email</Label>
              <MobileTooltip
                content={
                  <p className="max-w-xs">
                    Email changes require verification. Please contact support to update your email address.
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
            {emailDomain && (
              <p className="text-sm text-muted-foreground mt-1">
                Users at your company can use @{emailDomain} domain
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Business Members</Label>

            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-2">
                  <div className="flex-1 p-3 border rounded-md">
                    <div className="flex justify-between items-center">
                      <div>{member.email}</div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">{member.role}</div>
                  </div>
                </div>
              ))}

              <div className="flex gap-2">
                <Input
                  placeholder="Add member email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  disabled={loading}
                />
                <Button
                  type="button"
                  onClick={handleAddMember}
                  disabled={!newMemberEmail.trim() || loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
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
            <p className="text-sm text-muted-foreground">
              Additional contact details to display in proposals (website, address, etc.)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialty">Business Specialty</Label>
            <Input
              id="specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Your Primary Business Specialty"
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Will be used in proposals to describe your services
            </p>
          </div>
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