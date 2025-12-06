import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAdmin } from "@/lib/authorization"

// POST - Create chess games after toss
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck) {
    return adminCheck
  }

  try {
    const { id: matchId } = await params
    const body = await request.json()
    const { numberOfGames, whiteTeamId } = body

    // Get match details to get team players
    const matchResult = await query(
      `SELECT m.*, 
        ht.id as home_team_id,
        at.id as away_team_id
       FROM matches m
       JOIN teams ht ON m.home_team_id = ht.id
       JOIN teams at ON m.away_team_id = at.id
       WHERE m.id = $1`,
      [matchId]
    )

    if (!matchResult || matchResult.length === 0) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    const match = matchResult[0]
    const homeTeamId = match.home_team_id
    const awayTeamId = match.away_team_id

    // Get players from both teams
    const homePlayersResult = await query(
      `SELECT id, name FROM players WHERE team_id = $1 ORDER BY number`,
      [homeTeamId]
    )
    const awayPlayersResult = await query(
      `SELECT id, name FROM players WHERE team_id = $1 ORDER BY number`,
      [awayTeamId]
    )

    const homePlayers = homePlayersResult || []
    const awayPlayers = awayPlayersResult || []

    // Determine which team plays white
    const whiteTeamPlayers = whiteTeamId === homeTeamId ? homePlayers : awayPlayers
    const blackTeamPlayers = whiteTeamId === homeTeamId ? awayPlayers : homePlayers

    // Create games - alternate colors for multiple games
    const games = []
    for (let i = 0; i < numberOfGames; i++) {
      const whitePlayerIndex = Math.min(i, whiteTeamPlayers.length - 1)
      const blackPlayerIndex = Math.min(i, blackTeamPlayers.length - 1)

      // Alternate who plays white in each game
      const isWhiteTurn = i % 2 === 0
      const whitePlayerId = isWhiteTurn
        ? whiteTeamPlayers[whitePlayerIndex]?.id
        : blackTeamPlayers[blackPlayerIndex]?.id
      const blackPlayerId = isWhiteTurn
        ? blackTeamPlayers[blackPlayerIndex]?.id
        : whiteTeamPlayers[whitePlayerIndex]?.id

      if (whitePlayerId && blackPlayerId) {
        games.push({
          gameNumber: i + 1,
          whitePlayerId,
          blackPlayerId,
          result: "ongoing",
        })
      }
    }

    // Save games to match score
    const scoreData = {
      games: games.map((g) => ({
        player1: g.whitePlayerId,
        player2: g.blackPlayerId,
        result: g.result,
      })),
      teamScore: {
        home: 0,
        away: 0,
      },
    }

    await query(
      `UPDATE matches SET score = $1 WHERE id = $2`,
      [JSON.stringify(scoreData), matchId]
    )

    return NextResponse.json({ games: scoreData.games }, { status: 201 })
  } catch (error) {
    console.error("Error creating chess games:", error)
    return NextResponse.json(
      { error: "Failed to create chess games" },
      { status: 500 }
    )
  }
}

