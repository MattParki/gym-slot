import LayoutWrapper from "@/components/LayoutWrapper"
import ProposalForm from "@/components/proposal-form"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { Suspense } from "react"

export default function CreateProposalPage() {
  return (
    <ProtectedRoute>
      <LayoutWrapper>
        <div className="min-h-screen flex flex-col">
          <div className="bg-[#141E33] text-white rounded-lg">
            <div className="container mx-auto p-8 md:py-8">
              <h1 className="text-4xl md:text-4xl font-bold mb-4">Create New Proposal</h1>
            </div>
          </div>
          <div className="container mx-auto px-4 py-8 flex-grow">
            <Suspense fallback={<div>Loading...</div>}>
              <ProposalForm />
            </Suspense>
          </div>
        </div>
      </LayoutWrapper>
    </ProtectedRoute>
  )
}