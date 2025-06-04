import React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from '@/contexts/AuthContext';
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ProspectsEasy - AI-Powered Proposal Generator for Businesses",
  description: "Create professional, customized proposals instantly with ProspectsEasy's AI-powered proposal generator. Save time and close deals faster.",
  keywords: "AI proposal generator, business proposals, professional proposals, instant proposals, AI tools for businesses, proposal automation, sales proposals, client proposals",
  authors: [{ name: "ProspectsEasy Team" }],
  openGraph: {
    title: "ProspectsEasy - AI-Powered Proposal Generator for Businesses",
    description: "Create professional, customized proposals instantly with ProspectsEasy's AI-powered proposal generator. Save time and close deals faster.",
    url: "https://www.prospectseasy.com",
    siteName: "ProspectsEasy",
    images: [
      {
        url: "https://www.prospectseasy.com/images/logo.png",
        width: 1200,
        height: 630,
        alt: "ProspectsEasy - AI-Powered Proposal Generator",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ProspectsEasy - AI-Powered Proposal Generator for Businesses",
    description: "Create professional, customized proposals instantly with ProspectsEasy's AI-powered proposal generator. Save time and close deals faster.",
    images: ["https://www.prospectseasy.com/images/logo.png"],
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
        <link rel="icon" href="/logo-only.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/images/logo-only.png" />
        <link rel="apple-touch-icon" href="/images/logo-only.png" />
        <meta name="theme-color" content="#141E33" />
      </head>
      <body className={inter.className}>
        <Analytics/>
        <AuthProvider>
          {children}
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#363636',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              },
              success: {
                style: {
                  borderLeft: '4px solid #10b981',
                },
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                style: {
                  borderLeft: '4px solid #ef4444',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
              loading: {
                style: {
                  borderLeft: '4px solid #3b82f6',
                },
              },
            }}
          />
       
        </AuthProvider>
      </body>
    </html>
  )
}