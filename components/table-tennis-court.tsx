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
      <div className="relative w-full max-w-4xl mx-auto">
        {/* Team names outside the court with border styling */}
        <div className="flex justify-between items-center mb-4 px-8">
          <div className="relative">
            <div className="bg-red-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg border-4 border-white text-lg">
              {homeTeam.name}
            </div>
          </div>
          <div className="relative">
            <div className="bg-yellow-500 text-blue-900 font-bold px-6 py-3 rounded-lg shadow-lg border-4 border-white text-lg">
              {awayTeam.name}
            </div>
          </div>
        </div>

        <div className="relative w-full h-[400px] bg-gradient-to-b from-slate-700 to-slate-900 rounded-xl p-8 shadow-2xl">
          {/* Match indicator for team structure */}
          {hasTeamMatchStructure && matches[currentMatch] && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white text-blue-700 px-4 py-1.5 rounded-full font-bold text-sm z-30 shadow-lg">
              Match {currentMatch + 1} of 3 - Set {currentSetInMatch + 1}
            </div>
          )}
          
          {/* Table outline - Official dark blue/green surface */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] bg-[#1a4d2e] rounded border-[6px] border-white shadow-2xl">
            {/* Net (Black with white tape on top) */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-black z-20">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-1.5 bg-white"></div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-1.5 bg-white"></div>
            </div>

            {/* Center line (white line down the middle) */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[2px] h-full bg-white/40 z-10"></div>

            {/* Home side (left) */}
            <div className="absolute top-0 left-0 w-1/2 h-full">
              {currentIsDoubles ? (
                <>
                  {/* Player 1 */}
                  <div className="absolute top-[30%] left-[30%] transform -translate-x-1/2 -translate-y-1/2">
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
                        <div className="text-[10px]">
                          {hasTeamMatchStructure && matches[currentMatch]?.homePlayerIds[0]
                            ? getPlayerNameById(matches[currentMatch].homePlayerIds[0])
                            : getPlayerName(homeTeam, 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Player 2 */}
                  <div className="absolute top-[70%] left-[30%] transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="font-bold text-lg">
                          {hasTeamMatchStructure && matches[currentMatch]?.homePlayerIds[1]
                            ? getPlayerNumberById(matches[currentMatch].homePlayerIds[1])
                            : getPlayerNumber(homeTeam, 1)}
                        </div>
                        <div className="text-[10px]">
                          {hasTeamMatchStructure && matches[currentMatch]?.homePlayerIds[1]
                            ? getPlayerNameById(matches[currentMatch].homePlayerIds[1])
                            : getPlayerName(homeTeam, 1)}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute top-1/2 left-[30%] transform -translate-x-1/2 -translate-y-1/2">
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
                  <div className="absolute top-[30%] right-[30%] transform translate-x-1/2 -translate-y-1/2">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center 
                      ${servingPlayer === "away" ? "bg-yellow-500 ring-4 ring-yellow-400" : "bg-yellow-500"}`}
                    >
                      <div className="text-center text-blue-900">
                        <div className="font-bold text-lg">
                          {hasTeamMatchStructure && matches[currentMatch]?.awayPlayerIds[0]
                            ? getPlayerNumberById(matches[currentMatch].awayPlayerIds[0])
                            : getPlayerNumber(awayTeam, 0)}
                        </div>
                        <div className="text-[10px]">
                          {hasTeamMatchStructure && matches[currentMatch]?.awayPlayerIds[0]
                            ? getPlayerNameById(matches[currentMatch].awayPlayerIds[0])
                            : getPlayerName(awayTeam, 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Player 2 */}
                  <div className="absolute top-[70%] right-[30%] transform translate-x-1/2 -translate-y-1/2">
                    <div className="w-14 h-14 rounded-full bg-yellow-500 flex items-center justify-center">
                      <div className="text-center text-blue-900">
                        <div className="font-bold text-lg">
                          {hasTeamMatchStructure && matches[currentMatch]?.awayPlayerIds[1]
                            ? getPlayerNumberById(matches[currentMatch].awayPlayerIds[1])
                            : getPlayerNumber(awayTeam, 1)}
                        </div>
                        <div className="text-[10px]">
                          {hasTeamMatchStructure && matches[currentMatch]?.awayPlayerIds[1]
                            ? getPlayerNameById(matches[currentMatch].awayPlayerIds[1])
                            : getPlayerName(awayTeam, 1)}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute top-1/2 right-[30%] transform translate-x-1/2 -translate-y-1/2">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center 
                    ${servingPlayer === "away" ? "bg-yellow-500 ring-4 ring-yellow-400" : "bg-yellow-500"}`}
                  >
                    <div className="text-center text-blue-900">
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
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg"></div>
          </div>

          {/* Score display */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-8 py-3 rounded-full font-bold flex items-center gap-4 text-2xl shadow-xl z-30">
            <span className={servingPlayer === "home" ? "text-yellow-400" : ""}>{currentScore.home}</span>
            <span className="text-gray-400">-</span>
            <span className={servingPlayer === "away" ? "text-yellow-400" : ""}>{currentScore.away}</span>
          </div>

          {/* Set indicator */}
          {!hasTeamMatchStructure && (
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white text-blue-700 px-4 py-1.5 rounded-full font-bold text-sm shadow-lg z-30">
              Set {currentSet + 1}
            </div>
          )}

          {/* Match type indicator */}
          <div className="absolute bottom-6 right-6 bg-white/90 text-blue-700 px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            {currentIsDoubles ? "Doubles" : "Singles"}
          </div>
        </div>

        {/* Set scores */}
        <div className="flex justify-center gap-2 mt-4">
          {sets.map((set, index) => (
            <Badge key={index} className={`${index === currentSet ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"} px-4 py-1 text-base font-bold`}>
              {set.home}-{set.away}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
