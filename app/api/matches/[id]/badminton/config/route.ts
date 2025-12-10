import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAdmin } from "@/lib/authorization"

// Helper function to update match score
async function updateMatchScore(
  matchId: string,
  matches: any,
  servingTeam: string,
  pointsToWinPerGame: number,
  gamesToWin: number,
  gameTypes: any,
  configCompleted: boolean
) {
  const matchResult = await query("SELECT score FROM matches WHERE id = $1", [matchId])
  
  if (matchResult && Array.isArray(matchResult) && matchResult.length > 0) {
    const matchData = matchResult[0]
    let score: any
    
    // Initialize new team-based match structure
    if (matches && Array.isArray(matches)) {
      score = {
        matches: matches.map((m: any) => ({
          matchNumber: m.matchNumber,
          type: m.type,
          homePlayerIds: m.homePlayerIds,
          awayPlayerIds: m.awayPlayerIds,
          sets: [
            { home: 0, away: 0 },
            { home: 0, away: 0 },
            { home: 0, away: 0 },
          ],
          winner: null,
        })),
        currentMatch: 0,
        matchWins: { home: 0, away: 0 },
        tieWinner: null,
        servingTeam: servingTeam || "home",
        pointsToWin: pointsToWinPerGame || 21,
      }
    } else {
      // Fallback for old structure
      score = matchData.score ? (typeof matchData.score === 'string' ? JSON.parse(matchData.score) : matchData.score) : {}
      
      if (gameTypes && Array.isArray(gameTypes)) {
        if (!score.games || !Array.isArray(score.games)) {
          const totalGames = gamesToWin === 2 ? 3 : 5
          score.games = Array.from({ length: totalGames }, () => ({ home: 0, away: 0, type: "singles" }))
        }
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
    }
    
    await query(
      "UPDATE matches SET score = $1 WHERE id = $2",
      [JSON.stringify(score), matchId]
    )
  }
}

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
    
    // Parse JSON fields if they're strings
    let matchTypes = config.match_types
    if (typeof matchTypes === 'string') {
      try {
        matchTypes = JSON.parse(matchTypes)
      } catch (e) {
        matchTypes = null
      }
    }
    
    return NextResponse.json({
      config: {
        id: config.id,
        matchId: config.match_id,
        numberOfMatches: config.number_of_matches || config.games_to_win || 3,
        setsPerMatch: config.sets_per_match || config.games_to_win || 2,
        pointsToWinPerSet: config.points_to_win_per_game,
        matchTypes: matchTypes || null,
        tossWinnerTeamId: config.toss_winner_team_id,
        tossDecision: config.toss_decision,
        selectedCourtSide: config.selected_court_side,
        servingTeam: config.serving_team,
        configCompleted: config.config_completed,
        tossWinnerTeamName: config.toss_winner_team_name,
        // Legacy fields for backwards compatibility
        gamesToWin: config.games_to_win,
        pointsToWinPerGame: config.points_to_win_per_game,
        gameTypes: matchTypes,
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
      numberOfMatches,
      setsPerMatch,
      pointsToWinPerSet,
      matchTypes, // Pre-configured match types array
      tossWinnerTeamId,
      tossDecision,
      selectedCourtSide,
      servingTeam,
      configCompleted,
      matches, // Match assignments with player IDs
      // Legacy support
      gamesToWin,
      pointsToWinPerGame,
      gameTypes,
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
           number_of_matches = COALESCE($3, number_of_matches),
           sets_per_match = COALESCE($4, sets_per_match),
           match_types = COALESCE($5, match_types),
           toss_winner_team_id = $6,
           toss_decision = $7,
           selected_court_side = $8,
           serving_team = $9,
           config_completed = $10,
           updated_at = CURRENT_TIMESTAMP
         WHERE match_id = $11
         RETURNING *`,
        [
          gamesToWin || setsPerMatch || null,
          pointsToWinPerSet || pointsToWinPerGame || null,
          numberOfMatches || null,
          setsPerMatch || gamesToWin || null,
          matchTypes ? JSON.stringify(matchTypes) : (gameTypes ? JSON.stringify(gameTypes) : null),
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

      // Update match score with new structure
      await updateMatchScore(id, matches, servingTeam, pointsToWinPerGame, gamesToWin, gameTypes, configCompleted)

      return NextResponse.json({ config: updateResult[0] }, { status: 200 })
    } else {
      // Create new config
      const insertResult = await query(
        `INSERT INTO badminton_match_config 
           (match_id, games_to_win, points_to_win_per_game, number_of_matches, sets_per_match, match_types,
            toss_winner_team_id, toss_decision, selected_court_side, serving_team, config_completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (match_id) DO UPDATE SET
           games_to_win = COALESCE(EXCLUDED.games_to_win, badminton_match_config.games_to_win),
           points_to_win_per_game = COALESCE(EXCLUDED.points_to_win_per_game, badminton_match_config.points_to_win_per_game),
           number_of_matches = COALESCE(EXCLUDED.number_of_matches, badminton_match_config.number_of_matches),
           sets_per_match = COALESCE(EXCLUDED.sets_per_match, badminton_match_config.sets_per_match),
           match_types = COALESCE(EXCLUDED.match_types, badminton_match_config.match_types),
           toss_winner_team_id = EXCLUDED.toss_winner_team_id,
           toss_decision = EXCLUDED.toss_decision,
           selected_court_side = EXCLUDED.selected_court_side,
           serving_team = EXCLUDED.serving_team,
           config_completed = EXCLUDED.config_completed,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [
          id,
          gamesToWin || setsPerMatch || 2,
          pointsToWinPerSet || pointsToWinPerGame || 21,
          numberOfMatches || 3,
          setsPerMatch || gamesToWin || 2,
          matchTypes ? JSON.stringify(matchTypes) : (gameTypes ? JSON.stringify(gameTypes) : null),
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

      // Update match score with new structure
      await updateMatchScore(id, matches, servingTeam, pointsToWinPerGame, gamesToWin, gameTypes, configCompleted)

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

