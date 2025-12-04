import { type NextRequest, NextResponse } from "next/server"
import { createUserInDB, getUserByEmailFromDB } from "@/lib/server-data"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { users } = body

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: "Users array is required" }, { status: 400 })
    }

    const createdUsers = []
    const errors = []

    for (const userData of users) {
      try {
        const { username, full_name, email, phone_number, password, number } = userData

        if (!username || !full_name || !email || !password) {
          errors.push({ email: email || "unknown", error: "Missing required fields" })
          continue
        }

        // Check if user already exists
        const existingUser = await getUserByEmailFromDB(email)
        if (existingUser) {
          // User exists, return existing user info
          createdUsers.push({
            id: existingUser.id,
            username: existingUser.username,
            email: existingUser.email,
            fullName: existingUser.fullName,
            phoneNumber: null,
            number: number,
          })
          continue
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

        createdUsers.push({
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          phoneNumber: phone_number || null,
          number: number,
        })
      } catch (error) {
        console.error("Error creating user:", error)
        errors.push({
          email: userData.email || "unknown",
          error: error instanceof Error ? error.message : "Failed to create user",
        })
      }
    }

    if (createdUsers.length === 0 && errors.length > 0) {
      return NextResponse.json(
        { error: "Failed to create any users", errors },
        { status: 400 }
      )
    }

    return NextResponse.json({
      users: createdUsers,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully created ${createdUsers.length} user(s)${errors.length > 0 ? `, ${errors.length} error(s)` : ""}`,
    })
  } catch (error) {
    console.error("Error in bulk user creation:", error)
    return NextResponse.json(
      { error: "Failed to create users" },
      { status: 500 }
    )
  }
}

