import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAdmin } from "@/lib/authorization"

// GET badminton match configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await query(
      `SELECT 
        bmc.*,
        tw.name as toss_winner_team_name
       FROM badminton_match_config bmc
       LEFT JOIN teams tw ON bmc.toss_winner_team_id = tw.id
       WHERE bmc.match_id = $1`,
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
        gamesToWin: config.games_to_win,
        pointsToWinPerGame: config.points_to_win_per_game,
        tossWinnerTeamId: config.toss_winner_team_id,
        tossDecision: config.toss_decision,
        selectedCourtSide: config.selected_court_side,
        servingTeam: config.serving_team,
        configCompleted: config.config_completed,
        tossWinnerTeamName: config.toss_winner_team_name,
      },
    }, { status: 200 })
  } catch (error) {
    console.error("Error fetching badminton config:", error)
    return NextResponse.json(
      { error: "Failed to fetch badminton configuration" },
      { status: 500 }
    )
  }
}

// POST/PUT badminton match configuration (toss and match settings)
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
      gamesToWin,
      pointsToWinPerGame,
      gameTypes, // Pre-configured game types array
      tossWinnerTeamId,
      tossDecision,
      selectedCourtSide,
      servingTeam,
      configCompleted,
    } = body

    // Check if config already exists
    const existingConfigResult = await query(
      `SELECT id, config_completed FROM badminton_match_config WHERE match_id = $1`,
      [id]
    )
    
    // query() returns an array directly
    const hasExistingConfig = existingConfigResult && Array.isArray(existingConfigResult) && existingConfigResult.length > 0

    if (hasExistingConfig) {
      // Update existing config
      const updateResult = await query(
        `UPDATE badminton_match_config 
         SET 
           games_to_win = COALESCE($1, games_to_win),
           points_to_win_per_game = COALESCE($2, points_to_win_per_game),
           toss_winner_team_id = $3,
           toss_decision = $4,
           selected_court_side = $5,
           serving_team = $6,
           config_completed = $7,
           updated_at = CURRENT_TIMESTAMP
         WHERE match_id = $8
         RETURNING *`,
        [
          gamesToWin || null,
          pointsToWinPerGame || null,
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

      // Update match score with serving team and pre-configured game types
      const matchResult = await query("SELECT score FROM matches WHERE id = $1", [id])
      
      if (matchResult && Array.isArray(matchResult) && matchResult.length > 0) {
        const match = matchResult[0]
        let score = match.score ? (typeof match.score === 'string' ? JSON.parse(match.score) : match.score) : {}
        
        // Store pre-configured game types if provided
        if (gameTypes && Array.isArray(gameTypes)) {
          if (!score.games || !Array.isArray(score.games)) {
            const totalGames = gamesToWin === 2 ? 3 : 5
            score.games = Array.from({ length: totalGames }, () => ({ home: 0, away: 0, type: "singles" }))
          }
          // Update game types from pre-configured values
          gameTypes.forEach((gameType: "singles" | "doubles", index: number) => {
            if (score.games[index]) {
              score.games[index].type = gameType
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
        `INSERT INTO badminton_match_config 
           (match_id, games_to_win, points_to_win_per_game, toss_winner_team_id, toss_decision, 
            selected_court_side, serving_team, config_completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          id,
          gamesToWin || 2,
          pointsToWinPerGame || 21,
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

      // Update match score with serving team and pre-configured game types
      const matchResult = await query("SELECT score FROM matches WHERE id = $1", [id])
      
      if (matchResult && Array.isArray(matchResult) && matchResult.length > 0) {
        const match = matchResult[0]
        let score = match.score ? (typeof match.score === 'string' ? JSON.parse(match.score) : match.score) : {}
        
        // Store pre-configured game types if provided
        if (gameTypes && Array.isArray(gameTypes)) {
          if (!score.games || !Array.isArray(score.games)) {
            const totalGames = gamesToWin === 2 ? 3 : 5
            score.games = Array.from({ length: totalGames }, () => ({ home: 0, away: 0, type: "singles" }))
          }
          // Update game types from pre-configured values
          gameTypes.forEach((gameType: "singles" | "doubles", index: number) => {
            if (score.games[index]) {
              score.games[index].type = gameType
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
    console.error("Error saving badminton config:", error)
    return NextResponse.json(
      { error: "Failed to save badminton configuration" },
      { status: 500 }
    )
  }
}

