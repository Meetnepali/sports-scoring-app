// Tournament fixtures and points table management
import { query } from "./database"
import type { GroupStanding, GroupMatch } from "./static-data"

/**
 * Initialize standings for a team in a group
 */
export async function initializeGroupStanding(groupId: string, teamId: string): Promise<void> {
  try {
    await query(
      `INSERT INTO group_standings (group_id, team_id)
       VALUES ($1, $2)
       ON CONFLICT (group_id, team_id) DO NOTHING`,
      [groupId, teamId]
    )
  } catch (error) {
    console.error("Error initializing group standing:", error)
    throw new Error("Failed to initialize group standing")
  }
}

/**
 * Initialize standings for all teams in a group
 */
export async function initializeAllGroupStandings(groupId: string): Promise<void> {
  try {
    await query(
      `INSERT INTO group_standings (group_id, team_id)
       SELECT $1, team_id
       FROM group_teams
       WHERE group_id = $1
       ON CONFLICT (group_id, team_id) DO NOTHING`,
      [groupId]
    )
  } catch (error) {
    console.error("Error initializing all group standings:", error)
    throw new Error("Failed to initialize group standings")
  }
}

/**
 * Calculate points based on sport and result
 */
export function calculatePoints(isWin: boolean, isDraw: boolean, sport: string): number {
  if (isDraw) {
    if (sport === "futsal") return 1
    if (sport === "chess") return 0.5
    return 1 // Default draw points
  }
  
  if (isWin) {
    if (sport === "futsal") return 3
    return 2 // Most sports: 2 points for win
  }
  
  return 0 // Loss
}

/**
 * Determine match winner based on score
 */
export function determineWinner(score: any, sport: string): 'team1' | 'team2' | 'draw' | null {
  if (!score) return null
  
  if (sport === "cricket") {
    const team1Runs = score.team1?.runs || 0
    const team2Runs = score.team2?.runs || 0
    
    if (team1Runs > team2Runs) return 'team1'
    if (team2Runs > team1Runs) return 'team2'
    return 'draw'
  }
  
  if (sport === "volleyball") {
    const team1Sets = score.team1?.sets || 0
    const team2Sets = score.team2?.sets || 0
    
    if (team1Sets > team2Sets) return 'team1'
    if (team2Sets > team1Sets) return 'team2'
    return null // Volleyball can't draw
  }
  
  // For other sports (futsal, chess, table-tennis, badminton)
  const team1Score = score.team1 || 0
  const team2Score = score.team2 || 0
  
  if (team1Score > team2Score) return 'team1'
  if (team2Score > team1Score) return 'team2'
  return 'draw'
}

/**
 * Extract score value for points for/against calculation
 */
export function extractScoreValue(score: any, team: 'team1' | 'team2', sport: string): number {
  if (!score) return 0
  
  if (sport === "cricket") {
    return score[team]?.runs || 0
  }
  
  if (sport === "volleyball") {
    return score[team]?.sets || 0
  }
  
  return score[team] || 0
}

/**
 * Update points table after match completion
 */
export async function updatePointsTableAfterMatch(
  matchId: string,
  groupId: string,
  team1Id: string,
  team2Id: string,
  score: any,
  sport: string
): Promise<void> {
  try {
    const winner = determineWinner(score, sport)
    
    if (!winner) {
      console.log("Match has no winner yet, skipping points table update")
      return
    }
    
    const team1Score = extractScoreValue(score, 'team1', sport)
    const team2Score = extractScoreValue(score, 'team2', sport)
    
    const team1IsWinner = winner === 'team1'
    const team2IsWinner = winner === 'team2'
    const isDraw = winner === 'draw'
    
    const team1Points = calculatePoints(team1IsWinner, isDraw, sport)
    const team2Points = calculatePoints(team2IsWinner, isDraw, sport)
    
    // Update team1 standing
    await query(
      `UPDATE group_standings
       SET matches_played = matches_played + 1,
           wins = wins + $1,
           losses = losses + $2,
           draws = draws + $3,
           points = points + $4,
           points_for = points_for + $5,
           points_against = points_against + $6,
           points_difference = (points_for + $5) - (points_against + $6),
           updated_at = CURRENT_TIMESTAMP
       WHERE group_id = $7 AND team_id = $8`,
      [
        team1IsWinner ? 1 : 0,
        team2IsWinner ? 1 : 0,
        isDraw ? 1 : 0,
        team1Points,
        team1Score,
        team2Score,
        groupId,
        team1Id
      ]
    )
    
    // Update team2 standing
    await query(
      `UPDATE group_standings
       SET matches_played = matches_played + 1,
           wins = wins + $1,
           losses = losses + $2,
           draws = draws + $3,
           points = points + $4,
           points_for = points_for + $5,
           points_against = points_against + $6,
           points_difference = (points_for + $5) - (points_against + $6),
           updated_at = CURRENT_TIMESTAMP
       WHERE group_id = $7 AND team_id = $8`,
      [
        team2IsWinner ? 1 : 0,
        team1IsWinner ? 1 : 0,
        isDraw ? 1 : 0,
        team2Points,
        team2Score,
        team1Score,
        groupId,
        team2Id
      ]
    )
    
    console.log(`Points table updated for match ${matchId}`)
  } catch (error) {
    console.error("Error updating points table:", error)
    throw new Error("Failed to update points table")
  }
}

/**
 * Get group standings (sorted by points, then points difference)
 */
export async function getGroupStandings(groupId: string): Promise<GroupStanding[]> {
  try {
    const standings = await query(
      `SELECT gs.*, 
              t.id as team_id,
              t.name as team_name,
              t.sport as team_sport,
              t.logo as team_logo
       FROM group_standings gs
       JOIN teams t ON gs.team_id = t.id
       WHERE gs.group_id = $1
       ORDER BY gs.points DESC, gs.points_difference DESC, gs.points_for DESC`,
      [groupId]
    )
    
    return standings.map((row: any) => ({
      id: row.id,
      groupId: row.group_id,
      teamId: row.team_id,
      matchesPlayed: row.matches_played,
      wins: row.wins,
      losses: row.losses,
      draws: row.draws,
      points: row.points,
      pointsFor: row.points_for,
      pointsAgainst: row.points_against,
      pointsDifference: row.points_difference,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      team: {
        id: row.team_id,
        name: row.team_name,
        sport: row.team_sport,
        logo: row.team_logo,
        players: []
      }
    }))
  } catch (error) {
    console.error("Error getting group standings:", error)
    throw new Error("Failed to get group standings")
  }
}

/**
 * Reset group standings (useful for tournament restart)
 */
export async function resetGroupStandings(groupId: string): Promise<void> {
  try {
    await query(
      `UPDATE group_standings
       SET matches_played = 0,
           wins = 0,
           losses = 0,
           draws = 0,
           points = 0,
           points_for = 0,
           points_against = 0,
           points_difference = 0,
           updated_at = CURRENT_TIMESTAMP
       WHERE group_id = $1`,
      [groupId]
    )
  } catch (error) {
    console.error("Error resetting group standings:", error)
    throw new Error("Failed to reset group standings")
  }
}

/**
 * Generate round robin fixtures for a group
 */
export function generateRoundRobinFixtures(teamIds: string[]): Array<[string, string]> {
  const fixtures: Array<[string, string]> = []
  
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      fixtures.push([teamIds[i], teamIds[j]])
    }
  }
  
  return fixtures
}

