// Server-side data functions for database operations

import { query } from "./database"
import { hashPassword } from "./auth"
import { Team, Player, Match, Tournament, User, TournamentSport, TournamentGroup, GroupTeam, GroupMatch, BracketNode } from "./static-data"

// Team functions
export async function createTeam(teamData: {
  name: string
  sport: string
  logo?: string
  players: { userId: string; number?: number; position?: string; phoneNumber?: string; profilePhoto?: string }[]
}): Promise<Team> {
  let createdTeamId: string | null = null
  try {
    const providedPlayers = Array.isArray(teamData.players) ? teamData.players : []
    if (providedPlayers.length === 0) {
      throw new Error("At least one player is required to create a team")
    }

    const uniqueUserIds = Array.from(
      new Set(
        providedPlayers
          .map((player) => player?.userId?.trim())
          .filter((userId): userId is string => Boolean(userId)),
      ),
    )

    if (uniqueUserIds.length !== providedPlayers.length) {
      throw new Error("Duplicate or invalid players detected")
    }

    const users = await query(
      `SELECT id, username, full_name, phone_number, profile_photo
         FROM users
        WHERE id = ANY($1::uuid[])`,
      [uniqueUserIds],
    )

    const userMap = new Map<string, { id: string; username: string; full_name: string | null; phone_number: string | null; profile_photo: string | null }>()
    for (const user of users) {
      userMap.set(user.id, user)
    }

    if (userMap.size !== uniqueUserIds.length) {
      throw new Error("One or more selected users do not exist")
    }

    // Insert team
    const teamResult = await query(`INSERT INTO teams (name, sport, logo) VALUES ($1, $2, $3) RETURNING *`, [
      teamData.name,
      teamData.sport,
      teamData.logo || null,
    ])

    const team = teamResult[0]
    createdTeamId = team.id

    // Insert players
    const players: Player[] = []
    for (const playerSelection of providedPlayers) {
      const user = userMap.get(playerSelection.userId)
      if (!user) {
        throw new Error("Invalid player selection")
      }

      const displayName = user.full_name && user.full_name.trim().length > 0 ? user.full_name : user.username

      await query(
        `INSERT INTO user_team_memberships (user_id, team_id, position, sport) VALUES ($1, $2, $3, $4)`,
        [user.id, team.id, playerSelection.position || null, teamData.sport],
      )

      const playerResult = await query(
        `INSERT INTO players (team_id, name, number, position, user_id, phone_number, profile_photo) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          team.id,
          displayName,
          typeof playerSelection.number === "number" ? playerSelection.number : null,
          playerSelection.position || null,
          user.id,
          playerSelection.phoneNumber || user.phone_number || null,
          playerSelection.profilePhoto || user.profile_photo || null,
        ],
      )
      const row = playerResult[0]
      players.push({
        id: row.id,
        name: row.name,
        number: row.number === null ? undefined : row.number,
        position: row.position === null ? undefined : row.position,
        phoneNumber: row.phone_number === null ? undefined : row.phone_number,
        profilePhoto: row.profile_photo === null ? undefined : row.profile_photo,
      })
    }

    return {
      id: team.id,
      name: team.name,
      sport: team.sport,
      logo: team.logo,
      players,
    }
  } catch (error) {
    if (createdTeamId) {
      try {
        await query(`DELETE FROM teams WHERE id = $1`, [createdTeamId])
      } catch (cleanupError) {
        console.error("Error cleaning up failed team creation:", cleanupError)
      }
    }
    console.error("Error creating team:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to create team")
  }
}

export async function getTeamsBySportFromDB(sport: string): Promise<Team[]> {
  try {
    const teams = await query(
      `SELECT t.*, 
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', p.id,
                    'name', p.name,
                    'number', p.number,
                    'position', p.position,
                    'userId', p.user_id,
                    'phoneNumber', p.phone_number,
                    'profilePhoto', p.profile_photo
                  ) ORDER BY p.number
                ) FILTER (WHERE p.id IS NOT NULL),
                '[]'::json
              ) as players
       FROM teams t
       LEFT JOIN players p ON t.id = p.team_id
       WHERE t.sport = $1
       GROUP BY t.id, t.name, t.sport, t.logo, t.created_at
       ORDER BY t.created_at DESC`,
      [sport],
    )

    return teams.map((row: any) => ({
      id: row.id,
      name: row.name,
      sport: row.sport,
      logo: row.logo,
      players: Array.isArray(row.players) ? row.players : [],
    }))
  } catch (error) {
    console.error("Error fetching teams by sport:", error)
    throw new Error("Failed to fetch teams")
  }
}

export async function getAllTeamsFromDB(): Promise<Team[]> {
  try {
    const teams = await query(`
      SELECT t.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', p.id,
                   'name', p.name,
                   'number', p.number,
                   'position', p.position,
                   'userId', p.user_id,
                   'phoneNumber', p.phone_number,
                   'profilePhoto', p.profile_photo
                 ) ORDER BY p.number
               ) FILTER (WHERE p.id IS NOT NULL),
               '[]'::json
             ) as players
      FROM teams t
      LEFT JOIN players p ON t.id = p.team_id
      GROUP BY t.id, t.name, t.sport, t.logo, t.created_at
      ORDER BY t.created_at DESC
    `)

    return teams.map((row: any) => ({
      id: row.id,
      name: row.name,
      sport: row.sport,
      logo: row.logo,
      players: Array.isArray(row.players) ? row.players : [],
    }))
  } catch (error) {
    console.error("Error fetching all teams:", error)
    throw new Error("Failed to fetch teams")
  }
}

export async function getTeamByIdFromDB(id: string): Promise<Team | null> {
  try {
    const teams = await query(
      `SELECT t.*, 
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', p.id,
                    'name', p.name,
                    'number', p.number,
                    'position', p.position,
                    'userId', p.user_id,
                    'phoneNumber', p.phone_number,
                    'profilePhoto', p.profile_photo
                  ) ORDER BY p.number
                ) FILTER (WHERE p.id IS NOT NULL),
                '[]'::json
              ) as players
       FROM teams t
       LEFT JOIN players p ON t.id = p.team_id
       WHERE t.id = $1
       GROUP BY t.id, t.name, t.sport, t.logo, t.created_at`,
      [id],
    )

    if (teams.length === 0) return null

    const row = teams[0]
    return {
      id: row.id,
      name: row.name,
      sport: row.sport,
      logo: row.logo,
      players: Array.isArray(row.players) ? row.players : [],
    }
  } catch (error) {
    console.error("Error fetching team by ID:", error)
    throw new Error("Failed to fetch team")
  }
}

export async function deleteTeamByIdFromDB(id: string): Promise<void> {
  try {
    // Delete all related records in proper order to respect foreign key constraints
    
    // 1. Delete user_match_participation records for this team
    await query(`DELETE FROM user_match_participation WHERE team_id = $1`, [id])
    
    // 2. Delete matches where this team is home or away team
    await query(`DELETE FROM matches WHERE home_team_id = $1 OR away_team_id = $1`, [id])
    
    // 3. Delete group_teams records
    await query(`DELETE FROM group_teams WHERE team_id = $1`, [id])
    
    // 4. Delete tournament_bracket_nodes records
    await query(`DELETE FROM tournament_bracket_nodes WHERE team_id = $1`, [id])
    
    // 5. Delete user_team_memberships (should cascade automatically but being explicit)
    await query(`DELETE FROM user_team_memberships WHERE team_id = $1`, [id])
    
    // 6. Delete players (should cascade automatically but being explicit)
    await query(`DELETE FROM players WHERE team_id = $1`, [id])
    
    // 7. Finally delete the team itself
    await query(`DELETE FROM teams WHERE id = $1`, [id])
  } catch (error) {
    console.error("Error deleting team:", error)
    throw new Error("Failed to delete team")
  }
}

export async function updateTeam(teamId: string, teamData: {
  name: string
  sport: string
  logo?: string
  players: { userId: string; number?: number; position?: string; phoneNumber?: string; profilePhoto?: string }[]
}): Promise<Team> {
  try {
    const providedPlayers = Array.isArray(teamData.players) ? teamData.players : []
    if (providedPlayers.length === 0) {
      throw new Error("At least one player is required")
    }

    const uniqueUserIds = Array.from(
      new Set(
        providedPlayers
          .map((player) => player?.userId?.trim())
          .filter((userId): userId is string => Boolean(userId)),
      ),
    )

    if (uniqueUserIds.length !== providedPlayers.length) {
      throw new Error("Duplicate or invalid players detected")
    }

    const users = await query(
      `SELECT id, username, full_name, phone_number, profile_photo
         FROM users
        WHERE id = ANY($1::uuid[])`,
      [uniqueUserIds],
    )

    const userMap = new Map<string, { id: string; username: string; full_name: string | null; phone_number: string | null; profile_photo: string | null }>()
    for (const user of users) {
      userMap.set(user.id, user)
    }

    if (userMap.size !== uniqueUserIds.length) {
      throw new Error("One or more selected users do not exist")
    }

    // Update team details
    await query(
      `UPDATE teams SET name = $1, sport = $2, logo = $3 WHERE id = $4`,
      [teamData.name, teamData.sport, teamData.logo || null, teamId]
    )

    // Delete existing players and memberships
    await query(`DELETE FROM user_team_memberships WHERE team_id = $1`, [teamId])
    await query(`DELETE FROM players WHERE team_id = $1`, [teamId])

    // Insert new players and memberships
    const players: Player[] = []
    for (const playerSelection of providedPlayers) {
      const user = userMap.get(playerSelection.userId)
      if (!user) {
        throw new Error("Invalid player selection")
      }

      const displayName = user.full_name && user.full_name.trim().length > 0 ? user.full_name : user.username

      await query(
        `INSERT INTO user_team_memberships (user_id, team_id, position, sport) VALUES ($1, $2, $3, $4)`,
        [user.id, teamId, playerSelection.position || null, teamData.sport],
      )

      const playerResult = await query(
        `INSERT INTO players (team_id, name, number, position, user_id, phone_number, profile_photo) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          teamId,
          displayName,
          typeof playerSelection.number === "number" ? playerSelection.number : null,
          playerSelection.position || null,
          user.id,
          playerSelection.phoneNumber || user.phone_number || null,
          playerSelection.profilePhoto || user.profile_photo || null,
        ],
      )
      const row = playerResult[0]
      players.push({
        id: row.id,
        name: row.name,
        number: row.number === null ? undefined : row.number,
        position: row.position === null ? undefined : row.position,
        phoneNumber: row.phone_number === null ? undefined : row.phone_number,
        profilePhoto: row.profile_photo === null ? undefined : row.profile_photo,
      })
    }

    const teamResult = await query(`SELECT * FROM teams WHERE id = $1`, [teamId])
    const team = teamResult[0]

    return {
      id: team.id,
      name: team.name,
      sport: team.sport,
      logo: team.logo,
      players,
    }
  } catch (error) {
    console.error("Error updating team:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to update team")
  }
}

