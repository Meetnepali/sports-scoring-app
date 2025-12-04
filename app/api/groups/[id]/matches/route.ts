import { type NextRequest, NextResponse } from "next/server"
import { createGroupMatch, getGroupMatches, updateGroupMatch, deleteGroupMatch } from "@/lib/server-data"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const matches = await getGroupMatches(id)
    return NextResponse.json(matches)
  } catch (error) {
    console.error("Error fetching group matches:", error)
    return NextResponse.json({ error: "Failed to fetch group matches" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { team1Id, team2Id, team1Score, team2Score, winnerId, matchDate, status } = body

    if (!team1Id || !team2Id) {
      return NextResponse.json({ error: "Both team IDs are required" }, { status: 400 })
    }

    const match = await createGroupMatch({
      groupId: id,
      team1Id,
      team2Id,
      team1Score,
      team2Score,
      winnerId,
      matchDate,
      status,
    })

    return NextResponse.json(match, { status: 201 })
  } catch (error) {
    console.error("Error creating group match:", error)
    return NextResponse.json({ error: "Failed to create group match" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { matchId, team1Score, team2Score, winnerId, matchDate, status } = body

    if (!matchId) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 })
    }

    const match = await updateGroupMatch(matchId, {
      team1Score,
      team2Score,
      winnerId,
      matchDate,
      status,
    })

    return NextResponse.json(match)
  } catch (error) {
    console.error("Error updating group match:", error)
    return NextResponse.json({ error: "Failed to update group match" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const matchId = searchParams.get("matchId")

    if (!matchId) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 })
    }

    await deleteGroupMatch(matchId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting group match:", error)
    return NextResponse.json({ error: "Failed to delete group match" }, { status: 500 })
  }
}

