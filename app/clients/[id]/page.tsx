import LayoutWrapper from "@/components/LayoutWrapper"
import ClientDetail from "@/components/client-detail"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { Suspense } from "react"

export default function ClientDetailPage() {
  return (
    <ProtectedRoute>
      <LayoutWrapper>
        <div className="min-h-screen flex flex-col">
          <div className="bg-[#141E33] text-white rounded-lg">
            <div className="container mx-auto p-8 md:py-8">
              <h1 className="text-4xl md:text-4xl font-bold mb-4">
                Client Details
              </h1>
            </div>
          </div>
          <div className="container mx-auto px-4 py-8 flex-grow">
            <Suspense fallback={<div>Loading...</div>}>
              <ClientDetail />
            </Suspense>
          </div>
        </div>
      </LayoutWrapper>
    </ProtectedRoute>
  )
}