import { type NextRequest, NextResponse } from "next/server"
import { createUserInDB, getUserByEmailFromDB } from "@/lib/server-data"
import { createSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, full_name, phone_number, password, confirm_password } = body

    if (!username || !email || !full_name || !password) {
      return NextResponse.json({ error: "Username, email, name, and password are required" }, { status: 400 })
    }

    // Validate password confirmation
    if (password !== confirm_password) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await getUserByEmailFromDB(email)
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Create new user
    const user = await createUserInDB({
      username,
      email,
      fullName: full_name,
      phoneNumber: phone_number || null,
      password,
      role: "user",
    })

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
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
