// Static data for the app (client-side safe)

export type Team = {
  id: string
  name: string
  sport: string
  logo?: string
  players: Player[]
}

export type Player = {
  id: string
  name: string
  number?: number
  position?: string
  isOnCourt?: boolean
  courtPosition?: number
  phoneNumber?: string
  profilePhoto?: string
}

export type Match = {
  id: string
  sport: string
  homeTeam: Team
  awayTeam: Team
  date: string
  venue: string
  status: "scheduled" | "started" | "live" | "completed"
  score?: any // Different structure based on sport
  tournamentId?: string // Tournament this match belongs to
  groupId?: string // Group this match belongs to
}

export type Tournament = {
  id: string
  name: string
  sport?: string // Optional for backward compatibility
  format: string
  bracketType: string
  status: string
  startDate: string
  teams?: string[] // Optional - deprecated, use groups instead
  matches?: any[] // Optional - deprecated, use bracketNodes instead
  teamLogos?: Record<string, string>
  sportsCount?: number
  bracketConfig?: Record<string, any>
}

// New tournament structure types
export type TournamentSport = {
  id: string
  tournamentId: string
  sport: string
  displayOrder: number
  createdAt?: string
}

export type TournamentGroup = {
  id: string
  tournamentId: string
  tournamentSportId: string
  groupName: string
  sport: string
  displayOrder: number
  createdAt?: string
  teams?: GroupTeam[] // Populated when fetched with teams
}

export type GroupTeam = {
  id: string
  groupId: string
  teamId: string
  displayOrder: number
  createdAt?: string
  team?: Team // Populated when fetched with team details
}

export type GroupMatch = {
  id: string
  groupId: string
  team1Id: string
  team2Id: string
  team1Score?: any
  team2Score?: any
  winnerId?: string
  matchDate?: string
  status: string
  matchId?: string // Link to global matches table
  matchNumber?: number // Sequence within group
  createdAt?: string
  updatedAt?: string
}

export type GroupStanding = {
  id: string
  groupId: string
  teamId: string
  matchesPlayed: number
  wins: number
  losses: number
  draws: number
  points: number
  pointsFor: number
  pointsAgainst: number
  pointsDifference: number
  createdAt?: string
  updatedAt?: string
  team?: Team // Populated when fetched with team details
}

export type BracketNode = {
  id: string
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
  score?: { team1?: number; team2?: number } | any
  matchDate?: string
  nodeData?: {
    color?: string
    x?: number
    y?: number
    backgroundColor?: string
    [key: string]: any
  }
  createdAt?: string
  updatedAt?: string
}

export type User = {
  id: string
  username: string
  email: string
  fullName: string
  role: string
  avatarUrl?: string
  profilePhoto?: string
  phoneNumber?: string
}

// Cricket Teams
export const cricketTeams: Team[] = [
  {
    id: "cri-team-1",
    name: "Royal Challengers",
    sport: "cricket",
    players: [
      { id: "p1", name: "Virat Kohli", number: 18 },
      { id: "p2", name: "AB de Villiers", number: 17 },
      { id: "p3", name: "Glenn Maxwell", number: 32 },
      { id: "p4", name: "Mohammed Siraj", number: 73 },
      { id: "p5", name: "Yuzvendra Chahal", number: 3 },
      { id: "p6", name: "Devdutt Padikkal", number: 37 },
      { id: "p7", name: "Washington Sundar", number: 55 },
      { id: "p8", name: "Navdeep Saini", number: 96 },
      { id: "p9", name: "Kane Richardson", number: 12 },
      { id: "p10", name: "Adam Zampa", number: 88 },
      { id: "p11", name: "Josh Philippe", number: 22 },
    ],
  },
  {
    id: "cri-team-2",
    name: "Mumbai Indians",
    sport: "cricket",
    players: [
      { id: "p12", name: "Rohit Sharma", number: 45 },
      { id: "p13", name: "Jasprit Bumrah", number: 93 },
      { id: "p14", name: "Hardik Pandya", number: 33 },
      { id: "p15", name: "Kieron Pollard", number: 55 },
      { id: "p16", name: "Quinton de Kock", number: 12 },
      { id: "p17", name: "Suryakumar Yadav", number: 63 },
      { id: "p18", name: "Ishan Kishan", number: 32 },
      { id: "p19", name: "Trent Boult", number: 18 },
      { id: "p20", name: "Krunal Pandya", number: 24 },
      { id: "p21", name: "Rahul Chahar", number: 1 },
      { id: "p22", name: "Anmolpreet Singh", number: 4 },
    ],
  },
]

// Volleyball Teams
export const volleyballTeams: Team[] = [
  {
    id: "vol-team-1",
    name: "Thunderbolts",
    sport: "volleyball",
    players: [
      { id: "vp1", name: "John Smith", number: 1, position: "Setter" },
      { id: "vp2", name: "Michael Johnson", number: 2, position: "Outside Hitter" },
      { id: "vp3", name: "David Lee", number: 3, position: "Middle Blocker" },
      { id: "vp4", name: "Robert Brown", number: 4, position: "Opposite" },
      { id: "vp5", name: "James Wilson", number: 5, position: "Outside Hitter" },
      { id: "vp6", name: "William Davis", number: 6, position: "Middle Blocker" },
      { id: "vp7", name: "Richard Miller", number: 7, position: "Libero" },
    ],
  },
  {
    id: "vol-team-2",
    name: "Skyliners",
    sport: "volleyball",
    players: [
      { id: "vp8", name: "Thomas Moore", number: 8, position: "Setter" },
      { id: "vp9", name: "Charles Taylor", number: 9, position: "Outside Hitter" },
      { id: "vp10", name: "Daniel Anderson", number: 10, position: "Middle Blocker" },
      { id: "vp11", name: "Matthew Jackson", number: 11, position: "Opposite" },
      { id: "vp12", name: "Anthony White", number: 12, position: "Outside Hitter" },
      { id: "vp13", name: "Mark Harris", number: 13, position: "Middle Blocker" },
      { id: "vp14", name: "Paul Martin", number: 14, position: "Libero" },
    ],
  },
]

