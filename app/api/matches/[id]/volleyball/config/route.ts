import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAdmin } from "@/lib/authorization"

// GET volleyball match configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await query(
      `SELECT 
        vmc.*,
        tw.name as toss_winner_team_name
       FROM volleyball_match_config vmc
       LEFT JOIN teams tw ON vmc.toss_winner_team_id = tw.id
       WHERE vmc.match_id = $1`,
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
        numberOfSets: config.number_of_sets,
        tossWinnerTeamId: config.toss_winner_team_id,
        tossDecision: config.toss_decision,
        selectedCourtSide: config.selected_court_side,
        servingTeam: config.serving_team,
        configCompleted: config.config_completed,
        tossWinnerTeamName: config.toss_winner_team_name,
      },
    }, { status: 200 })
  } catch (error) {
    console.error("Error fetching volleyball config:", error)
    return NextResponse.json(
      { error: "Failed to fetch volleyball configuration" },
      { status: 500 }
    )
  }
}

// POST/PUT volleyball match configuration (toss and match settings)
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
      numberOfSets,
      tossWinnerTeamId,
      tossDecision,
      selectedCourtSide,
      servingTeam,
      configCompleted,
    } = body

    // Validate required fields
    if (!numberOfSets) {
      return NextResponse.json(
        { error: "Number of sets is required" },
        { status: 400 }
      )
    }

    // Check if config already exists
    const existingConfigResult = await query(
      `SELECT id, config_completed FROM volleyball_match_config WHERE match_id = $1`,
      [id]
    )
    
    // query() returns an array directly
    const hasExistingConfig = existingConfigResult && Array.isArray(existingConfigResult) && existingConfigResult.length > 0

    if (hasExistingConfig) {
      // Update existing config
      const updateResult = await query(
        `UPDATE volleyball_match_config 
         SET 
           number_of_sets = $1,
           toss_winner_team_id = $2,
           toss_decision = $3,
           selected_court_side = $4,
           serving_team = $5,
           config_completed = $6,
           updated_at = CURRENT_TIMESTAMP
         WHERE match_id = $7
         RETURNING *`,
        [
          numberOfSets,
          tossWinnerTeamId || null,
          tossDecision || null,
          selectedCourtSide || null,
          servingTeam || null,
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

      // If configuration is completed, update the match score with serving team
      if (configCompleted && servingTeam) {
        const matchResult = await query("SELECT score FROM matches WHERE id = $1", [id])
        
        if (matchResult && Array.isArray(matchResult) && matchResult.length > 0) {
          const match = matchResult[0]
          let score = match.score ? (typeof match.score === 'string' ? JSON.parse(match.score) : match.score) : {}
          score.servingTeam = servingTeam
          score.lastServingTeam = servingTeam
          score.numberOfSets = numberOfSets
          
          await query(
            "UPDATE matches SET score = $1 WHERE id = $2",
            [JSON.stringify(score), id]
          )
        }
      }

      return NextResponse.json({ config: updateResult[0] }, { status: 200 })
    } else {
      // Create new config
      const insertResult = await query(
        `INSERT INTO volleyball_match_config 
           (match_id, number_of_sets, toss_winner_team_id, toss_decision, 
            selected_court_side, serving_team, config_completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          id,
          numberOfSets,
          tossWinnerTeamId || null,
          tossDecision || null,
          selectedCourtSide || null,
          servingTeam || null,
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

      // If configuration is completed, update the match score with serving team
      if (configCompleted && servingTeam) {
        const matchResult = await query("SELECT score FROM matches WHERE id = $1", [id])
        
        if (matchResult && Array.isArray(matchResult) && matchResult.length > 0) {
          const match = matchResult[0]
          let score = match.score ? (typeof match.score === 'string' ? JSON.parse(match.score) : match.score) : {}
          score.servingTeam = servingTeam
          score.lastServingTeam = servingTeam
          score.numberOfSets = numberOfSets
          
          await query(
            "UPDATE matches SET score = $1 WHERE id = $2",
            [JSON.stringify(score), id]
          )
        }
      }

      return NextResponse.json({ config: insertResult[0] }, { status: 201 })
    }
  } catch (error) {
    console.error("Error saving volleyball config:", error)
    return NextResponse.json(
      { error: "Failed to save volleyball configuration" },
      { status: 500 }
    )
  }
}