export async function checkDuplicateTeamName(
  name: string,
  sport: string,
  excludeTeamId?: string
): Promise<boolean> {
  try {
    const queryText = excludeTeamId
      ? `SELECT id FROM teams WHERE LOWER(name) = LOWER($1) AND sport = $2 AND id != $3`
      : `SELECT id FROM teams WHERE LOWER(name) = LOWER($1) AND sport = $2`
    const params = excludeTeamId ? [name, sport, excludeTeamId] : [name, sport]
    const result = await query(queryText, params)
    return result.length > 0
  } catch (error) {
    console.error("Error checking duplicate team name:", error)
    throw new Error("Failed to check duplicate team name")
  }
}

// Match functions
export async function createMatch(matchData: {
  sport: string
  homeTeamId: string
  awayTeamId: string
  date: string
  venue: string
  status?: string
}): Promise<Match> {
  try {
    const matchResult = await query(
      `INSERT INTO matches (sport, home_team_id, away_team_id, match_date, venue, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        matchData.sport,
        matchData.homeTeamId,
        matchData.awayTeamId,
        matchData.date,
        matchData.venue,
        matchData.status || "scheduled",
      ],
    )

    const match = matchResult[0]
    const homeTeam = await getTeamByIdFromDB(match.home_team_id)
    const awayTeam = await getTeamByIdFromDB(match.away_team_id)

    if (!homeTeam || !awayTeam) {
      throw new Error("Teams not found")
    }

    return {
      id: match.id,
      sport: match.sport,
      homeTeam,
      awayTeam,
      date: match.match_date,
      venue: match.venue,
      status: match.status,
      score: match.score,
    }
  } catch (error) {
    console.error("Error creating match:", error)
    throw new Error("Failed to create match")
  }
}

export async function getMatchesBySportFromDB(sport: string): Promise<Match[]> {
  try {
    const matches = await query(`SELECT * FROM matches WHERE sport = $1 ORDER BY match_date DESC`, [sport])

    const result: Match[] = []
    for (const match of matches) {
      const homeTeam = await getTeamByIdFromDB(match.home_team_id)
      const awayTeam = await getTeamByIdFromDB(match.away_team_id)

      if (homeTeam && awayTeam) {
        result.push({
          id: match.id,
          sport: match.sport,
          homeTeam,
          awayTeam,
          date: match.match_date,
          venue: match.venue,
          status: match.status,
          score: match.score,
          tournamentId: match.tournament_id || undefined,
          groupId: match.group_id || undefined,
        })
      }
    }

    return result
  } catch (error) {
    console.error("Error fetching matches by sport:", error)
    throw new Error("Failed to fetch matches")
  }
}

export async function getMatchesByStatusFromDB(status: "scheduled" | "started" | "live" | "completed"): Promise<Match[]> {
  try {
    const matches = await query(`SELECT * FROM matches WHERE status = $1 ORDER BY match_date DESC`, [status])

    const result: Match[] = []
    for (const match of matches) {
      const homeTeam = await getTeamByIdFromDB(match.home_team_id)
      const awayTeam = await getTeamByIdFromDB(match.away_team_id)

      if (homeTeam && awayTeam) {
        result.push({
          id: match.id,
          sport: match.sport,
          homeTeam,
          awayTeam,
          date: match.match_date,
          venue: match.venue,
          status: match.status,
          score: match.score,
          tournamentId: match.tournament_id || undefined,
          groupId: match.group_id || undefined,
        })
      }
    }

    return result
  } catch (error) {
    console.error("Error fetching matches by status:", error)
    throw new Error("Failed to fetch matches")
  }
}

export async function getMatchByIdFromDB(id: string): Promise<Match | null> {
  try {
    const matches = await query(`SELECT * FROM matches WHERE id = $1`, [id])

    if (matches.length === 0) return null

    const match = matches[0]
    const homeTeam = await getTeamByIdFromDB(match.home_team_id)
    const awayTeam = await getTeamByIdFromDB(match.away_team_id)

    if (!homeTeam || !awayTeam) return null

    return {
      id: match.id,
      sport: match.sport,
      homeTeam,
      awayTeam,
      date: match.match_date,
      venue: match.venue,
      status: match.status,
      score: match.score,
      tournamentId: match.tournament_id || undefined,
      groupId: match.group_id || undefined,
    }
  } catch (error) {
    console.error("Error fetching match by ID:", error)
    throw new Error("Failed to fetch match")
  }
}

export async function updateMatchScore(matchId: string, score: any): Promise<void> {
  try {
    await query(`UPDATE matches SET score = $1 WHERE id = $2`, [JSON.stringify(score), matchId])
  } catch (error) {
    console.error("Error updating match score:", error)
    throw new Error("Failed to update match score")
  }
}

export async function updateMatchStatus(
  matchId: string,
  status: "scheduled" | "started" | "live" | "completed",
): Promise<void> {
  try {
    await query(`UPDATE matches SET status = $1 WHERE id = $2`, [status, matchId])
  } catch (error) {
    console.error("Error updating match status:", error)
    throw new Error("Failed to update match status")
  }
}

export async function getAllMatchesFromDB(): Promise<Match[]> {
  try {
    const matches = await query(`SELECT * FROM matches ORDER BY match_date DESC`)

    const result: Match[] = []
    for (const match of matches) {
      const homeTeam = await getTeamByIdFromDB(match.home_team_id)
      const awayTeam = await getTeamByIdFromDB(match.away_team_id)

      if (homeTeam && awayTeam) {
        result.push({
          id: match.id,
          sport: match.sport,
          homeTeam,
          awayTeam,
          date: match.match_date,
          venue: match.venue,
          status: match.status,
          score: match.score,
          tournamentId: match.tournament_id || undefined,
          groupId: match.group_id || undefined,
        })
      }
    }

    return result
  } catch (error) {
    console.error("Error fetching all matches:", error)
    throw new Error("Failed to fetch matches")
  }
}

// Alias functions for backwards compatibility
export const getMatchById = getMatchByIdFromDB
export const getMatchesBySport = getMatchesBySportFromDB
export const getMatchesByStatus = getMatchesByStatusFromDB
export const getAllMatches = getAllMatchesFromDB
export const getTeamById = getTeamByIdFromDB
export const getTeamsBySport = getTeamsBySportFromDB
export const getAllTeams = getAllTeamsFromDB
export const deleteTeamById = deleteTeamByIdFromDB
export const getAllTournaments = getAllTournamentsFromDB
export const getTournamentById = getTournamentByIdFromDB
export const getUserByEmail = getUserByEmailFromDB
export const createUser = createUserInDB
export const getAllUsers = getAllUsersFromDB

// Export tournament fixtures functions
export { 
  initializeGroupStanding,
  initializeAllGroupStandings,
  getGroupStandings,
  resetGroupStandings,
  updatePointsTableAfterMatch,
  generateRoundRobinFixtures,
  calculatePoints,
  determineWinner,
  extractScoreValue
} from './tournament-fixtures'

// Tournament functions
export async function createTournament(tournamentData: {
  name: string
  sport: string
  format: string
  bracketType: string
  startDate: string
  teams: string[]
  matches: any[]
  teamLogos: Record<string, string>
}): Promise<Tournament> {
  try {
    const tournamentResult = await query(
      `INSERT INTO tournaments (name, sport, format, bracket_type, start_date, teams, matches, team_logos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        tournamentData.name,
        tournamentData.sport,
        tournamentData.format,
        tournamentData.bracketType,
        tournamentData.startDate,
        JSON.stringify(tournamentData.teams),
        JSON.stringify(tournamentData.matches),
        JSON.stringify(tournamentData.teamLogos),
      ],
    )

    const tournament = tournamentResult[0]

    return {
      id: tournament.id,
      name: tournament.name,
      sport: tournament.sport,
      format: tournament.format,
      bracketType: tournament.bracket_type,
      status: tournament.status,
      startDate: tournament.start_date,
      teams: tournament.teams || [],
      matches: tournament.matches || [],
      teamLogos: tournament.team_logos || {},
    }
  } catch (error) {
    console.error("Error creating tournament:", error)
    throw new Error("Failed to create tournament")
  }
}

