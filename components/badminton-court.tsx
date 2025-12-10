"use client"

import { Badge } from "@/components/ui/badge"

interface BadmintonCourtProps {
  homeTeam: any
  awayTeam: any
  servingPlayer: "home" | "away"
  currentGame: number
  games: { home: number; away: number }[]
  isDoubles?: boolean
  matches?: any[] // Team match structure
  currentMatch?: number
  currentSet?: number
}

export default function BadmintonCourt({
  homeTeam,
  awayTeam,
  servingPlayer,
  currentGame,
  games,
  isDoubles = false,
  matches,
  currentMatch = 0,
  currentSet = 0,
}: BadmintonCourtProps) {
  // Check if we have team match structure
  const hasTeamMatchStructure = matches && Array.isArray(matches) && matches.length > 0
  
  // Get current score
  const currentScore = hasTeamMatchStructure 
    ? (matches[currentMatch]?.sets[currentSet] || { home: 0, away: 0 })
    : (games[currentGame] || { home: 0, away: 0 })

  // Get player names by ID for team match structure
  const getPlayerNameById = (playerId: string) => {
    const allPlayers = [...homeTeam.players, ...awayTeam.players]
    const player = allPlayers.find(p => p.id === playerId)
    return player?.name?.split(" ")[0] || "Unknown"
  }

  // Get player number by ID for team match structure
  const getPlayerNumberById = (playerId: string) => {
    const allPlayers = [...homeTeam.players, ...awayTeam.players]
    const player = allPlayers.find(p => p.id === playerId)
    return player?.number || 0
  }

  // Get player names (fallback for old structure)
  const getPlayerName = (team: any, index: number) => {
    return team.players[index]?.name?.split(" ")[0] || `Player ${index + 1}`
  }

  // Get player numbers (fallback for old structure)
  const getPlayerNumber = (team: any, index: number) => {
    return team.players[index]?.number || index + 1
  }

  // Determine if current match is doubles
  const currentIsDoubles = hasTeamMatchStructure 
    ? matches[currentMatch]?.type === "doubles"
    : isDoubles

  return (
    <div className="w-full mb-8">
      <div className="relative w-full max-w-3xl mx-auto h-[400px] bg-green-800 rounded-lg p-4 overflow-hidden">
        {/* Match indicator for team structure */}
        {hasTeamMatchStructure && matches[currentMatch] && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white text-green-700 px-4 py-1.5 rounded-full font-bold text-sm z-30 shadow-lg">
            Match {currentMatch + 1} of 3 - Set {currentSet + 1}
          </div>
        )}
        
        {/* Court outline */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[85%] h-[90%] bg-green-600 rounded-lg border-4 border-white">
          {/* Net (Black) */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-full bg-black z-20"></div>

          {/* Outer court lines (Doubles lines) - Bright white */}
          <div className="absolute top-[8%] left-[8%] w-[84%] h-[84%] border-[3px] border-white"></div>

          {/* Inner court lines (Singles lines) - Bright white */}
          <div className="absolute top-[8%] left-[15%] w-[70%] h-[84%] border-[3px] border-white border-l-transparent border-r-transparent"></div>
          <div className="absolute top-[8%] left-[15%] w-[70%] h-[84%]">
            <div className="absolute top-0 left-0 w-[3px] h-full bg-white"></div>
            <div className="absolute top-0 right-0 w-[3px] h-full bg-white"></div>
          </div>

          {/* Service lines (Short service line and Long service line) */}
          <div className="absolute top-[30%] left-[8%] w-[42%] h-[3px] bg-white"></div>
          <div className="absolute top-[30%] right-[8%] w-[42%] h-[3px] bg-white"></div>
          <div className="absolute top-[70%] left-[8%] w-[42%] h-[3px] bg-white"></div>
          <div className="absolute top-[70%] right-[8%] w-[42%] h-[3px] bg-white"></div>

          {/* Center service line */}
          <div className="absolute top-[30%] left-1/2 transform -translate-x-1/2 w-[3px] h-[40%] bg-white"></div>

          {/* Home side (left) */}
          {currentIsDoubles ? (
            <>
              {/* Player 1 - front */}
              <div className="absolute top-[30%] left-[25%] transform -translate-x-1/2 -translate-y-1/2">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center 
                  ${servingPlayer === "home" ? "bg-red-600 ring-4 ring-yellow-400" : "bg-red-600"}`}
                >
                  <div className="text-center text-white">
                    <div className="font-bold text-lg">
                      {hasTeamMatchStructure && matches[currentMatch]?.homePlayerIds[0]
                        ? getPlayerNumberById(matches[currentMatch].homePlayerIds[0])
                        : getPlayerNumber(homeTeam, 0)}
                    </div>
                    <div className="text-xs">
                      {hasTeamMatchStructure && matches[currentMatch]?.homePlayerIds[0]
                        ? getPlayerNameById(matches[currentMatch].homePlayerIds[0])
                        : getPlayerName(homeTeam, 0)}
                    </div>
                  </div>
                </div>
              </div>
              {/* Player 2 - back */}
              <div className="absolute top-[70%] left-[25%] transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="font-bold text-lg">
                      {hasTeamMatchStructure && matches[currentMatch]?.homePlayerIds[1]
                        ? getPlayerNumberById(matches[currentMatch].homePlayerIds[1])
                        : getPlayerNumber(homeTeam, 1)}
                    </div>
                    <div className="text-xs">
                      {hasTeamMatchStructure && matches[currentMatch]?.homePlayerIds[1]
                        ? getPlayerNameById(matches[currentMatch].homePlayerIds[1])
                        : getPlayerName(homeTeam, 1)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute top-1/2 left-[25%] transform -translate-x-1/2 -translate-y-1/2">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center 
                ${servingPlayer === "home" ? "bg-red-600 ring-4 ring-yellow-400" : "bg-red-600"}`}
              >
                <div className="text-center text-white">
                  <div className="font-bold text-xl">
                    {hasTeamMatchStructure && matches[currentMatch]?.homePlayerIds[0]
                      ? getPlayerNumberById(matches[currentMatch].homePlayerIds[0])
                      : getPlayerNumber(homeTeam, 0)}
                  </div>
                  <div className="text-xs">
                    {hasTeamMatchStructure && matches[currentMatch]?.homePlayerIds[0]
                      ? getPlayerNameById(matches[currentMatch].homePlayerIds[0])
                      : getPlayerName(homeTeam, 0)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Away side (right) */}
          {currentIsDoubles ? (
            <>
              {/* Player 1 - front */}
              <div className="absolute top-[30%] right-[25%] transform translate-x-1/2 -translate-y-1/2">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center 
                  ${servingPlayer === "away" ? "bg-blue-600 ring-4 ring-yellow-400" : "bg-blue-600"}`}
                >
                  <div className="text-center text-white">
                    <div className="font-bold text-lg">
                      {hasTeamMatchStructure && matches[currentMatch]?.awayPlayerIds[0]
                        ? getPlayerNumberById(matches[currentMatch].awayPlayerIds[0])
                        : getPlayerNumber(awayTeam, 0)}
                    </div>
                    <div className="text-xs">
                      {hasTeamMatchStructure && matches[currentMatch]?.awayPlayerIds[0]
                        ? getPlayerNameById(matches[currentMatch].awayPlayerIds[0])
                        : getPlayerName(awayTeam, 0)}
                    </div>
                  </div>
                </div>
              </div>
              {/* Player 2 - back */}
              <div className="absolute top-[70%] right-[25%] transform translate-x-1/2 -translate-y-1/2">
                <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="font-bold text-lg">
                      {hasTeamMatchStructure && matches[currentMatch]?.awayPlayerIds[1]
                        ? getPlayerNumberById(matches[currentMatch].awayPlayerIds[1])
                        : getPlayerNumber(awayTeam, 1)}
                    </div>
                    <div className="text-xs">
                      {hasTeamMatchStructure && matches[currentMatch]?.awayPlayerIds[1]
                        ? getPlayerNameById(matches[currentMatch].awayPlayerIds[1])
                        : getPlayerName(awayTeam, 1)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute top-1/2 right-[25%] transform translate-x-1/2 -translate-y-1/2">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center 
                ${servingPlayer === "away" ? "bg-blue-600 ring-4 ring-yellow-400" : "bg-blue-600"}`}
              >
                <div className="text-center text-white">
                  <div className="font-bold text-xl">
                    {hasTeamMatchStructure && matches[currentMatch]?.awayPlayerIds[0]
                      ? getPlayerNumberById(matches[currentMatch].awayPlayerIds[0])
                      : getPlayerNumber(awayTeam, 0)}
                  </div>
                  <div className="text-xs">
                    {hasTeamMatchStructure && matches[currentMatch]?.awayPlayerIds[0]
                      ? getPlayerNameById(matches[currentMatch].awayPlayerIds[0])
                      : getPlayerName(awayTeam, 0)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shuttlecock */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4">
            <div className="w-4 h-4 bg-white rounded-full"></div>
            <div
              className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full w-0 h-0 
              border-l-[4px] border-r-[4px] border-b-[6px] 
              border-l-transparent border-r-transparent border-b-white"
            ></div>
          </div>
        </div>

        {/* Score display */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-6 py-2 rounded-full font-bold flex items-center gap-4">
          <span className={servingPlayer === "home" ? "text-yellow-400" : ""}>{currentScore.home}</span>
          <span>-</span>
          <span className={servingPlayer === "away" ? "text-yellow-400" : ""}>{currentScore.away}</span>
        </div>

        {/* Team names */}
        <div className="absolute top-2 left-4 text-white font-bold">{homeTeam.name}</div>
        <div className="absolute top-2 right-4 text-white font-bold">{awayTeam.name}</div>

        {/* Game indicator */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-white text-green-700 px-3 py-1 rounded-full font-bold text-sm">
          Game {currentGame + 1}
        </div>

        {/* Match type indicator */}
        <div className="absolute bottom-4 right-4 bg-white bg-opacity-70 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
          {isDoubles ? "Doubles" : "Singles"}
        </div>
      </div>

      {/* Game scores */}
      <div className="flex justify-center gap-2 mt-2">
        {games.map((game, index) => (
          <Badge key={index} className={`${index === currentGame ? "bg-green-500 text-white" : "bg-gray-100"} px-3`}>
            {game.home}-{game.away}
          </Badge>
        ))}
      </div>
    </div>
  )
}
