import { type NextRequest, NextResponse } from "next/server"
import { createTournament, getAllTournaments } from "@/lib/server-data"
import { requireAdmin } from "@/lib/authorization"

export async function GET() {
  try {
    const tournaments = await getAllTournaments()
    return NextResponse.json(tournaments)
  } catch (error) {
    console.error("Error fetching tournaments:", error)
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck) {
    return adminCheck
  }

  try {
    const body = await request.json()
    const { name, sport, format, bracketType, startDate, teams, matches, teamLogos } = body

    if (!name || !sport || !format || !bracketType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const tournament = await createTournament({
      name,
      sport,
      format,
      bracketType,
      startDate,
      teams: teams || [],
      matches: matches || [],
      teamLogos: teamLogos || {},
    })

    return NextResponse.json(tournament, { status: 201 })
  } catch (error) {
    console.error("Error creating tournament:", error)
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 })
  }
}
