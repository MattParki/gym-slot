"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createAccount } from "@/lib/createAccount";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { UserPlus, Eye, EyeOff, CheckCircle } from "lucide-react";

// Helper function to get role display name
const getRoleDisplayName = (role: string): string => {
  const roleMap: { [key: string]: string } = {
    staff: "Staff Member",
    personal_trainer: "Personal Trainer",
    administrator: "Administrator", 
    manager: "Manager",
    receptionist: "Receptionist",
    member: "Member"
  };
  return roleMap[role] || role.replace(/_/g, ' ');
};

const isStaffRole = (role: string): boolean => {
  const staffRoles = ['staff', 'personal_trainer', 'administrator', 'manager', 'receptionist'];
  return staffRoles.includes(role);
};

export default function DemoSignup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [acceptedMarketing, setAcceptedMarketing] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const businessIdParam = searchParams.get('businessId');
    const emailParam = searchParams.get('email');
    const roleParam = searchParams.get('role');
    
    if (businessIdParam) {
      setBusinessId(businessIdParam);
    }
    
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
    
    if (roleParam) {
      setRole(roleParam);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);

      // First, create the Firebase auth account
      const userCredential = await signup(email, password);

      // Then create the associated account and add to business
      try {
        await createAccount(userCredential.user, businessId, role);
        
        if (businessId) {
          const successMessage = role && isStaffRole(role) 
            ? `Welcome to the team as a ${getRoleDisplayName(role)}! 🎉 Please check your email (including spam folder) for a verification link, then you can access the admin dashboard.`
            : "Welcome to the gym! 🎉 Please check your email (including spam folder) for a verification link, then download the mobile app to start booking classes.";
          
          toast.success(successMessage, {
            duration: 8000,
            icon: '🎉',
          });
        } else {
          toast.success(
            "Account created successfully! ✉️ Please check your email (including spam folder) for a verification link, then download the mobile app.",
            {
              duration: 8000,
              icon: '✉️',
            }
          );
        }

        // Redirect to download app page after short delay
        setTimeout(() => {
          router.push("/download-app");
        }, 2000);
      } catch (accountError) {
        console.error("Error creating account:", accountError);
        toast.error(`Account created but setup failed: ${(accountError as Error).message}`);

        // Even if account setup fails, redirect to download app
        setTimeout(() => {
          router.push("/download-app");
        }, 3000);
      }
    } catch (err) {
      console.error("Account creation error:", err);
      toast.error(`Failed to create account: ${(err as Error).message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-md border-white/20 shadow-2xl">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 h-16 w-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center">
          <UserPlus className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          {businessId 
            ? (role && isStaffRole(role) ? `Join as ${getRoleDisplayName(role)}` : "Join the Gym")
            : "Create Your Account"
          }
        </CardTitle>
        <CardDescription className="text-gray-600 mt-2">
          {businessId 
            ? (role && isStaffRole(role)
                ? "Create your staff account to access the admin dashboard and manage the gym"
                : "Create your account to join this gym and start booking classes"
              )
            : "Sign up to start managing your gym business with GymSlot"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-gray-700 font-medium">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="mt-1">
              <input
                type="checkbox"
                id="marketing"
                checked={acceptedMarketing}
                onChange={(e) => setAcceptedMarketing(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="marketing" className="text-sm text-gray-700 leading-relaxed">
                I agree to receive occasional emails to help improve the platform. This really helps us understand
                interest and demand. You can opt out at any time.
              </label>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full h-11 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {businessId 
                  ? (role && isStaffRole(role) ? `Joining as ${getRoleDisplayName(role)}...` : "Joining Gym...")
                  : "Creating Account..."
                }
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <UserPlus className="h-4 w-4" />
                {businessId 
                  ? (role && isStaffRole(role) ? `Join as ${getRoleDisplayName(role)}` : "Join Gym")
                  : "Create Account"
                }
              </div>
            )}
          </Button>
        </form>

        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              Sign in here
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}