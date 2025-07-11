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
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

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
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
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

      if (businessId && (!role || !isStaffRole(role))) {
        // Customer signup - create account without automatic login
        try {
          // Create Firebase auth account without logging in
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          
          // Create the associated account and add to business
          await createAccount(userCredential.user, businessId, role);
          
          // Sign out immediately to prevent CRM access
          await signOut(auth);
          
          // Show success message and send email
          const successMessage = "Welcome to the gym! 🎉 Your account has been created successfully. You are not logged into this web platform - please check your email for next steps and download the mobile app to book classes.";
          
          setSuccessMessage(successMessage);
          setSignupSuccess(true);
          
          toast.success(successMessage, {
            duration: 8000,
            icon: '📱',
          });
          
          // Send customer welcome email with mobile app download links
          try {
            await fetch("/api/send-email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "noreply@gym-slot.com",
                to: email,
                subject: "Welcome to the Gym - Download the Mobile App",
                html: `
                  <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to the Gym! 🎉</h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">
                        Your account is ready
                      </p>
                    </div>
                    
                    <div style="background: white; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
                      <h2 style="color: #059669; margin: 0 0 20px 0; font-size: 24px;">Next Steps: Download the Mobile App</h2>
                      
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Your gym membership account has been successfully created! To start booking classes and managing your membership, please download our mobile app.
                      </p>
                      
                      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                        <h3 style="color: #059669; margin: 0 0 15px 0; font-size: 18px;">📱 Download the Mobile App</h3>
                        <p style="color: #374151; margin: 0 0 15px 0;">
                          The mobile app is where you'll:
                        </p>
                        <ul style="color: #374151; margin: 0; padding-left: 20px;">
                          <li style="margin-bottom: 8px;">Book and manage your class reservations</li>
                          <li style="margin-bottom: 8px;">View your membership details and payment history</li>
                          <li style="margin-bottom: 8px;">Receive notifications about classes and gym updates</li>
                          <li style="margin-bottom: 8px;">Access your digital membership card</li>
                        </ul>
                      </div>
                      
                      <div style="text-align: center; margin: 30px 0;">
                        <div style="display: inline-block; margin: 0 10px;">
                          <a href="https://apps.apple.com/app/gymslot" style="background: #000; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                            📱 Download for iOS
                          </a>
                        </div>
                        <div style="display: inline-block; margin: 0 10px;">
                          <a href="https://play.google.com/store/apps/details?id=com.gymslot.app" style="background: #000; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                            🤖 Download for Android
                          </a>
                        </div>
                      </div>
                      
                      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                        <p style="color: #92400e; margin: 0; font-weight: 500;">
                          💡 Tip: Use the same email and password you just created to log into the mobile app!
                        </p>
                      </div>
                      
                      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                        Need help? Contact your gym staff or reply to this email for assistance.
                      </p>
                    </div>
                  </div>
                `,
                text: `
Welcome to the Gym! 🎉

Your account has been successfully created! To start booking classes and managing your membership, please download our mobile app.

Download the Mobile App:
- iOS: https://apps.apple.com/app/gymslot
- Android: https://play.google.com/store/apps/details?id=com.gymslot.app

The mobile app is where you'll:
• Book and manage your class reservations
• View your membership details and payment history
• Receive notifications about classes and gym updates
• Access your digital membership card

Tip: Use the same email and password you just created to log into the mobile app!

Need help? Contact your gym staff for assistance.
                `,
                userId: "system",
              }),
            });
          } catch (emailError) {
            console.error("Failed to send customer welcome email:", emailError);
            // Don't show error to user - account creation was successful
          }
          
          // Stay on signup page with success message, don't redirect
        } catch (accountError) {
          console.error("Error creating customer account:", accountError);
          toast.error(`Account creation failed: ${(accountError as Error).message}`);
        }
      } else {
        // Staff member or demo account signup - use normal flow with automatic login
        const userCredential = await signup(email, password);

        // Then create the associated account and add to business
        try {
          await createAccount(userCredential.user, businessId, role);
          
          if (businessId) {
            // Staff member signup - redirect to CRM
            const successMessage = `Welcome to the team as a ${getRoleDisplayName(role || 'staff member')}! 🎉 You can now access the admin dashboard and view your profile.`;
            
            toast.success(successMessage, {
              duration: 6000,
              icon: '🎉',
            });
            
            // Redirect to account settings where users can see their role
            setTimeout(() => {
              router.push("/account-settings");
            }, 2000);
          } else {
            toast.success(
              "Account created successfully! ✉️ You can now log in and access your dashboard.",
              {
                duration: 6000,
                icon: '✉️',
              }
            );
            
            // Redirect to login page for demo accounts
            setTimeout(() => {
              router.push("/login");
            }, 2000);
          }
        } catch (accountError) {
          console.error("Error creating account:", accountError);
          toast.error(`Account created but setup failed: ${(accountError as Error).message}`);

          // Even if account setup fails, redirect to login page
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        }
      }
    } catch (error) {
      console.error("Error during signup:", error);
      toast.error("Failed to create account: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-md border-white/20 shadow-2xl">
      {signupSuccess ? (
        // Success state for customers
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-6 h-16 w-16 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Created Successfully! 🎉</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {successMessage}
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-green-800 font-semibold mb-2">📱 Next Steps:</h3>
            <ul className="text-green-700 text-sm space-y-1 text-left">
              <li>• Check your email for download links</li>
              <li>• Download the mobile app (iOS or Android)</li>
              <li>• Log in with your email and password</li>
              <li>• Start booking classes!</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> You are not logged into this web platform. This is for staff members only. 
              Use the mobile app to access your gym membership and book classes.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => router.push("/download-app")}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
            >
              📱 View Download Page
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setSignupSuccess(false);
                setEmail("");
                setPassword("");
                setConfirmPassword("");
              }}
              className="w-full"
            >
              Create Another Account
            </Button>
          </div>
        </CardContent>
      ) : (
        // Regular signup form
        <>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 h-16 w-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Create Account</CardTitle>
            <p className="text-gray-600 text-sm mt-2">
              {businessId ? "Join the gym and start booking classes" : "Start your free trial"}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Rest of the form content */}
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
        </>
      )}
    </Card>
  );
}