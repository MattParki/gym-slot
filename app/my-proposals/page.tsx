import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LayoutWrapper from "@/components/LayoutWrapper";
import MyProposalsContent from "@/components/MyProposalsContent";
import { Suspense } from "react";

export default function MyProposalsPage() {
  return (
    <ProtectedRoute>
      <LayoutWrapper>
        <div className="min-h-screen flex flex-col">
          <div className="bg-[#141E33] text-white rounded-lg">
            <div className="container mx-auto p-8 md:py-8">
              <h1 className="text-4xl md:text-4xl font-bold mb-4">
                My Proposals
              </h1>
            </div>
          </div>
          <div className="container mx-auto px-4 py-8 flex-grow">
            <Suspense fallback={<div>Loading...</div>}>
              <MyProposalsContent />
            </Suspense>
          </div>
        </div>
      </LayoutWrapper>
    </ProtectedRoute>
  );
}