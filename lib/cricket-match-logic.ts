// Cricket Match Flow Logic and Calculations

export interface CricketInningsData {
  runs: number
  wickets: number
  overs: number
  extras: {
    wides: number
    noBalls: number
    byes: number
    legByes: number
  }
}

export interface CricketMatchConfig {
  totalOvers: number
  maxOversPerBowler: number
  tossWinnerTeamId: string
  tossDecision: 'bat' | 'bowl'
  electedToBatFirstTeamId: string
}

export interface InningsCompletionCheck {
  isComplete: boolean
  reason?: 'all_out' | 'overs_complete' | 'target_chased' | 'target_impossible'
}

/**
 * Check if current innings is complete
 */
export function checkInningsComplete(
  inningsData: CricketInningsData,
  totalOvers: number,
  isSecondInnings: boolean,
  targetRuns?: number
): InningsCompletionCheck {
  // All wickets fallen (10 wickets)
  if (inningsData.wickets >= 10) {
    return { isComplete: true, reason: 'all_out' }
  }

  // All overs bowled
  if (inningsData.overs >= totalOvers) {
    return { isComplete: true, reason: 'overs_complete' }
  }

  // Second innings - target chased
  if (isSecondInnings && targetRuns !== undefined) {
    if (inningsData.runs > targetRuns) {
      return { isComplete: true, reason: 'target_chased' }
    }
    
    // Target impossible to achieve
    const ballsRemaining = (totalOvers - Math.floor(inningsData.overs)) * 6 - ((inningsData.overs % 1) * 10)
    const runsNeeded = targetRuns - inningsData.runs + 1
    
    // If runs needed > balls remaining * 6 (max runs per ball), target impossible
    if (runsNeeded > ballsRemaining * 6) {
      return { isComplete: true, reason: 'target_impossible' }
    }
  }

  return { isComplete: false }
}

/**
 * Calculate match winner
 */
export function calculateMatchWinner(
  innings1: CricketInningsData,
  innings2: CricketInningsData,
  team1Id: string,
  team2Id: string,
  electedToBatFirstTeamId: string
): {
  winnerId: string | null
  winMargin: string
  isTie: boolean
} {
  const battingFirstTeamId = electedToBatFirstTeamId
  const battingSecondTeamId = battingFirstTeamId === team1Id ? team2Id : team1Id
  
  const firstInningsRuns = innings1.runs
  const secondInningsRuns = innings2.runs

  // Tie
  if (firstInningsRuns === secondInningsRuns && innings2.wickets >= 10) {
    return {
      winnerId: null,
      winMargin: 'Match tied',
      isTie: true
    }
  }

  // Team batting first won
  if (firstInningsRuns > secondInningsRuns && (innings2.wickets >= 10 || innings2.overs >= innings1.overs)) {
    return {
      winnerId: battingFirstTeamId,
      winMargin: `${firstInningsRuns - secondInningsRuns} runs`,
      isTie: false
    }
  }

  // Team batting second won
  if (secondInningsRuns > firstInningsRuns) {
    const wicketsRemaining = 10 - innings2.wickets
    return {
      winnerId: battingSecondTeamId,
      winMargin: `${wicketsRemaining} wickets`,
      isTie: false
    }
  }

  // Match still in progress
  return {
    winnerId: null,
    winMargin: '',
    isTie: false
  }
}

/**
 * Convert total balls to overs format (e.g., 25 balls = 4.1 overs)
 */
export function ballsToOvers(balls: number): number {
  const wholeOvers = Math.floor(balls / 6)
  const remainingBalls = balls % 6
  return wholeOvers + remainingBalls / 10
}

/**
 * Convert overs to total balls (e.g., 4.1 overs = 25 balls)
 */
export function oversToTotalBalls(overs: number): number {
  const wholeOvers = Math.floor(overs)
  const balls = Math.round((overs % 1) * 10)
  return wholeOvers * 6 + balls
}

/**
 * Calculate strike rate (runs per 100 balls)
 */
