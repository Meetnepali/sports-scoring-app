"use client"

import { usePathname } from "next/navigation"
import Navbar from "@/components/navbar"

export default function NavbarWrapper() {
  const pathname = usePathname()
  
  // Hide navbar on auth pages
  const isAuthPage = pathname === "/login" || pathname === "/signup"
  
  if (isAuthPage) {
    return null
  }
  
  return <Navbar />
}