export async function getAllTournamentsFromDB(): Promise<Tournament[]> {
  try {
    // Get all tournaments from the database
    const tournaments = await query(`
      SELECT *
      FROM tournaments
      ORDER BY created_at DESC
    `)

    return tournaments.map((row: any) => ({
      id: row.id,
      name: row.name || 'Unnamed Tournament',
      sport: row.sport || undefined,
      format: row.format || 'single-elimination',
      bracketType: row.bracket_type || 'single',
      status: row.status || 'upcoming',
      startDate: row.start_date || new Date().toISOString().split('T')[0],
      teams: row.teams || [],
      matches: row.matches || [],
      teamLogos: row.team_logos || {},
    }))
  } catch (error) {
    console.error("Error fetching tournaments:", error)
    throw new Error("Failed to fetch tournaments")
  }
}

export async function getTournamentByIdFromDB(id: string): Promise<Tournament | null> {
  try {
    const tournaments = await query(`SELECT * FROM tournaments WHERE id = $1`, [id])

    if (tournaments.length === 0) return null

    const row = tournaments[0]
    return {
      id: row.id,
      name: row.name,
      sport: row.sport,
      format: row.format,
      bracketType: row.bracket_type,
      status: row.status,
      startDate: row.start_date,
      teams: row.teams || [],
      matches: row.matches || [],
      teamLogos: row.team_logos || {},
    }
  } catch (error) {
    console.error("Error fetching tournament by ID:", error)
    throw new Error("Failed to fetch tournament")
  }
}

