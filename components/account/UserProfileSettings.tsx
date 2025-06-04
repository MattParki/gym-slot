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
import SpecializationTagsInput from "@/components/SpecializationTagsInput";
import { roleOptions } from "@/models/UserProfile";
import { industryOptions } from "@/data/industryOptions";
import { MobileTooltip } from "@/components/MobileTooltip";
import toast from "react-hot-toast";
import SupportWidget from "../SupportWidget";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function UserProfileSettings() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const handleConfirmCancel = async () => {
    if (!subscriptionInfo) return;
    setCancelLoading(true);

    try {
      const res = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subscriptionInfo.subscriptionId }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Subscription cancelled: ${data.status}`);
        setShowCancelModal(false);

        if (user) {
          const updatedBusiness = await getBusiness(user.uid);
          if (updatedBusiness?.subscriptionInfo) {
            setSubscriptionInfo(updatedBusiness.subscriptionInfo);
          }
        }
      } else {
        toast.error(data.error || "Failed to cancel subscription.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while cancelling.");
    } finally {
      setCancelLoading(false);
    }
  };

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
            setSpecializations(userProfile.specializations || []);

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
          console.error("Error fetching user profile:", error);
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
      toast.error("Only business owners can update profile information.");
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile(user.uid, {
        displayName,
        role,
        industry,
        specializations,
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
    return <div>Loading user data...</div>;
  }

  return (
    <>
      {!isBusinessOwner && (
        <Alert variant="default" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Only business owners can update profile information. Contact your account administrator for changes.
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
            <Label htmlFor="role">Role</Label>
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

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Select
              value={industry}
              onValueChange={setIndustry}
              disabled={!isBusinessOwner}
            >
              <SelectTrigger className={!isBusinessOwner ? "bg-muted cursor-not-allowed" : ""}>
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                {industryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="specializations">Specializations</Label>
          <SpecializationTagsInput
            value={specializations}
            onChange={setSpecializations}
            placeholder="Add another specialization..."
            disabled={!isBusinessOwner}
          />
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
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-blue-500 to-blue-400 bg-clip-text text-transparent">
                Upgrade to ProspectsEasy
              </h2>
              {/* PRO sticker */}
              <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-blue-400 to-blue-900 text-white text-xs font-bold shadow-md border border-white">
                PRO
              </span>
            </div>
            <p className="text-muted-foreground mb-6 text-base">
              <span className="font-semibold text-foreground">Unlock your sales superpowers.</span>
              <br />
              <span className="text-foreground">ProspectsEasy Pro</span> gives you everything you need to win more deals, automate outreach, and stand out from the crowd:
            </p>

            <ul className="space-y-4 text-sm text-muted-foreground pl-4 list-disc">
              <li>
                <strong className="text-foreground">Up to 900 proposals/month:</strong> Consistent, high-volume outreach for serious growth.
              </li>
              <li>
                <strong className="text-foreground">Custom Domain Emailing:</strong> Build trust and boost deliverability by sending from <span className="underline decoration-wavy decoration-pink-400">your own brand</span>.
              </li>
              <li>
                <strong className="text-foreground">AI-Powered Lead Generation:</strong> Unlimited access to our smart Leadgen engine — <span className="text-green-600 font-semibold">included free</span>.
              </li>
              <li>
                <strong className="text-foreground">Real-Time Engagement Alerts:</strong> Get notified instantly when leads interact, so you can follow up at the perfect moment.
              </li>
              <li>
                <strong className="text-foreground">Priority Support & Onboarding:</strong> 24/7 help from our team, plus white-glove onboarding.
              </li>
            </ul>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto text-base font-bold bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 text-white shadow-lg hover:scale-105 transition-transform">
                <a
                  href="https://prospectseasy.com#pricing"
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
              <li><strong>900 monthly proposals</strong> — maintain consistent outreach volume.</li>
              <li><strong>Custom domain email sending</strong> — send emails from your branded domain.</li>
              <li><strong>AI-powered lead generation</strong> — access unlimited smart lead suggestions.</li>
              <li><strong>Real-time engagement alerts</strong> — get notified when leads engage.</li>
              <li><strong>Priority support & onboarding</strong> — white-glove help from our team.</li>
            </ul>
            <p>
              You can resubscribe at any time from your dashboard.
            </p>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setShowCancelModal(false)}>
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancelLoading}
            >
              {cancelLoading ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SupportWidget supportEmail="contact@prospectseasy.com" />
    </>
  );
}
