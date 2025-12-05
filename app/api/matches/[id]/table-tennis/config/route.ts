import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAdmin } from "@/lib/authorization"

// GET table tennis match configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await query(
      `SELECT 
        ttmc.*,
        tw.name as toss_winner_team_name
       FROM table_tennis_match_config ttmc
       LEFT JOIN teams tw ON ttmc.toss_winner_team_id = tw.id
       WHERE ttmc.match_id = $1`,
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
        setsToWin: config.sets_to_win,
        pointsToWinPerSet: config.points_to_win_per_set,
        tossWinnerTeamId: config.toss_winner_team_id,
        tossDecision: config.toss_decision,
        selectedTableSide: config.selected_table_side,
        servingTeam: config.serving_team,
        configCompleted: config.config_completed,
        tossWinnerTeamName: config.toss_winner_team_name,
      },
    }, { status: 200 })
  } catch (error) {
    console.error("Error fetching table tennis config:", error)
    return NextResponse.json(
      { error: "Failed to fetch table tennis configuration" },
      { status: 500 }
    )
  }
}

// POST/PUT table tennis match configuration (toss and match settings)
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
      setsToWin,
      pointsToWinPerSet,
      setTypes, // Pre-configured set types array
      tossWinnerTeamId,
      tossDecision,
      selectedTableSide,
      servingTeam,
      configCompleted,
    } = body

    // Check if config already exists
    const existingConfigResult = await query(
      `SELECT id, config_completed FROM table_tennis_match_config WHERE match_id = $1`,
      [id]
    )
    
    // query() returns an array directly
    const hasExistingConfig = existingConfigResult && Array.isArray(existingConfigResult) && existingConfigResult.length > 0

    if (hasExistingConfig) {
      // Update existing config
      const updateResult = await query(
        `UPDATE table_tennis_match_config 
         SET 
           sets_to_win = COALESCE($1, sets_to_win),
           points_to_win_per_set = COALESCE($2, points_to_win_per_set),
           toss_winner_team_id = $3,
           toss_decision = $4,
           selected_table_side = $5,
           serving_team = $6,
           config_completed = $7,
           updated_at = CURRENT_TIMESTAMP
         WHERE match_id = $8
         RETURNING *`,
        [
          setsToWin || null,
          pointsToWinPerSet || null,
          tossWinnerTeamId || null,
          tossDecision || null,
          selectedTableSide || null,
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

      // Update match score with serving team and pre-configured set types
      const matchResult = await query("SELECT score FROM matches WHERE id = $1", [id])
      
      if (matchResult && Array.isArray(matchResult) && matchResult.length > 0) {
        const match = matchResult[0]
        let score = match.score ? (typeof match.score === 'string' ? JSON.parse(match.score) : match.score) : {}
        
        // Store pre-configured set types if provided
        if (setTypes && Array.isArray(setTypes)) {
          if (!score.sets || !Array.isArray(score.sets)) {
            const totalSets = setsToWin === 2 ? 3 : setsToWin === 3 ? 5 : 7
            score.sets = Array.from({ length: totalSets }, () => ({ home: 0, away: 0, type: "singles" }))
          }
          // Update set types from pre-configured values
          setTypes.forEach((setType: "singles" | "doubles", index: number) => {
            if (score.sets[index]) {
              score.sets[index].type = setType
            }
          })
        }
        
        if (configCompleted && servingTeam) {
          score.servingTeam = servingTeam
          score.lastServingTeam = servingTeam
        }
        
        await query(
          "UPDATE matches SET score = $1 WHERE id = $2",
          [JSON.stringify(score), id]
        )
      }

      return NextResponse.json({ config: updateResult[0] }, { status: 200 })
    } else {
      // Create new config
      const insertResult = await query(
        `INSERT INTO table_tennis_match_config 
           (match_id, sets_to_win, points_to_win_per_set, toss_winner_team_id, toss_decision, 
            selected_table_side, serving_team, config_completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          id,
          setsToWin || 2,
          pointsToWinPerSet || 11,
          tossWinnerTeamId || null,
          tossDecision || null,
          selectedTableSide || null,
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

      // Update match score with serving team and pre-configured set types
      const matchResult = await query("SELECT score FROM matches WHERE id = $1", [id])
      
      if (matchResult && Array.isArray(matchResult) && matchResult.length > 0) {
        const match = matchResult[0]
        let score = match.score ? (typeof match.score === 'string' ? JSON.parse(match.score) : match.score) : {}
        
        // Store pre-configured set types if provided
        if (setTypes && Array.isArray(setTypes)) {
          if (!score.sets || !Array.isArray(score.sets)) {
            const totalSets = setsToWin === 2 ? 3 : setsToWin === 3 ? 5 : 7
            score.sets = Array.from({ length: totalSets }, () => ({ home: 0, away: 0, type: "singles" }))
          }
          // Update set types from pre-configured values
          setTypes.forEach((setType: "singles" | "doubles", index: number) => {
            if (score.sets[index]) {
              score.sets[index].type = setType
            }
          })
        }
        
        if (configCompleted && servingTeam) {
          score.servingTeam = servingTeam
          score.lastServingTeam = servingTeam
        }
        
        await query(
          "UPDATE matches SET score = $1 WHERE id = $2",
          [JSON.stringify(score), id]
        )
      }

      return NextResponse.json({ config: insertResult[0] }, { status: 201 })
    }
  } catch (error) {
    console.error("Error saving table tennis config:", error)
    return NextResponse.json(
      { error: "Failed to save table tennis configuration" },
      { status: 500 }
    )
  }
}

