"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import toast from 'react-hot-toast';
import { MailIcon, LogIn, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
  
    try {
      setError("");
      setLoading(true);
  
      const loadingToast = toast.loading("Logging in...");
  
      await login(email, password);
  
      toast.dismiss(loadingToast);
      toast.success(`Welcome back!`, {
        icon: "👋",
      });
  
      // Redirect to home page after successful login
      router.push("/");
    } catch (err) {
      toast.dismiss();
  
      const message = (err as Error).message;
  
      if (message.includes("verify your email")) {
        toast.error("Please verify your email. Check your inbox and junk folder.", {
          icon: <MailIcon className="w-5 h-5" />,
        });
      } else if (message.includes("customer") || message.includes("mobile app")) {
        // Customer trying to access CRM - redirect to download app
        toast.error("This login is for staff members only. Customers should use the mobile app.", {
          icon: "📱",
          duration: 5000,
        });
        
        // Redirect to download app page after a short delay
        setTimeout(() => {
          router.push("/download-app");
        }, 2000);
      } else {
        toast.error("Failed to sign in: " + message);
      }
  
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-md border-white/20 shadow-2xl">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 h-16 w-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center">
          <LogIn className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">Staff Login</CardTitle>
        <p className="text-gray-600 text-sm mt-2">
          Sign in to access the admin dashboard
        </p>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-xs">
            <strong>Note:</strong> This login is for gym staff and administrators only. 
            Customers should use the mobile app to book classes.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
          
          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full h-11 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Signing in...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </div>
            )}
          </Button>
        </form>
        
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            Don't have an account?{" "}
            <button
              onClick={() => router.push("/signup")}
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              Create one here
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}