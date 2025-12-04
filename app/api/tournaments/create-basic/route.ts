import { type NextRequest, NextResponse } from "next/server"
import { createTournamentBasic } from "@/lib/server-data"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, sportsCount } = body

    if (!name) {
      return NextResponse.json({ error: "Tournament name is required" }, { status: 400 })
    }

    const tournament = await createTournamentBasic(name, sportsCount || 1)

    return NextResponse.json(tournament, { status: 201 })
  } catch (error) {
    console.error("Error creating tournament:", error)
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 })
  }
}

