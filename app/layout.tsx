import React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Gym Slot – Effortless Gym Booking App",
  description: "Book your gym sessions easily with Gym Slot. The simplest way for gyms and members to manage bookings, save time, and maximize workout efficiency.",
  keywords: "gym booking, gym slot, fitness booking, gym management, workout scheduling, gym app, book gym, gym reservation, fitness app",
  authors: [{ name: "Gym Slot Team" }],
  openGraph: {
    title: "Gym Slot – Effortless Gym Booking App",
    description: "Book your gym sessions easily with Gym Slot. The simplest way for gyms and members to manage bookings, save time, and maximize workout efficiency.",
    url: "https://www.gym-slot.com",
    siteName: "Gym Slot",
    images: [
      {
        url: "https://www.gym-slot.com/images/logo.png",
        width: 1200,
        height: 630,
        alt: "Gym Slot – Effortless Gym Booking App",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gym Slot – Effortless Gym Booking App",
    description: "Book your gym sessions easily with Gym Slot. The simplest way for gyms and members to manage bookings, save time, and maximize workout efficiency.",
    images: ["https://www.gym-slot.com/images/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/gym-slot-logo.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/images/gym-slot-logo.png" />
        <link rel="apple-touch-icon" href="/images/gym-slot-logo.png" />
        <meta name="theme-color" content="#1A202C" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#22223b',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              },
              success: {
                style: {
                  borderLeft: '4px solid #38b000',
                },
                iconTheme: {
                  primary: '#38b000',
                  secondary: '#fff',
                },
              },
              error: {
                style: {
                  borderLeft: '4px solid #d90429',
                },
                iconTheme: {
                  primary: '#d90429',
                  secondary: '#fff',
                },
              },
              loading: {
                style: {
                  borderLeft: '4px solid #4361ee',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}