import { type NextRequest, NextResponse } from "next/server"
import { deleteTeamByIdFromDB, getTeamByIdFromDB, updateTeam, checkDuplicateTeamName } from "@/lib/server-data"
import { requireAdmin } from "@/lib/authorization"

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const team = await getTeamByIdFromDB(id)

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    return NextResponse.json(team)
  } catch (error) {
    console.error("Error fetching team:", error)
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck) {
    return adminCheck
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { name, sport, logo, players } = body

    if (!name || !sport) {
      return NextResponse.json({ error: "Name and sport are required" }, { status: 400 })
    }

    // Check for duplicate team name in the same sport (excluding current team)
    const isDuplicate = await checkDuplicateTeamName(name, sport, id)
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

    const team = await updateTeam(id, {
      name,
      sport,
      logo,
      players: sanitizedPlayers,
    })

    return NextResponse.json(team)
  } catch (error) {
    console.error("Error updating team:", error)
    const message = error instanceof Error ? error.message : "Failed to update team"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck) {
    return adminCheck
  }

  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "Team id is required" }, { status: 400 })
    }

    const team = await getTeamByIdFromDB(id)
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    await deleteTeamByIdFromDB(id)

    return NextResponse.json({ 
      success: true, 
      message: `Team "${team.name}" and all related records deleted successfully` 
    })
  } catch (error) {
    console.error("Error deleting team:", error)
    
    // Provide more helpful error messages
    const errorMessage = error instanceof Error ? error.message : "Failed to delete team"
    
    return NextResponse.json({ 
      error: errorMessage,
      details: "The team could not be deleted. This may be due to database constraints or related records."
    }, { status: 500 })
  }
}
