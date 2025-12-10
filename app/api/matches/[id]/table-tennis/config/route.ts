import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAdmin } from "@/lib/authorization"

// Helper function to update match score
async function updateMatchScore(
  matchId: string,
  matches: any,
  servingTeam: string,
  pointsToWinPerSet: number,
  setsToWin: number,
  setTypes: any,
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
        pointsToWin: pointsToWinPerSet || 11,
      }
    } else {
      // Fallback for old structure
      score = matchData.score ? (typeof matchData.score === 'string' ? JSON.parse(matchData.score) : matchData.score) : {}
      
      if (setTypes && Array.isArray(setTypes)) {
        if (!score.sets || !Array.isArray(score.sets)) {
          const totalSets = setsToWin === 2 ? 3 : setsToWin === 3 ? 5 : 7
          score.sets = Array.from({ length: totalSets }, () => ({ home: 0, away: 0, type: "singles" }))
        }
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
    }
    
    await query(
      "UPDATE matches SET score = $1 WHERE id = $2",
      [JSON.stringify(score), matchId]
    )
  }
}

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
        numberOfMatches: config.number_of_matches || config.sets_to_win || 3,
        setsPerMatch: config.sets_per_match || config.sets_to_win || 2,
        pointsToWinPerSet: config.points_to_win_per_set,
        matchTypes: matchTypes || null,
        tossWinnerTeamId: config.toss_winner_team_id,
        tossDecision: config.toss_decision,
        selectedTableSide: config.selected_table_side,
        servingTeam: config.serving_team,
        configCompleted: config.config_completed,
        tossWinnerTeamName: config.toss_winner_team_name,
        // Legacy fields for backwards compatibility
        setsToWin: config.sets_to_win,
        setTypes: matchTypes,
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
      numberOfMatches,
      setsPerMatch,
      pointsToWinPerSet,
      matchTypes, // Pre-configured match types array
      tossWinnerTeamId,
      tossDecision,
      selectedTableSide,
      servingTeam,
      configCompleted,
      matches, // Match assignments with player IDs
      // Legacy support
      setsToWin,
      setTypes,
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
           number_of_matches = COALESCE($3, number_of_matches),
           sets_per_match = COALESCE($4, sets_per_match),
           match_types = COALESCE($5, match_types),
           toss_winner_team_id = $6,
           toss_decision = $7,
           selected_table_side = $8,
           serving_team = $9,
           config_completed = $10,
           updated_at = CURRENT_TIMESTAMP
         WHERE match_id = $11
         RETURNING *`,
        [
          setsToWin || setsPerMatch || null,
          pointsToWinPerSet || null,
          numberOfMatches || null,
          setsPerMatch || setsToWin || null,
          matchTypes ? JSON.stringify(matchTypes) : (setTypes ? JSON.stringify(setTypes) : null),
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

      // Update match score with new structure
      await updateMatchScore(id, matches, servingTeam, pointsToWinPerSet, setsToWin, setTypes, configCompleted)

      return NextResponse.json({ config: updateResult[0] }, { status: 200 })
    } else {
      // Create new config
      const insertResult = await query(
        `INSERT INTO table_tennis_match_config 
           (match_id, sets_to_win, points_to_win_per_set, number_of_matches, sets_per_match, match_types, 
            toss_winner_team_id, toss_decision, selected_table_side, serving_team, config_completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (match_id) DO UPDATE SET
           sets_to_win = COALESCE(EXCLUDED.sets_to_win, table_tennis_match_config.sets_to_win),
           points_to_win_per_set = COALESCE(EXCLUDED.points_to_win_per_set, table_tennis_match_config.points_to_win_per_set),
           number_of_matches = COALESCE(EXCLUDED.number_of_matches, table_tennis_match_config.number_of_matches),
           sets_per_match = COALESCE(EXCLUDED.sets_per_match, table_tennis_match_config.sets_per_match),
           match_types = COALESCE(EXCLUDED.match_types, table_tennis_match_config.match_types),
           toss_winner_team_id = EXCLUDED.toss_winner_team_id,
           toss_decision = EXCLUDED.toss_decision,
           selected_table_side = EXCLUDED.selected_table_side,
           serving_team = EXCLUDED.serving_team,
           config_completed = EXCLUDED.config_completed,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [
          id,
          setsToWin || setsPerMatch || 2,
          pointsToWinPerSet || 11,
          numberOfMatches || 3,
          setsPerMatch || setsToWin || 2,
          matchTypes ? JSON.stringify(matchTypes) : (setTypes ? JSON.stringify(setTypes) : null),
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

      // Update match score with new structure
      await updateMatchScore(id, matches, servingTeam, pointsToWinPerSet, setsToWin, setTypes, configCompleted)

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

