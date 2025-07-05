import { Suspense } from "react";
import Signup from "@/components/auth/Signup";
import LoadingScreen from "@/components/LoadingScreen";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#141E33] via-[#1a2847] to-[#0f1925]">
      {/* Header with back to homepage option */}
      <div className="container mx-auto px-4 py-6">
        <Link href="/">
          <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Homepage
          </Button>
        </Link>
      </div>

      {/* Main signup content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Suspense fallback={<LoadingScreen message="Loading signup form..." fullScreen={false} />}>
            <Signup />
          </Suspense>
          
          {/* Login section for existing users */}
          <div className="mt-8 text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <h3 className="text-white text-lg font-semibold mb-2">
                Already have an account?
              </h3>
              <p className="text-white/80 text-sm mb-4">
                Sign in to access your gym management dashboard or member account.
              </p>
              <Link href="/login">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold">
                  Sign In to Your Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}