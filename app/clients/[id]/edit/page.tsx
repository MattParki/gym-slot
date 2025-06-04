import LayoutWrapper from "@/components/LayoutWrapper"
import ClientForm from "@/components/client-form"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { Suspense } from "react"

export default async function EditClientPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute>
      <LayoutWrapper>
        <div className="min-h-screen flex flex-col">
          <div className="bg-[#141E33] text-white rounded-lg">
          <div className="container mx-auto p-8 md:py-8">
              <h1 className="text-4xl md:text-4xl font-bold mb-4">
                Edit Client
              </h1>
            </div>
          </div>
          <div className="container mx-auto px-4 py-8 flex-grow">
            <Suspense fallback={<div>Loading...</div>}>
              <ClientForm clientId={params.id} />
            </Suspense>
          </div>
        </div>
      </LayoutWrapper>
    </ProtectedRoute>
  )
}