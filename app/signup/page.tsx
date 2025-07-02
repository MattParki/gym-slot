import { Suspense } from "react";
import Signup from "@/components/auth/Signup";
import LoadingScreen from "@/components/LoadingScreen";

export default function SignupPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="max-w-md mx-auto">
        <Suspense fallback={<LoadingScreen message="Loading signup form..." fullScreen={false} />}>
          <Signup />
        </Suspense>
      </div>
    </div>
  );
}