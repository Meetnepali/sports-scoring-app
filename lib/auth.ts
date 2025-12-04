import { query } from "./database"
import { randomBytes, createHash } from "crypto"

export interface User {
  id: string
  username: string
  email: string
  full_name: string
  role: "user" | "admin"
  avatar_url?: string
  profile_photo?: string
  phone_number?: string
  created_at: string
}

export interface AuthResult {
  success: boolean
  user?: User
  token?: string
  error?: string
}

export function generateToken(): string {
  return randomBytes(32).toString("hex")
}

// Simple password hashing function
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Verify password
export function verifyPassword(plainPassword: string, hashedPassword: string): boolean {
  const hashedInput = hashPassword(plainPassword);
  return hashedInput === hashedPassword;
}

export async function createUser(userData: {
  username: string
  email: string
  full_name: string
  phone_number?: string
  password: string
  role?: "user" | "admin"
}): Promise<AuthResult> {
  try {
    // Check if user already exists
    const existingUser = await query("SELECT id FROM users WHERE email = $1 OR username = $2", [
      userData.email,
      userData.username,
    ])

    if (existingUser.length > 0) {
      return { success: false, error: "User already exists" }
    }

    // Hash the password before storing
    const hashedPassword = hashPassword(userData.password);
    
    // Create user with hashed password
    const result = await query(
      `INSERT INTO users (username, email, full_name, phone_number, password, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, full_name, phone_number, role, avatar_url, created_at`,
      [userData.username, userData.email, userData.full_name, userData.phone_number || null, hashedPassword, userData.role || "user"],
    )

    const user = result[0]
    const token = generateToken()

    // Create session
    await query(
      `INSERT INTO user_sessions (user_id, session_token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, token, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)],
    )

    return { success: true, user, token }
  } catch (error) {
    console.error("Create user error:", error)
    return { success: false, error: "Failed to create user" }
  }
}

export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    // Get user by email
    const result = await query(
      "SELECT id, username, email, full_name, role, password, avatar_url, created_at FROM users WHERE email = $1",
      [email],
    )

    if (result.length === 0) {
      return { success: false, error: "Invalid email or password" }
    }

    const user = result[0]

    // Verify password using secure comparison
    if (!verifyPassword(password, user.password)) {
      return { success: false, error: "Invalid email or password" }
    }

    // Generate token
    const token = generateToken()

    // Create session
    await query(
      `INSERT INTO user_sessions (user_id, session_token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, token, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)],
    )

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return { success: true, user: userWithoutPassword, token }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "Login failed" }
  }
}

export async function getUserFromToken(token: string): Promise<User | null> {
  try {
    // Check if session exists and is valid, get user by email
    const sessionResult = await query(
      `SELECT u.id, u.username, u.email, u.full_name, u.role, u.avatar_url, u.created_at
       FROM user_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.session_token = $1 AND s.expires_at > NOW()`,
      [token],
    )

    return sessionResult.length > 0 ? sessionResult[0] : null
  } catch (error) {
    console.error("Get user from token error:", error)
    return null
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await query(
      "SELECT id, username, email, full_name, role, avatar_url, created_at FROM users WHERE email = $1",
      [email],
    )

    return result.length > 0 ? result[0] : null
  } catch (error) {
    console.error("Get user by email error:", error)
    return null
  }
}

export async function logoutUser(token: string): Promise<boolean> {
  try {
    await query("DELETE FROM user_sessions WHERE session_token = $1", [token])
    return true
  } catch (error) {
    console.error("Logout error:", error)
    return false
  }
}

export async function createSession(userId: string): Promise<string> {
  try {
    // Generate a new session token
    const token = generateToken()
    
    // Create session with expiration date (7 days from now)
    await query(
      `INSERT INTO user_sessions (user_id, session_token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    )
    
    return token
  } catch (error) {
    console.error("Create session error:", error)
    throw new Error("Failed to create session")
  }
}
