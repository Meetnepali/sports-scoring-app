import { type NextRequest, NextResponse } from "next/server"
import { logoutUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (token) {
      await logoutUser(token)
    }

    const response = NextResponse.json({ message: "Logged out successfully" })
    response.cookies.delete("auth-token")

    return response
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
