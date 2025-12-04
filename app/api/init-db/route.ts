import { NextResponse } from "next/server"
import { initializeDatabase } from "@/lib/init-db"
import { seedDatabase } from "@/lib/seed-db"

export async function POST(request: Request) {
  try {
    const { seed } = await request.json()

    // Initialize database schema
    await initializeDatabase()

    // Seed database with sample data if requested
    if (seed) {
      await seedDatabase()
    }

    return NextResponse.json({
      success: true,
      message: seed ? "Database initialized and seeded successfully" : "Database initialized successfully",
    })
  } catch (error) {
    console.error("Error initializing database:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize database",
      },
      { status: 500 },
    )
  }
}
