import { type NextRequest, NextResponse } from "next/server"
import { createTeam, getAllTeamsFromDB, checkDuplicateTeamName } from "@/lib/server-data"
import { requireAdmin } from "@/lib/authorization"

export async function GET() {
  try {
    const teams = await getAllTeamsFromDB()
    return NextResponse.json(teams)
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck) {
    return adminCheck
  }

  try {
    const body = await request.json()
    const { name, sport, logo, players } = body

    if (!name || !sport) {
      return NextResponse.json({ error: "Name and sport are required" }, { status: 400 })
    }

    // Check for duplicate team name in the same sport
    const isDuplicate = await checkDuplicateTeamName(name, sport)
    if (isDuplicate) {
      return NextResponse.json({ error: `A team named "${name}" already exists in ${sport}` }, { status: 400 })
    }

    if (!Array.isArray(players) || players.length === 0) {
      return NextResponse.json({ error: "Select at least one player" }, { status: 400 })
    }

    const sanitizedPlayers = players
      .map((player: any) => ({
        userId: typeof player?.userId === "string" ? player.userId.trim() : "",
        number: typeof player?.number === "number" ? player.number : undefined,
        position:
          typeof player?.position === "string" && player.position.trim().length > 0 ? player.position.trim() : undefined,
        phoneNumber: typeof player?.phoneNumber === "string" ? player.phoneNumber.trim() : undefined,
        profilePhoto: typeof player?.profilePhoto === "string" ? player.profilePhoto.trim() : undefined,
      }))
      .filter((player: { userId: string }) => player.userId)

    if (sanitizedPlayers.length === 0) {
      return NextResponse.json({ error: "Select at least one valid player" }, { status: 400 })
    }

    const uniqueUserIds = new Set(sanitizedPlayers.map((player) => player.userId))
    if (uniqueUserIds.size !== sanitizedPlayers.length) {
      return NextResponse.json({ error: "Each player can only be added once" }, { status: 400 })
    }

    const team = await createTeam({
      name,
      sport,
      logo,
      players: sanitizedPlayers,
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error("Error creating team:", error)
    const message = error instanceof Error ? error.message : "Failed to create team"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