export async function updateTournament(
  tournamentId: string,
  updates: {
    name?: string
    status?: string
    matches?: any[]
    bracketConfig?: Record<string, any>
  },
): Promise<void> {
  try {
    const updateFields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`)
      values.push(updates.name)
    }

    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`)
      values.push(updates.status)
    }

    if (updates.matches !== undefined) {
      updateFields.push(`matches = $${paramIndex++}`)
      values.push(JSON.stringify(updates.matches))
    }

    if (updates.bracketConfig !== undefined) {
      updateFields.push(`bracket_config = $${paramIndex++}`)
      values.push(JSON.stringify(updates.bracketConfig))
    }

    if (updateFields.length === 0) return

    values.push(tournamentId)
    const updateQuery = `UPDATE tournaments SET ${updateFields.join(", ")} WHERE id = $${paramIndex}`

    await query(updateQuery, values)
  } catch (error) {
    console.error("Error updating tournament:", error)
    throw new Error("Failed to update tournament")
  }
}

// New tournament creation function (name only)
export async function createTournamentBasic(name: string, sportsCount: number): Promise<Tournament> {
  try {
    const tournamentResult = await query(
      `INSERT INTO tournaments (name, sport, format, bracket_type, status, start_date, sports_count, team_logos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        name,
        null, // Sport is null initially - will be set via tournament_sports table
        'single-elimination', // Default, can be updated later
        'single', // Default, can be updated later
        'upcoming',
        new Date().toISOString().split('T')[0],
        sportsCount,
        JSON.stringify({}),
      ],
    )

    const tournament = tournamentResult[0]

    return {
      id: tournament.id,
      name: tournament.name,
      format: tournament.format,
      bracketType: tournament.bracket_type,
      status: tournament.status,
      startDate: tournament.start_date,
      sportsCount: tournament.sports_count,
      teamLogos: tournament.team_logos || {},
      teams: [],
      matches: [],
    }
  } catch (error) {
    console.error("Error creating tournament:", error)
    throw new Error("Failed to create tournament")
  }
}

// Tournament sports functions
export async function addTournamentSport(tournamentId: string, sport: string, displayOrder: number): Promise<TournamentSport> {
  try {
    // Check if sport already exists for this tournament
    const existing = await query(
      `SELECT * FROM tournament_sports WHERE tournament_id = $1 AND sport = $2`,
      [tournamentId, sport],
    )

    if (existing.length > 0) {
      return {
        id: existing[0].id,
        tournamentId: existing[0].tournament_id,
        sport: existing[0].sport,
        displayOrder: existing[0].display_order,
        createdAt: existing[0].created_at,
      }
    }

    const result = await query(
      `INSERT INTO tournament_sports (tournament_id, sport, display_order)
       VALUES ($1, $2, $3) RETURNING *`,
      [tournamentId, sport, displayOrder],
    )

    return {
      id: result[0].id,
      tournamentId: result[0].tournament_id,
      sport: result[0].sport,
      displayOrder: result[0].display_order,
      createdAt: result[0].created_at,
    }
  } catch (error) {
    console.error("Error adding tournament sport:", error)
    throw new Error("Failed to add tournament sport")
  }
}

export async function getTournamentSports(tournamentId: string): Promise<TournamentSport[]> {
  try {
    const results = await query(
      `SELECT * FROM tournament_sports WHERE tournament_id = $1 ORDER BY display_order ASC`,
      [tournamentId],
    )

    return results.map((row: any) => ({
      id: row.id,
      tournamentId: row.tournament_id,
      sport: row.sport,
      displayOrder: row.display_order,
      createdAt: row.created_at,
    }))
  } catch (error) {
    console.error("Error fetching tournament sports:", error)
    throw new Error("Failed to fetch tournament sports")
  }
}

// Tournament groups functions
export async function createTournamentGroup(
  tournamentId: string,
  tournamentSportId: string,
  groupName: string,
  sport: string,
  displayOrder: number,
): Promise<TournamentGroup> {
  try {
    const result = await query(
      `INSERT INTO tournament_groups (tournament_id, tournament_sport_id, group_name, sport, display_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tournamentId, tournamentSportId, groupName, sport, displayOrder],
    )

    return {
      id: result[0].id,
      tournamentId: result[0].tournament_id,
      tournamentSportId: result[0].tournament_sport_id,
      groupName: result[0].group_name,
      sport: result[0].sport,
      displayOrder: result[0].display_order,
      createdAt: result[0].created_at,
    }
  } catch (error) {
    console.error("Error creating tournament group:", error)
    throw new Error("Failed to create tournament group")
  }
}

