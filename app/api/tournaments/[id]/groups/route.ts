import { type NextRequest, NextResponse } from "next/server"
import { createTournamentGroup, getTournamentGroups } from "@/lib/server-data"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const sport = searchParams.get("sport") || undefined

    const groups = await getTournamentGroups(id, sport)
    return NextResponse.json(groups)
  } catch (error) {
    console.error("Error fetching tournament groups:", error)
    return NextResponse.json({ error: "Failed to fetch tournament groups" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { tournamentSportId, groupName, sport, displayOrder } = body

    if (!tournamentSportId || !groupName || !sport) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const group = await createTournamentGroup(id, tournamentSportId, groupName, sport, displayOrder || 0)

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error("Error creating tournament group:", error)
    return NextResponse.json({ error: "Failed to create tournament group" }, { status: 500 })
  }
}

