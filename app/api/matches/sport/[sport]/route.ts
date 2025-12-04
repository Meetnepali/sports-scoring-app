import { type NextRequest, NextResponse } from "next/server"
import { getMatchesBySport } from "@/lib/server-data"

export async function GET(request: NextRequest, { params }: { params: { sport: string } }) {
  try {
    const matches = await getMatchesBySport(params.sport)
    return NextResponse.json(matches)
  } catch (error) {
    console.error("Error fetching matches by sport:", error)
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 })
  }
}
