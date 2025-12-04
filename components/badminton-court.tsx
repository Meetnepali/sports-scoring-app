"use client"

import { Badge } from "@/components/ui/badge"

interface BadmintonCourtProps {
  homeTeam: any
  awayTeam: any
  servingPlayer: "home" | "away"
  currentGame: number
  games: { home: number; away: number }[]
  isDoubles?: boolean
}

export default function BadmintonCourt({
  homeTeam,
  awayTeam,
  servingPlayer,
  currentGame,
  games,
  isDoubles = false,
}: BadmintonCourtProps) {
  // Get current score
  const currentScore = games[currentGame] || { home: 0, away: 0 }

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
      <div className="relative w-full h-[350px] bg-green-800 rounded-lg p-4 overflow-hidden">
        {/* Court outline */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] h-[80%] bg-green-600 rounded-lg border-2 border-white">
          {/* Net */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-white z-10"></div>

          {/* Court lines */}
          <div className="absolute top-[15%] left-[10%] w-[80%] h-[70%] border-2 border-white"></div>

          {/* Service courts */}
          <div className="absolute top-[15%] left-[10%] w-[40%] h-[35%] border-r-2 border-b-2 border-white"></div>
          <div className="absolute top-[15%] right-[10%] w-[40%] h-[35%] border-l-2 border-b-2 border-white"></div>
          <div className="absolute top-[50%] left-[10%] w-[40%] h-[35%] border-r-2 border-t-2 border-white"></div>
          <div className="absolute top-[50%] right-[10%] w-[40%] h-[35%] border-l-2 border-t-2 border-white"></div>

          {/* Center line - vertical */}
          <div className="absolute top-[15%] left-1/2 transform -translate-x-1/2 w-[2px] h-[70%] bg-white opacity-30"></div>

          {/* Home side (left) */}
          {isDoubles ? (
            <>
              {/* Player 1 - front */}
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
              {/* Player 2 - back */}
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

          {/* Away side (right) */}
          {isDoubles ? (
            <>
              {/* Player 1 - front */}
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
              {/* Player 2 - back */}
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