export async function getTournamentGroups(tournamentId: string, sport?: string): Promise<TournamentGroup[]> {
  try {
    let queryStr = `SELECT * FROM tournament_groups WHERE tournament_id = $1`
    const params: any[] = [tournamentId]

    if (sport) {
      queryStr += ` AND sport = $2`
      params.push(sport)
    }

    queryStr += ` ORDER BY sport, display_order ASC`

    const results = await query(queryStr, params)

    return results.map((row: any) => ({
      id: row.id,
      tournamentId: row.tournament_id,
      tournamentSportId: row.tournament_sport_id,
      groupName: row.group_name,
      sport: row.sport,
      displayOrder: row.display_order,
      createdAt: row.created_at,
    }))
  } catch (error) {
    console.error("Error fetching tournament groups:", error)
    throw new Error("Failed to fetch tournament groups")
  }
}

export async function getTournamentGroupWithTeams(groupId: string): Promise<TournamentGroup | null> {
  try {
    const groups = await query(`SELECT * FROM tournament_groups WHERE id = $1`, [groupId])
    if (groups.length === 0) return null

    const group = groups[0]
    const teams = await getGroupTeams(groupId)

    return {
      id: group.id,
      tournamentId: group.tournament_id,
      tournamentSportId: group.tournament_sport_id,
      groupName: group.group_name,
      sport: group.sport,
      displayOrder: group.display_order,
      createdAt: group.created_at,
      teams,
    }
  } catch (error) {
    console.error("Error fetching tournament group with teams:", error)
    throw new Error("Failed to fetch tournament group")
  }
}

// Group teams functions
export async function addTeamToGroup(groupId: string, teamId: string, displayOrder: number): Promise<GroupTeam> {
  try {
    const result = await query(
      `INSERT INTO group_teams (group_id, team_id, display_order)
       VALUES ($1, $2, $3) RETURNING *`,
      [groupId, teamId, displayOrder],
    )

    return {
      id: result[0].id,
      groupId: result[0].group_id,
      teamId: result[0].team_id,
      displayOrder: result[0].display_order,
      createdAt: result[0].created_at,
    }
  } catch (error) {
    console.error("Error adding team to group:", error)
    throw new Error("Failed to add team to group")
  }
}

export async function removeTeamFromGroup(groupId: string, teamId: string): Promise<void> {
  try {
    await query(`DELETE FROM group_teams WHERE group_id = $1 AND team_id = $2`, [groupId, teamId])
  } catch (error) {
    console.error("Error removing team from group:", error)
    throw new Error("Failed to remove team from group")
  }
}

export async function getGroupTeams(groupId: string): Promise<GroupTeam[]> {
  try {
    const results = await query(
      `SELECT gt.*, t.name as team_name, t.sport as team_sport, t.logo as team_logo
       FROM group_teams gt
       JOIN teams t ON gt.team_id = t.id
       WHERE gt.group_id = $1
       ORDER BY gt.display_order ASC`,
      [groupId],
    )

    return results.map((row: any) => ({
      id: row.id,
      groupId: row.group_id,
      teamId: row.team_id,
      displayOrder: row.display_order,
      createdAt: row.created_at,
      team: {
        id: row.team_id,
        name: row.team_name,
        sport: row.team_sport,
        logo: row.team_logo,
        players: [],
      },
    }))
  } catch (error) {
    console.error("Error fetching group teams:", error)
    throw new Error("Failed to fetch group teams")
  }
}

