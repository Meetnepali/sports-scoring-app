import { type NextRequest, NextResponse } from "next/server"
import { getMatchById, updateMatchScore, updateMatchStatus, deleteMatch } from "@/lib/server-data"
import { requireAdmin } from "@/lib/authorization"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const match = await getMatchById(id)

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    return NextResponse.json(match)
  } catch (error) {
    console.error("Error fetching match:", error)
    return NextResponse.json({ error: "Failed to fetch match" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck) {
    return adminCheck
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { score, status } = body

    if (score) {
      await updateMatchScore(id, score)
    }

    if (status) {
      await updateMatchStatus(id, status)
    }

    const match = await getMatchById(id)
    return NextResponse.json(match)
  } catch (error) {
    console.error("Error updating match:", error)
    return NextResponse.json({ error: "Failed to update match" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck) {
    return adminCheck
  }

  try {
    const { id } = await params
    await deleteMatch(id)
    return NextResponse.json({ success: true, message: "Match deleted successfully" })
  } catch (error) {
    console.error("Error deleting match:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to delete match"
    const statusCode = errorMessage.includes("Cannot delete") ? 400 : 500
    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}
