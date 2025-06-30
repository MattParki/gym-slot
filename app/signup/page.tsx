import { Suspense } from "react";
import Signup from "@/components/auth/Signup";

export default function SignupPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="max-w-md mx-auto">
        <Suspense fallback={<div>Loading...</div>}>
          <Signup />
        </Suspense>
      </div>
    </div>
  );
}