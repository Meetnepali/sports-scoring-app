import { type NextRequest, NextResponse } from "next/server"
import { getUserFromToken } from "./auth"

export async function getUserRole(request: NextRequest): Promise<"admin" | "user" | null> {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return null
    }

    const user = await getUserFromToken(token)
    if (!user) {
      return null
    }

    return user.role as "admin" | "user"
  } catch (error) {
    console.error("Error getting user role:", error)
    return null
  }
}

export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const role = await getUserRole(request)
  
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
  }

  return null // User is admin, allow request to proceed
}

