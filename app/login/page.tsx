import Login from "@/components/auth/Login";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT;

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

      {/* Main login content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Login />
          
          {/* Signup section for gym owners */}
          <div className="mt-8 text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <h3 className="text-white text-lg font-semibold mb-2">
                Are you a gym owner?
              </h3>
              <p className="text-white/80 text-sm mb-4">
                Join hundreds of gyms already using GymSlot to manage their business and delight their members.
              </p>
              <Link href="/signup">
                <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold">
                  Start Your Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}