import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { suggestManOfMatch } from "@/lib/cricket-match-logic"

// GET man of match suggestion
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params

    // Get batting statistics
    const battingStats = await query(
      `SELECT 
        player_id,
        SUM(runs_scored) as runs,
        SUM(balls_faced) as balls,
        p.name as player_name
       FROM cricket_player_innings cpi
       JOIN players p ON cpi.player_id = p.id
       WHERE cpi.match_id = $1
       GROUP BY player_id, p.name
       HAVING SUM(balls_faced) > 0
       ORDER BY runs DESC`,
      [matchId]
    )

    // Get bowling statistics
    const bowlingStats = await query(
      `SELECT 
        player_id,
        SUM(wickets_taken) as wickets,
        SUM(runs_conceded) as runs,
        SUM(overs_bowled) as overs,
        p.name as player_name
       FROM cricket_player_bowling cpb
       JOIN players p ON cpb.player_id = p.id
       WHERE cpb.match_id = $1
       GROUP BY player_id, p.name
       HAVING SUM(overs_bowled) > 0
       ORDER BY wickets DESC`,
      [matchId]
    )

    // query() returns an array directly
    const batStats = (Array.isArray(battingStats) ? battingStats : []).map((row) => ({
      playerId: row.player_id,
      runs: parseInt(row.runs),
      balls: parseInt(row.balls),
      playerName: row.player_name,
    }))

    const bowlStats = (Array.isArray(bowlingStats) ? bowlingStats : []).map((row) => ({
      playerId: row.player_id,
      wickets: parseInt(row.wickets),
      runs: parseInt(row.runs),
      overs: parseFloat(row.overs),
      playerName: row.player_name,
    }))

    const suggestion = suggestManOfMatch(batStats, bowlStats)

    if (!suggestion) {
      return NextResponse.json(
        { suggestion: null, candidates: { batStats, bowlStats } },
        { status: 200 }
      )
    }

    // Get player details
    const playerDetails = await query(
      `SELECT p.*, t.name as team_name 
       FROM players p 
       JOIN teams t ON p.team_id = t.id
       WHERE p.id = $1`,
      [suggestion.playerId]
    )

    return NextResponse.json(
      {
        suggestion: {
          ...suggestion,
          player: Array.isArray(playerDetails) && playerDetails.length > 0 ? playerDetails[0] : null,
        },
        candidates: { batStats, bowlStats },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error suggesting man of match:", error)
    return NextResponse.json(
      { error: "Failed to suggest man of match" },
      { status: 500 }
    )
  }
}

// PUT - Update man of match
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params
    const body = await request.json()
    const { manOfMatchPlayerId, winnerTeamId, winMargin, matchStatus } = body

    // Check if summary exists
    const existing = await query(
      `SELECT match_id FROM cricket_match_summary WHERE match_id = $1`,
      [matchId]
    )

    // query() returns an array directly
    const hasExisting = Array.isArray(existing) && existing.length > 0
    
    if (hasExisting) {
      // Update existing summary
      const result = await query(
        `UPDATE cricket_match_summary 
         SET 
           man_of_match_player_id = $1,
           winner_team_id = COALESCE($2, winner_team_id),
           win_margin = COALESCE($3, win_margin),
           match_status = COALESCE($4, match_status),
           updated_at = CURRENT_TIMESTAMP
         WHERE match_id = $5
         RETURNING *`,
        [manOfMatchPlayerId, winnerTeamId, winMargin, matchStatus, matchId]
      )

      if (!result || !Array.isArray(result) || result.length === 0) {
        return NextResponse.json(
          { error: "Failed to update summary" },
          { status: 500 }
        )
      }

      return NextResponse.json({ summary: result[0] }, { status: 200 })
    } else {
      // Create new summary
      const result = await query(
        `INSERT INTO cricket_match_summary 
           (match_id, man_of_match_player_id, winner_team_id, win_margin, match_status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [matchId, manOfMatchPlayerId, winnerTeamId, winMargin, matchStatus]
      )

      if (!result || !Array.isArray(result) || result.length === 0) {
        return NextResponse.json(
          { error: "Failed to create summary" },
          { status: 500 }
        )
      }

      return NextResponse.json({ summary: result[0] }, { status: 201 })
    }
  } catch (error) {
    console.error("Error updating man of match:", error)
    return NextResponse.json(
      { error: "Failed to update man of match" },
      { status: 500 }
    )
  }
}

