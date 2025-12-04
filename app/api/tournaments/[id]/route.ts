import { type NextRequest, NextResponse } from "next/server"
import { getTournamentById, updateTournament, deleteTournament } from "@/lib/server-data"
import { requireAdmin } from "@/lib/authorization"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tournament = await getTournamentById(params.id)

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    return NextResponse.json(tournament)
  } catch (error) {
    console.error("Error fetching tournament:", error)
    return NextResponse.json({ error: "Failed to fetch tournament" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck) {
    return adminCheck
  }

  try {
    const body = await request.json()
    const { name, status, matches, bracketConfig } = body

    await updateTournament(params.id, {
      name,
      status,
      matches,
      bracketConfig,
    })

    const tournament = await getTournamentById(params.id)
    return NextResponse.json(tournament)
  } catch (error) {
    console.error("Error updating tournament:", error)
    return NextResponse.json({ error: "Failed to update tournament" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck) {
    return adminCheck
  }

  try {
    await deleteTournament(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting tournament:", error)
    return NextResponse.json({ error: "Failed to delete tournament" }, { status: 500 })
  }
}
