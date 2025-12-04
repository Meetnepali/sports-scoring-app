import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { updatePointsTableAfterMatch } from "@/lib/tournament-fixtures"
import { requireAdmin } from "@/lib/authorization"

// Complete a match and update points table
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck) {
    return adminCheck
  }

  try {
    const { id: matchId } = await params
    const body = await request.json()
    const { score, winnerId } = body
    
    if (!score) {
      return NextResponse.json(
        { error: "Score is required" },
        { status: 400 }
      )
    }
    
    // 1. Get match details
    const matchResult = await query(
      `SELECT m.*, gm.group_id, gm.team1_id, gm.team2_id
       FROM matches m
       LEFT JOIN group_matches gm ON m.id = gm.match_id
       WHERE m.id = $1`,
      [matchId]
    )
    
    if (matchResult.length === 0) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }
    
    const match = matchResult[0]
    
    // 2. Update match status and score in matches table
    await query(
      `UPDATE matches
       SET status = 'completed', score = $1
       WHERE id = $2`,
      [JSON.stringify(score), matchId]
    )
    
    // 3. Update group_matches if this is a tournament match
    if (match.group_id) {
      await query(
        `UPDATE group_matches
         SET status = 'completed',
             team1_score = $1,
             team2_score = $2,
             winner_id = $3
         WHERE match_id = $4`,
        [
          JSON.stringify(score.team1 || score),
          JSON.stringify(score.team2 || score),
          winnerId || null,
          matchId
        ]
      )
      
      // 4. Update points table if this is a tournament match
      try {
        await updatePointsTableAfterMatch(
          matchId,
          match.group_id,
          match.team1_id || match.home_team_id,
          match.team2_id || match.away_team_id,
          score,
          match.sport
        )
      } catch (error) {
        console.error("Error updating points table:", error)
        // Don't fail the request if points table update fails
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Match completed successfully",
      pointsTableUpdated: !!match.group_id
    })
  } catch (error) {
    console.error("Error completing match:", error)
    return NextResponse.json(
      { error: "Failed to complete match" },
      { status: 500 }
    )
  }
}

