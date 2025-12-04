import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAdmin } from "@/lib/authorization"

// GET futsal match configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await query(
      `SELECT 
        fmc.*,
        tw.name as toss_winner_team_name
       FROM futsal_match_config fmc
       LEFT JOIN teams tw ON fmc.toss_winner_team_id = tw.id
       WHERE fmc.match_id = $1`,
      [id]
    )

    // query() returns an array directly (result.rows from pg)
    if (!result || !Array.isArray(result) || result.length === 0) {
      return NextResponse.json({ config: null }, { status: 200 })
    }

    const config = result[0]
    return NextResponse.json({
      config: {
        id: config.id,
        matchId: config.match_id,
        tossWinnerTeamId: config.toss_winner_team_id,
        tossDecision: config.toss_decision,
        selectedSide: config.selected_side,
        kickingOffTeam: config.kicking_off_team,
        configCompleted: config.config_completed,
        tossWinnerTeamName: config.toss_winner_team_name,
      },
    }, { status: 200 })
  } catch (error) {
    console.error("Error fetching futsal config:", error)
    return NextResponse.json(
      { error: "Failed to fetch futsal configuration" },
      { status: 500 }
    )
  }
}

// POST/PUT futsal match configuration (toss and match settings)
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
      tossWinnerTeamId,
      tossDecision,
      selectedSide,
      kickingOffTeam,
      configCompleted,
    } = body

    // Check if config already exists
    const existingConfigResult = await query(
      `SELECT id, config_completed FROM futsal_match_config WHERE match_id = $1`,
      [id]
    )
    
    // query() returns an array directly
    const hasExistingConfig = existingConfigResult && Array.isArray(existingConfigResult) && existingConfigResult.length > 0

    if (hasExistingConfig) {
      // Update existing config
      const updateResult = await query(
        `UPDATE futsal_match_config 
         SET 
           toss_winner_team_id = $1,
           toss_decision = $2,
           selected_side = $3,
           kicking_off_team = $4,
           config_completed = $5,
           updated_at = CURRENT_TIMESTAMP
         WHERE match_id = $6
         RETURNING *`,
        [
          tossWinnerTeamId || null,
          tossDecision || null,
          selectedSide || null,
          kickingOffTeam || null,
          configCompleted !== undefined ? configCompleted : (tossWinnerTeamId && tossDecision ? true : false),
          id,
        ]
      )
      
      // query() returns an array directly
      if (!updateResult || !Array.isArray(updateResult) || updateResult.length === 0) {
        return NextResponse.json(
          { error: "Failed to update configuration" },
          { status: 500 }
        )
      }

      return NextResponse.json({ config: updateResult[0] }, { status: 200 })
    } else {
      // Create new config
      const insertResult = await query(
        `INSERT INTO futsal_match_config 
           (match_id, toss_winner_team_id, toss_decision, 
            selected_side, kicking_off_team, config_completed)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          id,
          tossWinnerTeamId || null,
          tossDecision || null,
          selectedSide || null,
          kickingOffTeam || null,
          configCompleted !== undefined ? configCompleted : (tossWinnerTeamId && tossDecision ? true : false),
        ]
      )
      
      // query() returns an array directly
      if (!insertResult || !Array.isArray(insertResult) || insertResult.length === 0) {
        return NextResponse.json(
          { error: "Failed to create configuration" },
          { status: 500 }
        )
      }

      return NextResponse.json({ config: insertResult[0] }, { status: 201 })
    }
  } catch (error) {
    console.error("Error saving futsal config:", error)
    return NextResponse.json(
      { error: "Failed to save futsal configuration" },
      { status: 500 }
    )
  }
}

