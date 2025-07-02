interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

export default function LoadingScreen({ 
  message = "Loading...", 
  fullScreen = true 
}: LoadingScreenProps) {
  const containerClasses = fullScreen 
    ? "fixed inset-0 bg-white z-50 flex items-center justify-center"
    : "flex items-center justify-center py-20"

  return (
    <div className={containerClasses}>
      <div className="text-center">
        {/* Simple spinner */}
        <div className="mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-green-600 mx-auto"></div>
        </div>

        {/* Loading message */}
        <p className="text-gray-700 text-base font-semibold tracking-wide">{message}</p>
      </div>
    </div>
  )
} 