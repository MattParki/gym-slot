"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserProfile, getUserProfile } from "@/services/userService";
import { getBusiness, SubscriptionInfo } from "@/services/businessService";
import { AlertCircle } from "lucide-react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!isBusinessOwner) {
      toast.error("Only gym owners can update profile information.");
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile(user.uid, {
        displayName,
        role,
        industry,
      });

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

  return (
    <>
      {!isBusinessOwner && (
        <Alert variant="default" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You can view your assigned role below. Only business owners can update profile information. Contact your account administrator for changes.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              disabled={!isBusinessOwner}
              className={!isBusinessOwner ? "bg-muted cursor-not-allowed" : ""}
            />
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

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="role">Role</Label>
              {!isBusinessOwner && (
                <MobileTooltip
                  content={
                    <p className="max-w-xs">
                      Your role is assigned by your business administrator. Contact them to request role changes.
                    </p>
                  }
                />
              )}
            </div>
            <Select
              value={role}
              onValueChange={setRole}
              disabled={!isBusinessOwner}
            >
              <SelectTrigger className={!isBusinessOwner ? "bg-muted cursor-not-allowed" : ""}>
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
        </div>

        <Button type="submit" disabled={loading || !isBusinessOwner}>
          {loading ? "Saving..." : "Save Changes"}
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

      {isBusinessOwner && (!subscriptionInfo || subscriptionInfo.status === "cancelled" || subscriptionInfo.status === "inactive") && (
        <div className="mt-10 p-6 md:p-8 border rounded-2xl bg-background shadow-sm relative overflow-hidden">
          {/* Gradient background accent */}
          <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ background: "linear-gradient(135deg,rgb(30, 43, 69) 0%,rgb(255, 255, 255) 100%)", opacity: 0.08 }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-500 via-blue-500 to-blue-400 bg-clip-text text-transparent">
                Upgrade to Gym Slot Pro
              </h2>
              {/* PRO sticker */}
              <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-green-400 to-blue-900 text-white text-xs font-bold shadow-md border border-white">
                PRO
              </span>
            </div>
            <p className="text-muted-foreground mb-6 text-base">
              <span className="font-semibold text-foreground">Unlock your gym's full potential.</span>
              <br />
              <span className="text-foreground">Gym Slot Pro</span> gives you everything you need to manage bookings, members, and schedules with ease:
            </p>

            <ul className="space-y-4 text-sm text-muted-foreground pl-4 list-disc">
              <li>
                <strong className="text-foreground">Unlimited class bookings:</strong> No limits for your members or staff.
              </li>
              <li>
                <strong className="text-foreground">Custom branding:</strong> Personalize your booking experience with your gym's logo and colors.
              </li>
              <li>
                <strong className="text-foreground">Advanced scheduling tools:</strong> Manage recurring classes, waitlists, and more.
              </li>
              <li>
                <strong className="text-foreground">Real-time notifications:</strong> Keep your team and members updated instantly.
              </li>
              <li>
                <strong className="text-foreground">Priority support & onboarding:</strong> Get help from our team whenever you need it.
              </li>
            </ul>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto text-base font-bold bg-gradient-to-r from-green-500 via-blue-500 to-cyan-400 text-white shadow-lg hover:scale-105 transition-transform">
                <a
                  href="https://www.gym-slot.com/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Plans & Pricing
                </a>
              </Button>
              <span className="text-xs text-muted-foreground flex items-center">
                No risk – cancel anytime.
              </span>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogTitle>Are you sure you want to cancel?</DialogTitle>
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
            <Button variant="ghost" onClick={() => setShowCancelModal(false)}>
              Keep Subscription
            </Button>
            
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}