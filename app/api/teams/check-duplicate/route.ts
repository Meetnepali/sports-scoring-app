import { type NextRequest, NextResponse } from "next/server"
import { checkDuplicateTeamName } from "@/lib/server-data"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const name = searchParams.get('name')
    const sport = searchParams.get('sport')
    const excludeId = searchParams.get('excludeId')
    
    if (!name || !sport) {
      return NextResponse.json({ error: "Name and sport required" }, { status: 400 })
    }
    
    const exists = await checkDuplicateTeamName(name, sport, excludeId || undefined)
    return NextResponse.json({ exists })
  } catch (error) {
    console.error("Error checking duplicate team name:", error)
    return NextResponse.json({ error: "Failed to check duplicate" }, { status: 500 })
  }
}

