"use client"

import { ToastProvider as RadixToastProvider } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { ToastViewport } from "@/components/ui/toast"

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <RadixToastProvider>
      {children}
      <ToastViewport />
    </RadixToastProvider>
  )
}