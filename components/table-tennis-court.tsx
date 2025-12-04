"use client"

import { Badge } from "@/components/ui/badge"

interface TableTennisCourtProps {
  homeTeam: any
  awayTeam: any
  servingPlayer: "home" | "away"
  currentSet: number
  sets: { home: number; away: number }[]
  isDoubles?: boolean
}

export default function TableTennisCourt({
  homeTeam,
  awayTeam,
  servingPlayer,
  currentSet,
  sets,
  isDoubles = false,
}: TableTennisCourtProps) {
  // Get current score
  const currentScore = sets[currentSet] || { home: 0, away: 0 }

  // Get player names
  const getPlayerName = (team: any, index: number) => {
    return team.players[index]?.name?.split(" ")[0] || `Player ${index + 1}`
  }

  // Get player numbers
  const getPlayerNumber = (team: any, index: number) => {
    return team.players[index]?.number || index + 1
  }

  return (
    <div className="w-full mb-8">
      <div className="relative w-full h-[300px] bg-blue-700 rounded-lg p-4 overflow-hidden">
        {/* Table outline */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] h-[80%] bg-blue-500 rounded-lg border-4 border-white">
          {/* Net */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-white z-10 flex items-center justify-center">
            <div className="absolute w-[90%] h-[6px] bg-white"></div>
          </div>

          {/* Center line - vertical */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[2px] h-full bg-white opacity-30"></div>

          {/* Doubles service line (if doubles) */}
          {isDoubles && (
            <>
              <div className="absolute top-1/2 left-0 w-1/2 h-[2px] bg-white opacity-30"></div>
              <div className="absolute top-1/2 right-0 w-1/2 h-[2px] bg-white opacity-30"></div>
            </>
          )}

          {/* Home side (left) */}
          <div className="absolute top-0 left-0 w-1/2 h-full">
            {isDoubles ? (
              <>
                {/* Player 1 */}
                <div className="absolute top-[30%] left-[25%] transform -translate-x-1/2 -translate-y-1/2">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center 
                    ${servingPlayer === "home" ? "bg-red-600 ring-4 ring-yellow-400" : "bg-red-600"}`}
                  >
                    <div className="text-center text-white">
                      <div className="font-bold text-lg">{getPlayerNumber(homeTeam, 0)}</div>
                      <div className="text-xs">{getPlayerName(homeTeam, 0)}</div>
                    </div>
                  </div>
                </div>
                {/* Player 2 */}
                <div className="absolute top-[70%] left-[25%] transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="font-bold text-lg">{getPlayerNumber(homeTeam, 1)}</div>
                      <div className="text-xs">{getPlayerName(homeTeam, 1)}</div>
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
                    <div className="font-bold text-xl">{getPlayerNumber(homeTeam, 0)}</div>
                    <div className="text-xs">{getPlayerName(homeTeam, 0)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Away side (right) */}
          <div className="absolute top-0 right-0 w-1/2 h-full">
            {isDoubles ? (
              <>
                {/* Player 1 */}
                <div className="absolute top-[30%] right-[25%] transform translate-x-1/2 -translate-y-1/2">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center 
                    ${servingPlayer === "away" ? "bg-blue-600 ring-4 ring-yellow-400" : "bg-blue-600"}`}
                  >
                    <div className="text-center text-white">
                      <div className="font-bold text-lg">{getPlayerNumber(awayTeam, 0)}</div>
                      <div className="text-xs">{getPlayerName(awayTeam, 0)}</div>
                    </div>
                  </div>
                </div>
                {/* Player 2 */}
                <div className="absolute top-[70%] right-[25%] transform translate-x-1/2 -translate-y-1/2">
                  <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="font-bold text-lg">{getPlayerNumber(awayTeam, 1)}</div>
                      <div className="text-xs">{getPlayerName(awayTeam, 1)}</div>
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
                    <div className="font-bold text-xl">{getPlayerNumber(awayTeam, 0)}</div>
                    <div className="text-xs">{getPlayerName(awayTeam, 0)}</div>
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
