import { type NextRequest, NextResponse } from "next/server"
import { getTeamsBySportFromDB } from "@/lib/server-data"

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ sport: string }> }
) {
  try {
    const { sport } = await params
    const teams = await getTeamsBySportFromDB(sport)
    return NextResponse.json(teams)
  } catch (error) {
    console.error("Error fetching teams by sport:", error)
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
  }
}