// Chess Players
export const chessTeams: Team[] = [
  {
    id: "chess-team-1",
    name: "Grandmasters",
    sport: "chess",
    players: [
      { id: "cp1", name: "Magnus Carlsen" },
      { id: "cp2", name: "Fabiano Caruana" },
      { id: "cp3", name: "Ding Liren" },
      { id: "cp4", name: "Ian Nepomniachtchi" },
    ],
  },
  {
    id: "chess-team-2",
    name: "Strategists",
    sport: "chess",
    players: [
      { id: "cp5", name: "Hikaru Nakamura" },
      { id: "cp6", name: "Levon Aronian" },
      { id: "cp7", name: "Wesley So" },
      { id: "cp8", name: "Anish Giri" },
    ],
  },
]

// Futsal Teams
export const futsalTeams: Team[] = [
  {
    id: "fut-team-1",
    name: "Urban Kickers",
    sport: "futsal",
    players: [
      { id: "fp1", name: "Carlos Silva", number: 1, position: "Goalkeeper" },
      { id: "fp2", name: "Rodrigo Mendes", number: 2, position: "Defender" },
      { id: "fp3", name: "Felipe Santos", number: 3, position: "Winger" },
      { id: "fp4", name: "Lucas Oliveira", number: 4, position: "Pivot" },
      { id: "fp5", name: "Gabriel Costa", number: 5, position: "Winger" },
    ],
  },
  {
    id: "fut-team-2",
    name: "Futsal Kings",
    sport: "futsal",
    players: [
      { id: "fp6", name: "Miguel Fernandez", number: 1, position: "Goalkeeper" },
      { id: "fp7", name: "Antonio Perez", number: 2, position: "Defender" },
      { id: "fp8", name: "Javier Lopez", number: 3, position: "Winger" },
      { id: "fp9", name: "Alejandro Martinez", number: 4, position: "Pivot" },
      { id: "fp10", name: "Diego Rodriguez", number: 5, position: "Winger" },
    ],
  },
]

// Table Tennis Teams
export const tableTennisTeams: Team[] = [
  {
    id: "tt-team-1",
    name: "Spin Masters",
    sport: "table-tennis",
    players: [
      { id: "ttp1", name: "Liu Yang", number: 1 },
      { id: "ttp2", name: "Wang Wei", number: 2 },
      { id: "ttp3", name: "Zhang Min", number: 3 },
      { id: "ttp4", name: "Li Jie", number: 4 },
    ],
  },
  {
    id: "tt-team-2",
    name: "Paddle Pros",
    sport: "table-tennis",
    players: [
      { id: "ttp5", name: "John Smith", number: 1 },
      { id: "ttp6", name: "Michael Brown", number: 2 },
      { id: "ttp7", name: "David Jones", number: 3 },
      { id: "ttp8", name: "Robert Wilson", number: 4 },
    ],
  },
]

// Badminton Teams
export const badmintonTeams: Team[] = [
  {
    id: "bad-team-1",
    name: "Shuttlers",
    sport: "badminton",
    players: [
      { id: "bp1", name: "Lee Chong", number: 1 },
      { id: "bp2", name: "Lin Dan", number: 2 },
      { id: "bp3", name: "Chen Long", number: 3 },
      { id: "bp4", name: "Viktor Axelsen", number: 4 },
    ],
  },
  {
    id: "bad-team-2",
    name: "Racket Masters",
    sport: "badminton",
    players: [
      { id: "bp5", name: "Kento Momota", number: 1 },
      { id: "bp6", name: "Srikanth Kidambi", number: 2 },
      { id: "bp7", name: "Anders Antonsen", number: 3 },
      { id: "bp8", name: "Chou Tien Chen", number: 4 },
    ],
  },
]

// All teams combined
export const allTeams: Team[] = [
  ...cricketTeams,
  ...volleyballTeams,
  ...chessTeams,
  ...futsalTeams,
  ...tableTennisTeams,
  ...badmintonTeams,
]

// Client-side helper functions
export function getTeamsBySport(sport: string): Team[] {
  return allTeams.filter(team => team.sport === sport)
}

export function getTeamById(id: string): Team | undefined {
  return allTeams.find(team => team.id === id)
}

export function getAllTeams(): Team[] {
  return allTeams
}

// Match functions return static data for client-side use
export function getMatchesByStatus(status: "scheduled" | "live" | "completed"): Match[] {
  // This would normally fetch from API, but for now return empty array
  // to prevent the database import issue
  return []
}

export function getMatchesBySport(sport: string): Match[] {
  // This would normally fetch from API, but for now return empty array
  return []
}

export function getMatchById(id: string): Match | null {
  // This would normally fetch from API, but for now return null
  return null
}