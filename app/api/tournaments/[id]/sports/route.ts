import { type NextRequest, NextResponse } from "next/server"
import { addTournamentSport, getTournamentSports } from "@/lib/server-data"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sports = await getTournamentSports(id)
    return NextResponse.json(sports)
  } catch (error) {
    console.error("Error fetching tournament sports:", error)
    return NextResponse.json({ error: "Failed to fetch tournament sports" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { sport, displayOrder } = body

    if (!sport) {
      return NextResponse.json({ error: "Sport is required" }, { status: 400 })
    }

    const tournamentSport = await addTournamentSport(id, sport, displayOrder || 0)

    return NextResponse.json(tournamentSport, { status: 201 })
  } catch (error) {
    console.error("Error adding tournament sport:", error)
    return NextResponse.json({ error: "Failed to add tournament sport" }, { status: 500 })
  }
}

