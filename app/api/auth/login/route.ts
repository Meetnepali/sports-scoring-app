import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmailFromDB } from "@/lib/server-data"
import { createSession, verifyPassword } from "@/lib/auth"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Get user by email
    const user = await getUserByEmailFromDB(email)
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password against stored hash
    const userWithPassword = await query(`SELECT password FROM users WHERE email = $1`, [email])
    if (userWithPassword.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }
    const isValidPassword = await verifyPassword(password, userWithPassword[0].password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create session
    const sessionToken = await createSession(user.id)

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    })

    // Set session cookie
    response.cookies.set("auth-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error("Error logging in:", error)
    return NextResponse.json({ error: "Failed to login" }, { status: 500 })
  }
}
