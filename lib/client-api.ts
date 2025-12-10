// Client-side data fetching functions for API calls

import { Team, Match, Tournament } from "./static-data"

// Team functions
export async function getTeamsBySport(sport: string): Promise<Team[]> {
  try {
    const response = await fetch(`/api/teams/sport/${sport}`)
    if (!response.ok) {
      throw new Error('Failed to fetch teams')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching teams by sport:', error)
    return []
  }
}

export async function getAllTeams(): Promise<Team[]> {
  try {
    const response = await fetch('/api/teams')
    if (!response.ok) {
      throw new Error('Failed to fetch teams')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching all teams:', error)
    return []
  }
}

export async function getTeamById(id: string): Promise<Team | null> {
  try {
    const response = await fetch(`/api/teams/${id}`)
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to fetch team')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching team by ID:', error)
    return null
  }
}

// Match functions
export async function getMatchesByStatus(status: 'scheduled' | 'started' | 'live' | 'completed'): Promise<Match[]> {
  try {
    const response = await fetch(`/api/matches?status=${status}`)
    if (!response.ok) {
      throw new Error('Failed to fetch matches')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching matches by status:', error)
    return []
  }
}

export async function getMatchesBySport(sport: string): Promise<Match[]> {
  try {
    const response = await fetch(`/api/matches?sport=${sport}`)
    if (!response.ok) {
      throw new Error('Failed to fetch matches')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching matches by sport:', error)
    return []
  }
}

export async function getMatchById(id: string): Promise<Match | null> {
  try {
    const response = await fetch(`/api/matches/${id}`)
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to fetch match')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching match by ID:', error)
    return null
  }
}

// Create functions
export async function createTeam(teamData: {
  name: string
  sport: string
  logo?: string
  players: { userId: string; number?: number; position?: string }[]
}): Promise<Team> {
  const response = await fetch('/api/teams', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(teamData),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const message = errorData.error || 'Failed to create team'
    throw new Error(message)
  }

  return await response.json()
}

export async function createMatch(matchData: {
  sport: string
  homeTeamId: string
  awayTeamId: string
  date: string
  venue: string
  status?: string
}): Promise<Match> {
  const response = await fetch('/api/matches', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(matchData),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.details || errorData.error || 'Failed to create match'
    console.error('Match creation failed:', errorData)
    throw new Error(errorMessage)
  }

  return await response.json()
}

export async function updateMatchStatus(matchId: string, status: 'scheduled' | 'started' | 'live' | 'completed'): Promise<Match> {
  const response = await fetch(`/api/matches/${matchId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.details || errorData.error || 'Failed to update match status'
    console.error('Match status update failed:', errorData)
    throw new Error(errorMessage)
  }

  return await response.json()
}

export async function deleteMatch(matchId: string): Promise<void> {
  const response = await fetch(`/api/matches/${matchId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.error || 'Failed to delete match'
    console.error('Match deletion failed:', errorData)
    throw new Error(errorMessage)
  }

  return await response.json()
}

export async function updateMatchScore(matchId: string, score: any): Promise<Match> {
  const response = await fetch(`/api/matches/${matchId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ score }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.details || errorData.error || 'Failed to update match score'
    console.error('Match score update failed:', errorData)
    throw new Error(errorMessage)
  }

  return await response.json()
}

// Tournament functions
export async function createTournament(tournamentData: {
  name: string
  sport: string
  format: string
  bracketType: string
  startDate: string
  teams: string[]
  matches?: any[]
  teamLogos?: Record<string, string>
}): Promise<Tournament> {
  const response = await fetch('/api/tournaments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tournamentData),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.details || errorData.error || 'Failed to create tournament'
    console.error('Tournament creation failed:', errorData)
    throw new Error(errorMessage)
  }

  return await response.json()
}

// New tournament creation functions
export async function createTournamentBasic(name: string, sportsCount: number): Promise<Tournament> {
  const response = await fetch('/api/tournaments/create-basic', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, sportsCount }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.error || 'Failed to create tournament'
    throw new Error(errorMessage)
  }

  return await response.json()
}

export async function addTournamentSport(tournamentId: string, sport: string, displayOrder: number = 0) {
  const response = await fetch(`/api/tournaments/${tournamentId}/sports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sport, displayOrder }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to add sport')
  }

  return await response.json()
}

export async function getTournamentSports(tournamentId: string) {
  const response = await fetch(`/api/tournaments/${tournamentId}/sports`)
  if (!response.ok) {
    throw new Error('Failed to fetch tournament sports')
  }
  return await response.json()
}

export async function createTournamentGroup(
  tournamentId: string,
  tournamentSportId: string,
  groupName: string,
  sport: string,
  displayOrder: number = 0
) {
  const response = await fetch(`/api/tournaments/${tournamentId}/groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tournamentSportId, groupName, sport, displayOrder }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to create group')
  }

  return await response.json()
}

export async function getTournamentGroups(tournamentId: string, sport?: string) {
  const url = sport 
    ? `/api/tournaments/${tournamentId}/groups?sport=${encodeURIComponent(sport)}`
    : `/api/tournaments/${tournamentId}/groups`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch tournament groups')
  }
  return await response.json()
}

export async function addTeamToGroup(groupId: string, teamId: string, displayOrder: number = 0) {
  const response = await fetch(`/api/groups/${groupId}/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ teamId, displayOrder }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to add team to group')
  }

  return await response.json()
}

export async function removeTeamFromGroup(groupId: string, teamId: string) {
  const response = await fetch(`/api/groups/${groupId}/teams?teamId=${encodeURIComponent(teamId)}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to remove team from group')
  }

  return await response.json()
}

export async function getGroupTeams(groupId: string) {
  const response = await fetch(`/api/groups/${groupId}/teams`)
  if (!response.ok) {
    throw new Error('Failed to fetch group teams')
  }
  return await response.json()
}

export async function getGroupMatches(groupId: string) {
  const response = await fetch(`/api/groups/${groupId}/matches`)
  if (!response.ok) {
    throw new Error('Failed to fetch group matches')
  }
  return await response.json()
}

export async function createBracketNode(tournamentId: string, nodeData: any) {
  const response = await fetch(`/api/tournaments/${tournamentId}/bracket`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(nodeData),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to create bracket node')
  }

  return await response.json()
}

export async function updateBracketNode(tournamentId: string, nodeId: string, updates: any) {
  const response = await fetch(`/api/tournaments/${tournamentId}/bracket`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nodeId, ...updates }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to update bracket node')
  }

  return await response.json()
}

export async function getTournamentBracketNodes(tournamentId: string, groupId?: string) {
  const url = groupId
    ? `/api/tournaments/${tournamentId}/bracket?groupId=${encodeURIComponent(groupId)}`
    : `/api/tournaments/${tournamentId}/bracket`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch bracket nodes')
  }
  return await response.json()
}

export async function getAllTournaments(): Promise<Tournament[]> {
  try {
    const response = await fetch('/api/tournaments')
    if (!response.ok) {
      throw new Error('Failed to fetch tournaments')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching all tournaments:', error)
    return []
  }
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
  try {
    const response = await fetch(`/api/tournaments/${id}`)
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to fetch tournament')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching tournament by ID:', error)
    return null
  }
}

export async function updateTournament(id: string, updates: {
  name?: string
  status?: string
  matches?: any[]
  bracketConfig?: Record<string, any>
}): Promise<Tournament> {
  const response = await fetch(`/api/tournaments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    throw new Error('Failed to update tournament')
  }

  return await response.json()
}

export async function deleteTournament(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/tournaments/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete tournament')
    }
  } catch (error) {
    console.error('Error deleting tournament:', error)
    throw error
  }
}