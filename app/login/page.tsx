import Login from "@/components/auth/Login";
import Link from "next/link";

export default function LoginPage() {
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT;

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-md mx-auto">
        <Login />

        {(environment === "development" || environment === "demo") && (
          <p className="text-center mt-4">
            Don't have an account?{" "}
            <Link href="/signup" className="text-blue-500 hover:underline">
              Sign up
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}