// Group matches functions
export async function createGroupMatch(matchData: {
  groupId: string
  team1Id: string
  team2Id: string
  team1Score?: any
  team2Score?: any
  winnerId?: string
  matchDate?: string
  status?: string
}): Promise<GroupMatch> {
  try {
    const result = await query(
      `INSERT INTO group_matches (group_id, team1_id, team2_id, team1_score, team2_score, winner_id, match_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        matchData.groupId,
        matchData.team1Id,
        matchData.team2Id,
        matchData.team1Score ? JSON.stringify(matchData.team1Score) : null,
        matchData.team2Score ? JSON.stringify(matchData.team2Score) : null,
        matchData.winnerId || null,
        matchData.matchDate || null,
        matchData.status || 'scheduled',
      ],
    )

    const row = result[0]
    return {
      id: row.id,
      groupId: row.group_id,
      team1Id: row.team1_id,
      team2Id: row.team2_id,
      team1Score: row.team1_score,
      team2Score: row.team2_score,
      winnerId: row.winner_id,
      matchDate: row.match_date,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  } catch (error) {
    console.error("Error creating group match:", error)
    throw new Error("Failed to create group match")
  }
}

export async function getGroupMatches(groupId: string): Promise<GroupMatch[]> {
  try {
    const results = await query(
      `SELECT * FROM group_matches WHERE group_id = $1 ORDER BY match_date DESC`,
      [groupId],
    )

    return results.map((row: any) => ({
      id: row.id,
      groupId: row.group_id,
      team1Id: row.team1_id,
      team2Id: row.team2_id,
      team1Score: row.team1_score,
      team2Score: row.team2_score,
      winnerId: row.winner_id,
      matchDate: row.match_date,
      status: row.status,
      matchId: row.match_id,
      matchNumber: row.match_number,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  } catch (error) {
    console.error("Error fetching group matches:", error)
    throw new Error("Failed to fetch group matches")
  }
}

export async function updateGroupMatch(matchId: string, updates: {
  team1Score?: any
  team2Score?: any
  winnerId?: string
  matchDate?: string
  status?: string
}): Promise<GroupMatch> {
  try {
    const updateFields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (updates.team1Score !== undefined) {
      updateFields.push(`team1_score = $${paramIndex++}`)
      values.push(JSON.stringify(updates.team1Score))
    }

    if (updates.team2Score !== undefined) {
      updateFields.push(`team2_score = $${paramIndex++}`)
      values.push(JSON.stringify(updates.team2Score))
    }

    if (updates.winnerId !== undefined) {
      updateFields.push(`winner_id = $${paramIndex++}`)
      values.push(updates.winnerId)
    }

    if (updates.matchDate !== undefined) {
      updateFields.push(`match_date = $${paramIndex++}`)
      values.push(updates.matchDate)
    }

    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`)
      values.push(updates.status)
    }

    if (updateFields.length === 0) {
      throw new Error("No fields to update")
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)

    values.push(matchId)
    const updateQuery = `UPDATE group_matches SET ${updateFields.join(", ")} WHERE id = $${paramIndex} RETURNING *`

    const result = await query(updateQuery, values)
    const row = result[0]

    return {
      id: row.id,
      groupId: row.group_id,
      team1Id: row.team1_id,
      team2Id: row.team2_id,
      team1Score: row.team1_score,
      team2Score: row.team2_score,
      winnerId: row.winner_id,
      matchDate: row.match_date,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  } catch (error) {
    console.error("Error updating group match:", error)
    throw new Error("Failed to update group match")
  }
}

export async function deleteGroupMatch(matchId: string): Promise<void> {
  try {
    await query(`DELETE FROM group_matches WHERE id = $1`, [matchId])
  } catch (error) {
    console.error("Error deleting group match:", error)
    throw new Error("Failed to delete group match")
  }
}

