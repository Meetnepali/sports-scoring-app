import { type NextRequest, NextResponse } from "next/server"
import { addTeamToGroup, removeTeamFromGroup, getGroupTeams } from "@/lib/server-data"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const teams = await getGroupTeams(id)
    return NextResponse.json(teams)
  } catch (error) {
    console.error("Error fetching group teams:", error)
    return NextResponse.json({ error: "Failed to fetch group teams" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { teamId, displayOrder } = body

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    const groupTeam = await addTeamToGroup(id, teamId, displayOrder || 0)

    return NextResponse.json(groupTeam, { status: 201 })
  } catch (error) {
    console.error("Error adding team to group:", error)
    return NextResponse.json({ error: "Failed to add team to group" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const teamId = searchParams.get("teamId")

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    await removeTeamFromGroup(id, teamId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing team from group:", error)
    return NextResponse.json({ error: "Failed to remove team from group" }, { status: 500 })
  }
}

