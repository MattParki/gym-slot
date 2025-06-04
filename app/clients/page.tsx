import LayoutWrapper from "@/components/LayoutWrapper"
import ClientList from "@/components/client-list"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { Suspense } from "react"

export default function ClientListPage() {
  return (
    <ProtectedRoute>
      <LayoutWrapper>
        <div className="min-h-screen flex flex-col">
          <div className="bg-[#141E33] text-white rounded-lg">
            <div className="container mx-auto p-8 md:py-8">
              <h1 className="text-4xl md:text-4xl font-bold mb-4">
                Client Management
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-4">
                Manage your prospects and clients in one place
              </p>
            </div>
          </div>
          <div className="container mx-auto px-4 py-8 flex-grow">
            <Suspense fallback={<div>Loading...</div>}>
              <ClientList />
            </Suspense>
          </div>
        </div>
      </LayoutWrapper>
    </ProtectedRoute>
  )
}