// Bracket nodes functions
export async function createBracketNode(nodeData: {
  tournamentId: string
  groupId?: string
  nodeType: 'round' | 'match' | 'team'
  roundNumber?: number
  matchNumber?: number
  position?: number
  teamId?: string
  parentNodeId?: string
  nextMatchId?: string
  winnerId?: string
  score?: any
  matchDate?: string
  nodeData?: any
}): Promise<BracketNode> {
  try {
    const result = await query(
      `INSERT INTO tournament_bracket_nodes (
        tournament_id, group_id, node_type, round_number, match_number, position,
        team_id, parent_node_id, next_match_id, winner_id, score, match_date, node_data
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        nodeData.tournamentId,
        nodeData.groupId || null,
        nodeData.nodeType,
        nodeData.roundNumber || null,
        nodeData.matchNumber || null,
        nodeData.position || null,
        nodeData.teamId || null,
        nodeData.parentNodeId || null,
        nodeData.nextMatchId || null,
        nodeData.winnerId || null,
        nodeData.score ? JSON.stringify(nodeData.score) : null,
        nodeData.matchDate || null,
        nodeData.nodeData ? JSON.stringify(nodeData.nodeData) : null,
      ],
    )

    const row = result[0]
    return {
      id: row.id,
      tournamentId: row.tournament_id,
      groupId: row.group_id,
      nodeType: row.node_type,
      roundNumber: row.round_number,
      matchNumber: row.match_number,
      position: row.position,
      teamId: row.team_id,
      parentNodeId: row.parent_node_id,
      nextMatchId: row.next_match_id,
      winnerId: row.winner_id,
      score: row.score ? (typeof row.score === 'string' ? JSON.parse(row.score) : row.score) : undefined,
      matchDate: row.match_date,
      nodeData: row.node_data ? (typeof row.node_data === 'string' ? JSON.parse(row.node_data) : row.node_data) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  } catch (error) {
    console.error("Error creating bracket node:", error)
    throw new Error("Failed to create bracket node")
  }
}

export async function updateBracketNode(nodeId: string, updates: {
  teamId?: string
  winnerId?: string
  score?: any
  matchDate?: string
  nodeData?: any
}): Promise<BracketNode> {
  try {
    const updateFields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (updates.teamId !== undefined) {
      updateFields.push(`team_id = $${paramIndex++}`)
      values.push(updates.teamId || null)
    }

    if (updates.winnerId !== undefined) {
      updateFields.push(`winner_id = $${paramIndex++}`)
      values.push(updates.winnerId || null)
    }

    if (updates.score !== undefined) {
      updateFields.push(`score = $${paramIndex++}`)
      values.push(JSON.stringify(updates.score))
    }

    if (updates.matchDate !== undefined) {
      updateFields.push(`match_date = $${paramIndex++}`)
      values.push(updates.matchDate || null)
    }

    if (updates.nodeData !== undefined) {
      updateFields.push(`node_data = $${paramIndex++}`)
      values.push(JSON.stringify(updates.nodeData))
    }

    if (updateFields.length === 0) {
      throw new Error("No fields to update")
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(nodeId)

    const updateQuery = `UPDATE tournament_bracket_nodes SET ${updateFields.join(", ")} WHERE id = $${paramIndex} RETURNING *`
    const result = await query(updateQuery, values)

    const row = result[0]
    return {
      id: row.id,
      tournamentId: row.tournament_id,
      groupId: row.group_id,
      nodeType: row.node_type,
      roundNumber: row.round_number,
      matchNumber: row.match_number,
      position: row.position,
      teamId: row.team_id,
      parentNodeId: row.parent_node_id,
      nextMatchId: row.next_match_id,
      winnerId: row.winner_id,
      score: row.score ? (typeof row.score === 'string' ? JSON.parse(row.score) : row.score) : undefined,
      matchDate: row.match_date,
      nodeData: row.node_data ? (typeof row.node_data === 'string' ? JSON.parse(row.node_data) : row.node_data) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  } catch (error) {
    console.error("Error updating bracket node:", error)
    throw new Error("Failed to update bracket node")
  }
}

export async function getTournamentBracketNodes(tournamentId: string, groupId?: string): Promise<BracketNode[]> {
  try {
    let queryStr = `SELECT * FROM tournament_bracket_nodes WHERE tournament_id = $1`
    const params: any[] = [tournamentId]

    if (groupId) {
      queryStr += ` AND group_id = $2`
      params.push(groupId)
    }

    queryStr += ` ORDER BY round_number ASC, match_number ASC, position ASC`

    const results = await query(queryStr, params)

    return results.map((row: any) => ({
      id: row.id,
      tournamentId: row.tournament_id,
      groupId: row.group_id,
      nodeType: row.node_type,
      roundNumber: row.round_number,
      matchNumber: row.match_number,
      position: row.position,
      teamId: row.team_id,
      parentNodeId: row.parent_node_id,
      nextMatchId: row.next_match_id,
      winnerId: row.winner_id,
      score: row.score ? (typeof row.score === 'string' ? JSON.parse(row.score) : row.score) : undefined,
      matchDate: row.match_date,
      nodeData: row.node_data ? (typeof row.node_data === 'string' ? JSON.parse(row.node_data) : row.node_data) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  } catch (error) {
    console.error("Error fetching bracket nodes:", error)
    throw new Error("Failed to fetch bracket nodes")
  }
}

export async function deleteTournamentBracketNodes(tournamentId: string, groupId?: string): Promise<void> {
  try {
    if (groupId) {
      await query(`DELETE FROM tournament_bracket_nodes WHERE tournament_id = $1 AND group_id = $2`, [tournamentId, groupId])
    } else {
      await query(`DELETE FROM tournament_bracket_nodes WHERE tournament_id = $1`, [tournamentId])
    }
  } catch (error) {
    console.error("Error deleting bracket nodes:", error)
    throw new Error("Failed to delete bracket nodes")
  }
}

export async function deleteTournament(tournamentId: string): Promise<void> {
  try {
    // First, delete all matches related to this tournament (including all statuses)
    // Get all group_matches for this tournament
    const groupMatches = await query(
      `SELECT gm.match_id 
       FROM group_matches gm
       JOIN tournament_groups tg ON gm.group_id = tg.id
       WHERE tg.tournament_id = $1 AND gm.match_id IS NOT NULL`,
      [tournamentId]
    )
    
    // Delete ALL matches linked to tournament groups (regardless of status)
    const matchIds = groupMatches.map((gm: any) => gm.match_id).filter(Boolean)
    if (matchIds.length > 0) {
      // Delete sport-specific configs for these matches
      for (const matchId of matchIds) {
        await query(`DELETE FROM cricket_match_config WHERE match_id = $1`, [matchId]).catch(() => {})
        await query(`DELETE FROM volleyball_match_config WHERE match_id = $1`, [matchId]).catch(() => {})
        await query(`DELETE FROM chess_match_config WHERE match_id = $1`, [matchId]).catch(() => {})
        await query(`DELETE FROM futsal_match_config WHERE match_id = $1`, [matchId]).catch(() => {})
        await query(`DELETE FROM table_tennis_match_config WHERE match_id = $1`, [matchId]).catch(() => {})
        await query(`DELETE FROM badminton_match_config WHERE match_id = $1`, [matchId]).catch(() => {})
      }
      
      // Delete user match participation
      await query(
        `DELETE FROM user_match_participation WHERE match_id = ANY($1::uuid[])`,
        [matchIds]
      )
      
      // Delete all matches regardless of status
      await query(
        `DELETE FROM matches WHERE id = ANY($1::uuid[])`,
        [matchIds]
      )
    }
    
    // Also delete matches directly linked to tournament via tournament_id
    const directMatches = await query(
      `SELECT id FROM matches WHERE tournament_id = $1`,
      [tournamentId]
    )
    
    const directMatchIds = directMatches.map((m: any) => m.id)
    if (directMatchIds.length > 0) {
      // Delete sport-specific configs
      for (const matchId of directMatchIds) {
        await query(`DELETE FROM cricket_match_config WHERE match_id = $1`, [matchId]).catch(() => {})
        await query(`DELETE FROM volleyball_match_config WHERE match_id = $1`, [matchId]).catch(() => {})
        await query(`DELETE FROM chess_match_config WHERE match_id = $1`, [matchId]).catch(() => {})
        await query(`DELETE FROM futsal_match_config WHERE match_id = $1`, [matchId]).catch(() => {})
        await query(`DELETE FROM table_tennis_match_config WHERE match_id = $1`, [matchId]).catch(() => {})
        await query(`DELETE FROM badminton_match_config WHERE match_id = $1`, [matchId]).catch(() => {})
      }
      
      // Delete user match participation
      await query(
        `DELETE FROM user_match_participation WHERE match_id = ANY($1::uuid[])`,
        [directMatchIds]
      )
      
      await query(
        `DELETE FROM matches WHERE tournament_id = $1`,
        [tournamentId]
      )
    }
    
    // Delete group_matches (should be handled by cascade, but being explicit)
    await query(
      `DELETE FROM group_matches gm
       USING tournament_groups tg
       WHERE gm.group_id = tg.id AND tg.tournament_id = $1`,
      [tournamentId]
    )
    
    // Delete group_standings
    await query(
      `DELETE FROM group_standings gs
       USING tournament_groups tg
       WHERE gs.group_id = tg.id AND tg.tournament_id = $1`,
      [tournamentId]
    )
    
    // Database cascade will handle deleting tournament_sports, tournament_groups, 
    // group_teams, and tournament_bracket_nodes
    await query(`DELETE FROM tournaments WHERE id = $1`, [tournamentId])
  } catch (error) {
    console.error("Error deleting tournament:", error)
    throw new Error("Failed to delete tournament")
  }
}

// Match deletion function
export async function deleteMatch(matchId: string): Promise<void> {
  try {
    // First, check if match exists and get its status
    const matchResult = await query(
      `SELECT id, status FROM matches WHERE id = $1`,
      [matchId]
    )
    
    if (matchResult.length === 0) {
      throw new Error("Match not found")
    }
    
    const match = matchResult[0]
    
    // Prevent deletion of live or started matches
    if (match.status === "live" || match.status === "started") {
      throw new Error("Cannot delete a match that is currently live or started. Please complete or cancel the match first.")
    }
    
    // Delete related records first (cascading will handle most, but being explicit)
    // Delete user_match_participation records
    await query(`DELETE FROM user_match_participation WHERE match_id = $1`, [matchId])
    
    // Delete sport-specific configs if they exist
    await query(`DELETE FROM cricket_match_config WHERE match_id = $1`, [matchId]).catch(() => {})
    await query(`DELETE FROM volleyball_match_config WHERE match_id = $1`, [matchId]).catch(() => {})
    await query(`DELETE FROM chess_match_config WHERE match_id = $1`, [matchId]).catch(() => {})
    await query(`DELETE FROM futsal_match_config WHERE match_id = $1`, [matchId]).catch(() => {})
    await query(`DELETE FROM table_tennis_match_config WHERE match_id = $1`, [matchId]).catch(() => {})
    await query(`DELETE FROM badminton_match_config WHERE match_id = $1`, [matchId]).catch(() => {})
    
    // Delete the match itself
    // This will cascade to user_match_participation and set match_id to NULL in group_matches
    await query(`DELETE FROM matches WHERE id = $1`, [matchId])
  } catch (error) {
    console.error("Error deleting match:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to delete match")
  }
}

// User functions
export async function getUserByEmailFromDB(email: string): Promise<User | null> {
  try {
    const users = await query(`SELECT * FROM users WHERE email = $1`, [email])

    if (users.length === 0) return null

    const user = users[0]
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      avatarUrl: user.avatar_url,
    }
  } catch (error) {
    console.error("Error fetching user by email:", error)
    throw new Error("Failed to fetch user")
  }
}

export async function createUserInDB(userData: {
  username: string
  email: string
  fullName: string
  phoneNumber?: string | null
  password: string
  role?: string
}): Promise<User> {
  try {
    // Hash the password before storing
    const hashedPassword = await hashPassword(userData.password)
    
    const userResult = await query(
      `INSERT INTO users (username, email, full_name, phone_number, password, role)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userData.username, userData.email, userData.fullName, userData.phoneNumber || null, hashedPassword, userData.role || "user"],
    )

    const user = userResult[0]
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      avatarUrl: user.avatar_url,
    }
  } catch (error) {
    console.error("Error creating user:", error)
    throw new Error("Failed to create user")
  }
}

export async function getAllUsersFromDB(): Promise<User[]> {
  try {
    const users = await query(
      `SELECT id, username, email, full_name, role, avatar_url, profile_photo, phone_number
         FROM users
        ORDER BY COALESCE(NULLIF(full_name, ''), username) ASC`,
    )

    return users.map((user: any) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name || "",
      role: user.role,
      avatarUrl: user.avatar_url,
      profilePhoto: user.profile_photo,
      phoneNumber: user.phone_number,
    }))
  } catch (error) {
    console.error("Error fetching users:", error)
    throw new Error("Failed to fetch users")
  }
}