export function calculateStrikeRate(runs: number, balls: number): number {
  if (balls === 0) return 0
  return (runs / balls) * 100
}

/**
 * Calculate economy rate (runs per over)
 */
export function calculateEconomyRate(runs: number, overs: number): number {
  if (overs === 0) return 0
  const totalBalls = oversToTotalBalls(overs)
  const actualOvers = totalBalls / 6
  return runs / actualOvers
}

/**
 * Calculate current run rate (runs per over)
 */
export function calculateRunRate(runs: number, overs: number): number {
  if (overs === 0) return 0
  const totalBalls = oversToTotalBalls(overs)
  const actualOvers = totalBalls / 6
  return runs / actualOvers
}

/**
 * Calculate required run rate for chasing team
 */
export function calculateRequiredRunRate(
  targetRuns: number,
  currentRuns: number,
  currentOvers: number,
  totalOvers: number
): number {
  const runsNeeded = targetRuns - currentRuns + 1
  const oversRemaining = totalOvers - currentOvers
  
  if (oversRemaining <= 0) return 0
  return runsNeeded / oversRemaining
}

/**
 * Check if bowler has reached over limit
 */
export function checkBowlerOverLimit(
  bowlerOvers: number,
  maxOversPerBowler: number
): boolean {
  return bowlerOvers >= maxOversPerBowler
}

/**
 * Format overs for display (e.g., 4.1 overs displayed as "4.1")
 */
export function formatOvers(overs: number): string {
  const wholeOvers = Math.floor(overs)
  const balls = Math.round((overs % 1) * 10)
  return `${wholeOvers}.${balls}`
}

/**
 * Get innings status message
 */
export function getInningsStatusMessage(
  check: InningsCompletionCheck,
  inningsData: CricketInningsData
): string {
  if (!check.isComplete) return 'In progress'
  
  switch (check.reason) {
    case 'all_out':
      return `All out for ${inningsData.runs} (${formatOvers(inningsData.overs)} overs)`
    case 'overs_complete':
      return `${inningsData.runs}/${inningsData.wickets} (${formatOvers(inningsData.overs)} overs)`
    case 'target_chased':
      return `Target chased in ${formatOvers(inningsData.overs)} overs`
    case 'target_impossible':
      return `Target impossible to achieve`
    default:
      return 'Innings complete'
  }
}

/**
 * Suggest man of the match based on performance
 */
export function suggestManOfMatch(
  battingStats: Array<{ playerId: string; runs: number; balls: number; wickets?: number }>,
  bowlingStats: Array<{ playerId: string; wickets: number; runs: number; overs: number }>
): { playerId: string; reason: string } | null {
  if (battingStats.length === 0 && bowlingStats.length === 0) return null

  let bestPlayer: { playerId: string; score: number; reason: string } | null = null

  // Evaluate batsmen (runs + strike rate consideration)
  for (const bat of battingStats) {
    const strikeRate = calculateStrikeRate(bat.runs, bat.balls)
    const score = bat.runs + (strikeRate > 100 ? bat.runs * 0.1 : 0) // Bonus for high SR
    
    if (!bestPlayer || score > bestPlayer.score) {
      bestPlayer = {
        playerId: bat.playerId,
        score,
        reason: `${bat.runs} runs off ${bat.balls} balls (SR: ${strikeRate.toFixed(2)})`
      }
    }
  }

  // Evaluate bowlers (wickets are more valuable)
  for (const bowl of bowlingStats) {
    const economy = calculateEconomyRate(bowl.runs, bowl.overs)
    const score = bowl.wickets * 30 + (economy < 6 ? 20 : 0) // Wickets highly valued, bonus for good economy
    
    if (!bestPlayer || score > bestPlayer.score) {
      bestPlayer = {
        playerId: bowl.playerId,
        score,
        reason: `${bowl.wickets} wickets for ${bowl.runs} runs (Economy: ${economy.toFixed(2)})`
      }
    }
  }

  return bestPlayer ? { playerId: bestPlayer.playerId, reason: bestPlayer.reason } : null
}

