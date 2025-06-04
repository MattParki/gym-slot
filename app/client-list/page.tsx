import LayoutWrapper from "@/components/LayoutWrapper"
import ClientList from "@/components/client-list"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { Suspense } from "react"

export default function ClientListPage() {
  return (
    <ProtectedRoute>
      <LayoutWrapper>
        <div className="min-h-screen flex flex-col">
          <div className="bg-[#141E33] text-white">
            <div className="container mx-auto px-4 py-16 md:py-24">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Client List
              </h1>
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