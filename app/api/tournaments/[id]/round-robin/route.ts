import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { createMatch, createGroupMatch } from "@/lib/server-data"
import { generateRoundRobinFixtures, initializeAllGroupStandings } from "@/lib/tournament-fixtures"
import { requireAdmin } from "@/lib/authorization"

// Generate round robin fixtures for a group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck) {
    return adminCheck
  }

  try {
    const { id: tournamentId } = await params
    const body = await request.json()
    const { groupId, sport, venue, startDate, cricketConfig, volleyballConfig, badmintonConfig, tableTennisConfig } = body
    
    if (!groupId || !sport || !venue || !startDate) {
      return NextResponse.json(
        { error: "Missing required fields: groupId, sport, venue, startDate" },
        { status: 400 }
      )
    }
    
    // Validate cricket configuration
    if (sport === "cricket") {
      if (!cricketConfig || !cricketConfig.totalOvers || !cricketConfig.maxOversPerBowler) {
        return NextResponse.json(
          { error: "Cricket match configuration is required" },
          { status: 400 }
        )
      }
      if (cricketConfig.maxOversPerBowler > cricketConfig.totalOvers) {
        return NextResponse.json(
          { error: "Max overs per bowler cannot exceed total overs" },
          { status: 400 }
        )
      }
    }
    
    // Validate volleyball configuration
    if (sport === "volleyball") {
      if (!volleyballConfig || !volleyballConfig.numberOfSets) {
        return NextResponse.json(
          { error: "Volleyball match configuration is required" },
          { status: 400 }
        )
      }
      if (![3, 5].includes(volleyballConfig.numberOfSets)) {
        return NextResponse.json(
          { error: "Number of sets must be 3 or 5" },
          { status: 400 }
        )
      }
    }
    
    // Validate badminton configuration
    if (sport === "badminton") {
      if (!badmintonConfig || !badmintonConfig.gamesToWin || !badmintonConfig.pointsToWinPerGame) {
        return NextResponse.json(
          { error: "Badminton match configuration is required" },
          { status: 400 }
        )
      }
      if (![2, 3].includes(badmintonConfig.gamesToWin)) {
        return NextResponse.json(
          { error: "Games to win must be 2 or 3" },
          { status: 400 }
        )
      }
      if (![11, 15, 21].includes(badmintonConfig.pointsToWinPerGame)) {
        return NextResponse.json(
          { error: "Points to win per game must be 11, 15, or 21" },
          { status: 400 }
        )
      }
    }
    
    // Validate table tennis configuration
    if (sport === "table-tennis") {
      if (!tableTennisConfig || !tableTennisConfig.setsToWin || !tableTennisConfig.pointsToWinPerSet) {
        return NextResponse.json(
          { error: "Table tennis match configuration is required" },
          { status: 400 }
        )
      }
      if (![2, 3, 4].includes(tableTennisConfig.setsToWin)) {
        return NextResponse.json(
          { error: "Sets to win must be 2, 3, or 4" },
          { status: 400 }
        )
      }
      if (![11, 21].includes(tableTennisConfig.pointsToWinPerSet)) {
        return NextResponse.json(
          { error: "Points to win per set must be 11 or 21" },
          { status: 400 }
        )
      }
    }
    
    // Get all teams in the group
    const teams = await query(
      `SELECT team_id FROM group_teams WHERE group_id = $1 ORDER BY display_order`,
      [groupId]
    )
    
    if (teams.length < 2) {
      return NextResponse.json(
        { error: "Group must have at least 2 teams for round robin" },
        { status: 400 }
      )
    }
    
    const teamIds = teams.map((t: any) => t.team_id)
    
    // Generate all possible fixtures
    const fixtures = generateRoundRobinFixtures(teamIds)
    
    // Get current max match number
    const countResult = await query(
      `SELECT COALESCE(MAX(match_number), 0) as max_number
       FROM group_matches
       WHERE group_id = $1`,
      [groupId]
    )
    let matchNumber = (countResult[0]?.max_number || 0) + 1
    
    const createdFixtures = []
    const baseDate = new Date(startDate)
    
    // Create fixtures with dates spread out (1 day apart by default)
    for (let i = 0; i < fixtures.length; i++) {
      const [team1Id, team2Id] = fixtures[i]
      const matchDate = new Date(baseDate)
      matchDate.setDate(matchDate.getDate() + i)
      
      // 1. Create in global matches table
      const match = await createMatch({
        sport,
        homeTeamId: team1Id,
        awayTeamId: team2Id,
        date: matchDate.toISOString(),
        venue,
        status: "scheduled"
      })
      
      // 2. Update match with tournament/group references
      await query(
        `UPDATE matches
         SET tournament_id = $1, group_id = $2
         WHERE id = $3`,
        [tournamentId, groupId, match.id]
      )
      
      // 3. Create in group_matches table
      const groupMatch = await createGroupMatch({
        groupId,
        team1Id,
        team2Id,
        matchDate: matchDate.toISOString(),
        status: "scheduled"
      })
      
      // 4. Link them and add match number
      await query(
        `UPDATE group_matches
         SET match_id = $1, match_number = $2
         WHERE id = $3`,
        [match.id, matchNumber, groupMatch.id]
      )
      
      // 5. Save cricket configuration if provided
      if (sport === "cricket" && cricketConfig) {
        try {
          await query(
            `INSERT INTO cricket_match_config 
             (match_id, total_overs, max_overs_per_bowler, config_completed)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (match_id) DO UPDATE SET
               total_overs = EXCLUDED.total_overs,
               max_overs_per_bowler = EXCLUDED.max_overs_per_bowler,
               updated_at = CURRENT_TIMESTAMP`,
            [
              match.id,
              cricketConfig.totalOvers,
              cricketConfig.maxOversPerBowler,
              false // config_completed will be true after toss
            ]
          )
        } catch (error) {
          console.error("Error saving cricket config:", error)
          // Don't fail the fixture creation if config save fails
        }
      }
      
      // 6. Save volleyball configuration if provided
      if (sport === "volleyball" && volleyballConfig) {
        try {
          await query(
            `INSERT INTO volleyball_match_config 
             (match_id, number_of_sets, config_completed)
             VALUES ($1, $2, $3)
             ON CONFLICT (match_id) DO UPDATE SET
               number_of_sets = EXCLUDED.number_of_sets,
               updated_at = CURRENT_TIMESTAMP`,
            [
              match.id,
              volleyballConfig.numberOfSets,
              false // config_completed will be true after toss
            ]
          )
        } catch (error) {
          console.error("Error saving volleyball config:", error)
          // Don't fail the fixture creation if config save fails
        }
      }
      
      // 7. Save badminton configuration if provided
      if (sport === "badminton" && badmintonConfig) {
        try {
          // Use new schema if available, fallback to legacy
          const numberOfMatches = badmintonConfig.numberOfMatches || 3
          const setsPerMatch = badmintonConfig.setsPerMatch || badmintonConfig.gamesToWin || 2
          const pointsToWinPerSet = badmintonConfig.pointsToWinPerSet || badmintonConfig.pointsToWinPerGame || 21
          const matchTypes = badmintonConfig.matchTypes || null
          
          await query(
            `INSERT INTO badminton_match_config 
             (match_id, games_to_win, points_to_win_per_game, number_of_matches, sets_per_match, match_types, config_completed)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (match_id) DO UPDATE SET
               games_to_win = COALESCE(EXCLUDED.games_to_win, badminton_match_config.games_to_win),
               points_to_win_per_game = COALESCE(EXCLUDED.points_to_win_per_game, badminton_match_config.points_to_win_per_game),
               number_of_matches = COALESCE(EXCLUDED.number_of_matches, badminton_match_config.number_of_matches),
               sets_per_match = COALESCE(EXCLUDED.sets_per_match, badminton_match_config.sets_per_match),
               match_types = COALESCE(EXCLUDED.match_types, badminton_match_config.match_types),
               updated_at = CURRENT_TIMESTAMP`,
            [
              match.id,
              setsPerMatch, // games_to_win for legacy compatibility
              pointsToWinPerSet, // points_to_win_per_game for legacy compatibility
              numberOfMatches,
              setsPerMatch,
              matchTypes ? JSON.stringify(matchTypes) : null,
              false // config_completed will be true after toss
            ]
          )
        } catch (error) {
          console.error("Error saving badminton config:", error)
          // Don't fail the fixture creation if config save fails
        }
      }
      
      // 8. Save table tennis configuration if provided
      if (sport === "table-tennis" && tableTennisConfig) {
        try {
          // Use new schema if available, fallback to legacy
          const numberOfMatches = tableTennisConfig.numberOfMatches || 3
          const setsPerMatch = tableTennisConfig.setsPerMatch || tableTennisConfig.setsToWin || 2
          const pointsToWinPerSet = tableTennisConfig.pointsToWinPerSet || 11
          const matchTypes = tableTennisConfig.matchTypes || null
          
          await query(
            `INSERT INTO table_tennis_match_config 
             (match_id, sets_to_win, points_to_win_per_set, number_of_matches, sets_per_match, match_types, config_completed)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (match_id) DO UPDATE SET
               sets_to_win = COALESCE(EXCLUDED.sets_to_win, table_tennis_match_config.sets_to_win),
               points_to_win_per_set = COALESCE(EXCLUDED.points_to_win_per_set, table_tennis_match_config.points_to_win_per_set),
               number_of_matches = COALESCE(EXCLUDED.number_of_matches, table_tennis_match_config.number_of_matches),
               sets_per_match = COALESCE(EXCLUDED.sets_per_match, table_tennis_match_config.sets_per_match),
               match_types = COALESCE(EXCLUDED.match_types, table_tennis_match_config.match_types),
               updated_at = CURRENT_TIMESTAMP`,
            [
              match.id,
              setsPerMatch, // sets_to_win for legacy compatibility
              pointsToWinPerSet,
              numberOfMatches,
              setsPerMatch,
              matchTypes ? JSON.stringify(matchTypes) : null,
              false // config_completed will be true after toss
            ]
          )
        } catch (error) {
          console.error("Error saving table tennis config:", error)
          // Don't fail the fixture creation if config save fails
        }
      }
      
      createdFixtures.push({
        ...groupMatch,
        matchId: match.id,
        matchNumber
      })
      
      matchNumber++
    }
    
    // Initialize group standings
    try {
      await initializeAllGroupStandings(groupId)
    } catch (error) {
      console.log("Standings already initialized or error:", error)
    }
    
    return NextResponse.json({
      success: true,
      count: createdFixtures.length,
      fixtures: createdFixtures
    }, { status: 201 })
  } catch (error) {
    console.error("Error generating round robin:", error)
    return NextResponse.json(
      { error: "Failed to generate round robin fixtures" },
      { status: 500 }
    )
  }
}

