import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getUserFromToken } from "./auth"

/**
 * Get the current user from the session cookie (for Server Components)
 * This function can be used in Server Components and API routes
 */
export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    return null
  }

  try {
    const user = await getUserFromToken(token)
    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }
  
  return user
}

/**
 * Require admin role - redirect to home with error if not admin
 */
export async function requireAdmin() {
  const user = await requireAuth()
  
  if (user.role !== "admin") {
    redirect("/?error=access_denied&message=You do not have permission to access this page. Admin access required.")
  }
  
  return user
}

