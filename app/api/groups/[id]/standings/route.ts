import { type NextRequest, NextResponse } from "next/server"
import { getGroupStandings, resetGroupStandings } from "@/lib/tournament-fixtures"

// Get group standings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const standings = await getGroupStandings(id)
    return NextResponse.json(standings)
  } catch (error) {
    console.error("Error fetching group standings:", error)
    return NextResponse.json(
      { error: "Failed to fetch group standings" },
      { status: 500 }
    )
  }
}

// Reset group standings
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await resetGroupStandings(id)
    return NextResponse.json({ success: true, message: "Group standings reset successfully" })
  } catch (error) {
    console.error("Error resetting group standings:", error)
    return NextResponse.json(
      { error: "Failed to reset group standings" },
      { status: 500 }
    )
  }
}

