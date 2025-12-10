"use client"

import { Badge } from "@/components/ui/badge"

interface TableTennisCourtProps {
  homeTeam: any
  awayTeam: any
  servingPlayer: "home" | "away"
  currentSet: number
  sets: { home: number; away: number }[]
  isDoubles?: boolean
  matches?: any[] // Team match structure
  currentMatch?: number
  currentSetInMatch?: number
}

export default function TableTennisCourt({
  homeTeam,
  awayTeam,
  servingPlayer,
  currentSet,
  sets,
  isDoubles = false,
  matches,
  currentMatch = 0,
  currentSetInMatch = 0,
}: TableTennisCourtProps) {
  // Check if we have team match structure
  const hasTeamMatchStructure = matches && Array.isArray(matches) && matches.length > 0
  
  // Get current score
  const currentScore = hasTeamMatchStructure 
    ? (matches[currentMatch]?.sets[currentSetInMatch] || { home: 0, away: 0 })
    : (sets[currentSet] || { home: 0, away: 0 })

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
      <div className="relative w-full max-w-3xl mx-auto h-[320px] bg-blue-700 rounded-lg p-4 overflow-hidden">
        {/* Match indicator for team structure */}
        {hasTeamMatchStructure && matches[currentMatch] && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white text-blue-700 px-4 py-1.5 rounded-full font-bold text-sm z-30 shadow-lg">
            Match {currentMatch + 1} of 3 - Set {currentSetInMatch + 1}
          </div>
        )}
        
        {/* Table outline */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[75%] h-[85%] bg-blue-500 rounded-lg border-4 border-white">
          {/* Net (Black) */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-full bg-black z-20 flex items-center justify-center">
            <div className="absolute w-[95%] h-[6px] bg-black"></div>
          </div>

          {/* Center line for doubles - vertical white line */}
          {isDoubles && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[3px] h-full bg-white"></div>
          )}

          {/* Side lines - edge lines */}
          <div className="absolute top-0 left-0 w-full h-full border-4 border-white rounded-lg"></div>

          {/* End lines already covered by border */}

          {/* Home side (left) */}
          <div className="absolute top-0 left-0 w-1/2 h-full">
            {currentIsDoubles ? (
              <>
                {/* Player 1 */}
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
                {/* Player 2 */}
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
          </div>

          {/* Away side (right) */}
          <div className="absolute top-0 right-0 w-1/2 h-full">
            {currentIsDoubles ? (
              <>
                {/* Player 1 */}
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
                {/* Player 2 */}
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
          </div>

          {/* Ping pong ball */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md"></div>
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

        {/* Set indicator */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-white text-blue-700 px-3 py-1 rounded-full font-bold text-sm">
          Set {currentSet + 1}
        </div>

        {/* Match type indicator */}
        <div className="absolute bottom-4 right-4 bg-white bg-opacity-70 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
          {isDoubles ? "Doubles" : "Singles"}
        </div>
      </div>

      {/* Set scores */}
      <div className="flex justify-center gap-2 mt-2">
        {sets.map((set, index) => (
          <Badge key={index} className={`${index === currentSet ? "bg-blue-500 text-white" : "bg-gray-100"} px-3`}>
            {set.home}-{set.away}
          </Badge>
        ))}
      </div>
    </div>
  )
}
