"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createAccount } from "@/lib/createAccount";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function DemoSignup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();
  const [acceptedMarketing, setAcceptedMarketing] = useState(true);

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

      // Then create the associated demo business via our API
      try {
        console.log("Creating demo business for user:", userCredential.user);
        await createAccount(userCredential.user );
        toast.success(
          "Account created! Please check your email (including spam folder) for a verification link. You must verify your email before you can log in.",
          {
            duration: 8000,
            icon: '✉️',
          }
        );

        // Redirect to login page after short delay
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } catch (demoError) {
        console.error("Error creating demo business:", demoError);
        toast.error(`Account created but demo setup failed: ${(demoError as Error).message}`);

        // Even if demo account creation fails, redirect to login
        setTimeout(() => {
          router.push("/login");
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
        <CardTitle className="text-2xl text-center">Create Demo Account</CardTitle>
        <CardDescription className="text-center">
          Sign up for a free demo account to explore our platform
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
            {loading ? "Creating Demo Account..." : "Create Demo Account"}
          </Button>
        </form>

        <div className="text-center mt-4">
          Already have an account? <a href="/login" className="text-blue-600 hover:underline">Log in</a>
        </div>
      </CardContent>
    </Card>
  );
}