import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAdmin } from "@/lib/authorization"

// GET cricket match configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await query(
      `SELECT 
        cmc.*,
        tw.name as toss_winner_team_name,
        bf.name as bat_first_team_name
       FROM cricket_match_config cmc
       LEFT JOIN teams tw ON cmc.toss_winner_team_id = tw.id
       LEFT JOIN teams bf ON cmc.elected_to_bat_first_team_id = bf.id
       WHERE cmc.match_id = $1`,
      [id]
    )

    // query() returns an array directly (result.rows from pg)
    if (!result || !Array.isArray(result) || result.length === 0) {
      return NextResponse.json({ config: null }, { status: 200 })
    }

    return NextResponse.json({ config: result[0] }, { status: 200 })
  } catch (error) {
    console.error("Error fetching cricket config:", error)
    return NextResponse.json(
      { error: "Failed to fetch cricket configuration" },
      { status: 500 }
    )
  }
}

// POST/PUT cricket match configuration (toss and match settings)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck) {
    return adminCheck
  }

  try {
    const { id } = await params
    const body = await request.json()

    const {
      totalOvers,
      maxOversPerBowler,
      tossWinnerTeamId,
      tossDecision,
      electedToBatFirstTeamId,
    } = body

    // Validate required fields
    if (!totalOvers || !maxOversPerBowler) {
      return NextResponse.json(
        { error: "Total overs and max overs per bowler are required" },
        { status: 400 }
      )
    }

    // Check if config already exists
    const existingConfigResult = await query(
      `SELECT id, config_completed FROM cricket_match_config WHERE match_id = $1`,
      [id]
    )
    
    // query() returns an array directly
    const hasExistingConfig = existingConfigResult && Array.isArray(existingConfigResult) && existingConfigResult.length > 0

    if (hasExistingConfig) {
      // Update existing config
      const result = await query(
        `UPDATE cricket_match_config 
         SET 
           total_overs = $1,
           max_overs_per_bowler = $2,
           toss_winner_team_id = $3,
           toss_decision = $4,
           elected_to_bat_first_team_id = $5,
           config_completed = $6,
           updated_at = CURRENT_TIMESTAMP
         WHERE match_id = $7
         RETURNING *`,
        [
          totalOvers,
          maxOversPerBowler,
          tossWinnerTeamId || null,
          tossDecision || null,
          electedToBatFirstTeamId || null,
          // config_completed is true ONLY when toss data is provided (toss completed)
          // During match creation: tossWinnerTeamId and tossDecision are null → config_completed = false
          // After toss: tossWinnerTeamId and tossDecision have values → config_completed = true
          tossWinnerTeamId && tossDecision ? true : false,
          id,
        ]
      )

      // query() returns an array directly
      if (!result || !Array.isArray(result) || result.length === 0) {
        return NextResponse.json(
          { error: "Failed to update configuration" },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ config: result[0] }, { status: 200 })
    } else {
      // Create new config
      const result = await query(
        `INSERT INTO cricket_match_config 
           (match_id, total_overs, max_overs_per_bowler, toss_winner_team_id, 
            toss_decision, elected_to_bat_first_team_id, config_completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          id,
          totalOvers,
          maxOversPerBowler,
          tossWinnerTeamId || null,
          tossDecision || null,
          electedToBatFirstTeamId || null,
          // config_completed is true ONLY when toss data is provided (toss completed)
          // During match creation: tossWinnerTeamId and tossDecision are null → config_completed = false
          // After toss: tossWinnerTeamId and tossDecision have values → config_completed = true
          tossWinnerTeamId && tossDecision ? true : false,
        ]
      )

      // query() returns an array directly
      if (!result || !Array.isArray(result) || result.length === 0) {
        return NextResponse.json(
          { error: "Failed to create configuration" },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ config: result[0] }, { status: 201 })
    }
  } catch (error) {
    console.error("Error saving cricket config:", error)
    return NextResponse.json(
      { error: "Failed to save cricket configuration" },
      { status: 500 }
    )
  }
}

