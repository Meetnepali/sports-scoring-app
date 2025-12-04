import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getUserRole } from "./lib/authorization"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/signup"]
  const publicApiRoutes = ["/api/auth/login", "/api/auth/signup", "/api/auth/me"]

  // Allow access to home page and public routes without authentication
  if (pathname === "/" || 
      publicRoutes.includes(pathname) || 
      publicApiRoutes.includes(pathname) ||
      pathname.startsWith("/_next/") ||
      pathname.includes("favicon.ico")) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Store the original URL to redirect back after login
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  // Admin-only routes that require admin role
  const adminOnlyRoutes = [
    "/matches/create",
    "/tournaments/create",
    "/teams/create",
  ]

  // Check if route matches admin-only pattern
  const isAdminOnlyRoute = adminOnlyRoutes.some(route => pathname.startsWith(route)) ||
    /^\/teams\/[^/]+\/edit$/.test(pathname) ||
    /^\/tournaments\/[^/]+\/edit$/.test(pathname) ||
    /^\/tournaments\/[^/]+\/create-match$/.test(pathname)

  if (isAdminOnlyRoute) {
    const role = await getUserRole(request)
    
    if (role !== "admin") {
      // Redirect non-admin users to home with error message
      const url = new URL("/", request.url)
      url.searchParams.set("error", "access_denied")
      url.searchParams.set("message", "You do not have permission to access this page. Admin access required.")
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
