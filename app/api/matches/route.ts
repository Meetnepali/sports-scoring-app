import { type NextRequest, NextResponse } from "next/server"
import { createMatch, getMatchesByStatusFromDB } from "@/lib/server-data"
import { requireAdmin } from "@/lib/authorization"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'scheduled' | 'started' | 'live' | 'completed' | null
    
    if (status) {
      const matches = await getMatchesByStatusFromDB(status)
      return NextResponse.json(matches)
    } else {
      // Return all matches if no status specified
      const scheduled = await getMatchesByStatusFromDB('scheduled')
      const started = await getMatchesByStatusFromDB('started')
      const live = await getMatchesByStatusFromDB('live')
      const completed = await getMatchesByStatusFromDB('completed')
      
      return NextResponse.json({
        scheduled,
        started,
        live,
        completed,
        all: [...scheduled, ...started, ...live, ...completed]
      })
    }
  } catch (error) {
    console.error("Error fetching matches:", error)
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck) {
    return adminCheck
  }

  try {
    const body = await request.json()
    const { sport, homeTeamId, awayTeamId, date, venue, status, tournamentId } = body

    console.log("Received match creation request:", { sport, homeTeamId, awayTeamId, date, venue, status })

    if (!sport || !homeTeamId || !awayTeamId || !date || !venue) {
      const missingFields = []
      if (!sport) missingFields.push('sport')
      if (!homeTeamId) missingFields.push('homeTeamId')
      if (!awayTeamId) missingFields.push('awayTeamId')
      if (!date) missingFields.push('date')
      if (!venue) missingFields.push('venue')
      
      console.error("Missing required fields:", missingFields)
      return NextResponse.json({ 
        error: "Missing required fields", 
        missingFields 
      }, { status: 400 })
    }

    const match = await createMatch({
      sport,
      homeTeamId,
      awayTeamId,
      date,
      venue,
      status: status || "scheduled",
    })

    console.log("Match created successfully:", match.id)
    return NextResponse.json(match, { status: 201 })
  } catch (error) {
    console.error("Error creating match:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create match"
    return NextResponse.json({ 
      error: "Failed to create match", 
      details: errorMessage 
    }, { status: 500 })
  }
}
