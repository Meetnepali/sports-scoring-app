export type VolleyballPosition = "Setter" | "Outside Hitter" | "Middle Blocker" | "Opposite" | "Libero"

export type VolleyballPlayer = {
  id: string
  name: string
  number: number
  position: VolleyballPosition
  isOnCourt: boolean
  courtPosition?: number // 1-6 position on court
}

export type VolleyballTeam = {
  id: string
  name: string
  players: VolleyballPlayer[]
  currentServer?: string // player ID of current server
}

export type VolleyballMatchConfig = {
  id?: string
  matchId: string
  numberOfSets: 3 | 5 // Best of 3 or Best of 5
  tossWinnerTeamId?: string
  tossDecision?: "court_side" | "serve"
  selectedCourtSide?: "home" | "away"
  servingTeam?: "home" | "away"
  configCompleted: boolean
}

export type VolleyballScore = {
  sets: { home: number; away: number }[]
  currentSet: number
  homeTeam: VolleyballTeam
  awayTeam: VolleyballTeam
  servingTeam: "home" | "away" // which team is currently serving
  lastServingTeam?: "home" | "away" // track last serving team to detect rotation
  numberOfSets?: 3 | 5 // Best of 3 or Best of 5
}

// Helper function to check if a player is a libero
export function isLibero(player: VolleyballPlayer): boolean {
  return player.position === "Libero"
}

// Helper function to check if a position is front row
export function isFrontRowPosition(position: number): boolean {
  return position === 2 || position === 3 || position === 4
}

// Helper function to check if a position is back row
export function isBackRowPosition(position: number): boolean {
  return position === 1 || position === 5 || position === 6
}

// Helper function to validate libero position assignment
export function canLiberoPlayPosition(position: number): boolean {
  return isBackRowPosition(position)
}
