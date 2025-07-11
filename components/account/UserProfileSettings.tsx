"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateUserProfile, getUserProfile } from "@/services/userService";
import { getBusiness, SubscriptionInfo } from "@/services/businessService";
import { AlertCircle, User, Briefcase } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { roleOptions } from "@/models/UserProfile";
import { MobileTooltip } from "@/components/MobileTooltip";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import LoadingScreen from "@/components/LoadingScreen";

export default function UserProfileSettings() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading,] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      const fetchUserData = async () => {
        try {
          const userProfile = await getUserProfile(user.uid);
          if (userProfile) {
            setDisplayName(userProfile.displayName || "");
            setFirstName(userProfile.firstName || "");
            setLastName(userProfile.lastName || "");
            setPhone(userProfile.phone || "");
            setBio(userProfile.bio || "");
            setSpecialties(userProfile.specialties || []);
            setRole(userProfile.role || "");
            setIndustry(userProfile.industry || "");

            const business = await getBusiness(user.uid);
            if (business && business.owners?.includes(user.uid)) {
              setIsBusinessOwner(true);
              if (business.subscriptionInfo) {
                setSubscriptionInfo(business.subscriptionInfo);
              }
            }
          }
          setInitialLoading(false);
        } catch (error) {
          toast.error("Failed to load user profile data.");
          setInitialLoading(false);
        }
      };

      fetchUserData();
    }
  }, [user]);

  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
      setSpecialties([...specialties, newSpecialty.trim()]);
      setNewSpecialty("");
    }
  };

  const handleRemoveSpecialty = (index: number) => {
    setSpecialties(specialties.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const profileUpdates: any = {
        displayName,
        firstName,
        lastName,
        phone,
        bio,
        specialties,
      };

      // Only business owners can update role and industry
      if (isBusinessOwner) {
        profileUpdates.role = role;
        profileUpdates.industry = industry;
      }

      await updateUserProfile(user.uid, profileUpdates);

      toast.success("Your profile has been updated.");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <LoadingScreen message="Loading your profile..." fullScreen={false} />;
  }

  const getRoleDisplayName = (roleValue: string) => {
    const roleMap: { [key: string]: string } = {
      owner: "Business Owner",
      staff: "Staff Member",
      personal_trainer: "Personal Trainer",
      administrator: "Administrator",
      manager: "Manager",
      receptionist: "Receptionist",
      customer: "Customer"
    };
    return roleMap[roleValue] || roleValue;
  };

  return (
    <div className="space-y-6">
      {/* Role Info Banner */}
      <div className={`border-l-4 pl-4 p-4 rounded ${
        isBusinessOwner 
          ? "border-green-500 bg-green-50" 
          : "border-blue-500 bg-blue-50"
      }`}>
        <div className="flex items-center gap-2">
          {isBusinessOwner ? (
            <Briefcase className="h-5 w-5 text-green-600" />
          ) : (
            <User className="h-5 w-5 text-blue-600" />
          )}
          <h3 className="font-semibold text-lg">
            {getRoleDisplayName(role)}
          </h3>
        </div>
        <p className="text-sm text-gray-700 mt-1">
          {isBusinessOwner 
            ? "You have full access to update your profile and business settings."
            : "You can update your personal profile information. Changes will be synced with your business staff records. Contact your business administrator for role changes."
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mb-8">
        {/* Personal Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your first name"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Your last name"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How you'd like to be shown"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2 mt-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="email">Email Address</Label>
              <MobileTooltip
                content={
                  <p className="max-w-xs">
                    Email changes require verification. Please contact support to update your email address.
                  </p>
                }
              />
            </div>
            <Input
              id="email"
              type="email"
              value={email}
              readOnly
              className="bg-muted cursor-not-allowed"
              placeholder="your.email@example.com"
            />
          </div>
        </div>

        {/* Professional Information Section */}
        {(role === "personal_trainer" || role === "staff" || role === "administrator" || role === "manager") && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Professional Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio / About You</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell customers about your background, experience, and approach..."
                rows={4}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialties">Specialties</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  id="newSpecialty"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  placeholder="Add a specialty (e.g., Weight Loss, Strength Training)"
                  disabled={loading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSpecialty();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddSpecialty}
                  disabled={loading || !newSpecialty.trim()}
                  variant="outline"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {specialty}
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecialty(index)}
                      className="text-blue-600 hover:text-blue-800"
                      disabled={loading}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Business Settings Section (Owner Only) */}
        {isBusinessOwner && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Business Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="role">Role</Label>
                </div>
                <Select
                  value={role}
                  onValueChange={setRole}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Fitness & Health"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Current Role Display (Non-Owners) */}
        {!isBusinessOwner && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="role">Your Role</Label>
              <MobileTooltip
                content={
                  <p className="max-w-xs">
                    Your role is assigned by your business administrator. Contact them to request role changes.
                  </p>
                }
              />
            </div>
            <Input
              id="role"
              value={getRoleDisplayName(role)}
              readOnly
              className="bg-muted cursor-not-allowed"
            />
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full md:w-auto">
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </form>

      {isBusinessOwner && subscriptionInfo && subscriptionInfo.subscriptionId && subscriptionInfo.status !== "cancelled" && subscriptionInfo.status !== "inactive" && (
        <div>
          <p><strong>Subscription Status:</strong> {subscriptionInfo.status}</p>
          <p><strong>Plan:</strong> {subscriptionInfo.productName}</p>
          <Button
            variant="destructive"
            className="mt-2"
            onClick={() => setShowCancelModal(true)}
          >
            Cancel Subscription
          </Button>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogTitle>Cancel Subscription</DialogTitle>
          <div className="mt-2 text-sm text-muted-foreground space-y-4">
            <p>
              <strong className="text-foreground">Cancelling your subscription</strong> will immediately revoke access to the following premium features:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Unlimited class bookings</strong> — let your members book as many sessions as they need.</li>
              <li><strong>Custom branding</strong> — keep your gym's look and feel across your booking platform.</li>
              <li><strong>Advanced scheduling tools</strong> — manage classes, waitlists, and more.</li>
              <li><strong>Real-time notifications</strong> — keep everyone in the loop.</li>
              <li><strong>Priority support & onboarding</strong> — get help from our team.</li>
            </ul>
            <p>
              You can resubscribe at any time from your dashboard.
            </p>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              Keep Subscription
            </Button>
            <Button variant="destructive" disabled={cancelLoading}>
              {cancelLoading ? "Cancelling..." : "Cancel Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}