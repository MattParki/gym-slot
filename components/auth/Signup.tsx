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

export default function DemoSignup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [acceptedMarketing, setAcceptedMarketing] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    const businessIdParam = searchParams.get('businessId');
    const emailParam = searchParams.get('email');
    
    if (businessIdParam) {
      setBusinessId(businessIdParam);
    }
    
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      // First, create the Firebase auth account
      const userCredential = await signup(email, password);

      // Then create the associated account and add to business
      try {
        await createAccount(userCredential.user, businessId);
        
        if (businessId) {
          toast.success(
            "Account created! You've been added to the gym. Please check your email (including spam folder) for a verification link, then download the mobile app to start booking classes.",
            {
              duration: 8000,
              icon: '🎉',
            }
          );
        } else {
          toast.success(
            "Account created! Please check your email (including spam folder) for a verification link, then download the mobile app.",
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          {businessId ? "Join Gym" : "Create Account"}
        </CardTitle>
        <CardDescription className="text-center">
          {businessId 
            ? "Create your account to join this gym and start booking classes"
            : "Sign up for an account to explore our platform"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="marketing"
              checked={acceptedMarketing}
              onChange={(e) => setAcceptedMarketing(e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="marketing" className="text-sm text-gray-700">
              I agree to receive occasional emails to help improve the platform. This really helps us understand
              interest and demand. You can opt out at any time.
            </label>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-[#141E33]">
            {loading 
              ? (businessId ? "Joining Gym..." : "Creating Account...") 
              : (businessId ? "Join Gym" : "Create Account")
            }
          </Button>
        </form>

        <div className="text-center mt-4">
          Already have an account? <a href="/login" className="text-blue-600 hover:underline">Log in</a>
        </div>
      </CardContent>
    </Card>
  );
}