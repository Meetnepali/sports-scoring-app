import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

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

  // For admin-only routes, we'll check authorization in the actual page/API route
  // because Edge runtime doesn't support database queries
  // Admin routes: /matches/create, /tournaments/create, /teams/create, /teams/[id]/edit, etc.
  
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
