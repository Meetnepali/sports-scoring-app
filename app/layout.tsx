import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import NavbarWrapper from "@/components/navbar-wrapper"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sports Scoring Platform",
  description: "Track matches, manage teams, and analyze performance across multiple sports",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <NavbarWrapper />
            <main>{children}</main>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
