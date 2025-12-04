import { type NextRequest, NextResponse } from "next/server"
import { getMatchesByStatus } from "@/lib/server-data"

export async function GET(request: NextRequest, { params }: { params: { status: string } }) {
  try {
    const status = params.status as "scheduled" | "live" | "completed"
    const matches = await getMatchesByStatus(status)
    return NextResponse.json(matches)
  } catch (error) {
    console.error("Error fetching matches by status:", error)
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 })
  }
}
