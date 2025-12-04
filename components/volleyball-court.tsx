"use client"

import { useState } from "react"
import type { VolleyballTeam, VolleyballPlayer } from "@/lib/volleyball-types"
import { isLibero, canLiberoPlayPosition, isFrontRowPosition } from "@/lib/volleyball-types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface VolleyballCourtProps {
  homeTeam: VolleyballTeam
  awayTeam: VolleyballTeam
  servingTeam: "home" | "away"
  onUpdateHomeTeam: (team: VolleyballTeam) => void
  onUpdateAwayTeam: (team: VolleyballTeam) => void
  onChangeServe: (team: "home" | "away") => void
}

export default function VolleyballCourt({
  homeTeam,
  awayTeam,
  servingTeam,
  onUpdateHomeTeam,
  onUpdateAwayTeam,
  onChangeServe,
}: VolleyballCourtProps) {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away" | null>(null)
  const [substituteDialogOpen, setSubstituteDialogOpen] = useState(false)
  const [substituteTeam, setSubstituteTeam] = useState<"home" | "away" | null>(null)
  const [benchPlayerToSub, setBenchPlayerToSub] = useState<VolleyballPlayer | null>(null)
  const { toast } = useToast()

  // Get player at a specific court position
  const getPlayerAtPosition = (team: VolleyballTeam, position: number): VolleyballPlayer | undefined => {
    return team.players.find((player) => player.isOnCourt && player.courtPosition === position)
  }

  // Get bench player (7th player not on court, excluding libero if they're already on court)
  const getBenchPlayer = (team: VolleyballTeam): VolleyballPlayer | undefined => {
    const onCourtCount = team.players.filter(p => p.isOnCourt).length
    if (onCourtCount >= 6) {
      // Find the first player not on court
      return team.players.find(p => !p.isOnCourt)
    }
    return undefined
  }

  // Get players on court for substitution selection
  const getPlayersOnCourt = (team: VolleyballTeam): VolleyballPlayer[] => {
    return team.players.filter(p => p.isOnCourt && p.courtPosition !== undefined)
  }

  // Handle substitution
  const handleSubstitution = (team: "home" | "away", benchPlayer: VolleyballPlayer, courtPlayer: VolleyballPlayer) => {
    const teamData = team === "home" ? homeTeam : awayTeam
    const updatedTeam = { ...teamData }
    
    // Check libero restrictions
    if (isLibero(benchPlayer) && courtPlayer.courtPosition !== undefined) {
      if (!canLiberoPlayPosition(courtPlayer.courtPosition)) {
        toast({
          title: "Libero Restriction",
          description: `Libero players cannot play in front row positions (2, 3, 4). Please select a back row position (1, 5, 6).`,
          variant: "destructive",
        })
        return
      }
    }
    
    // Swap positions
    const benchPlayerIndex = updatedTeam.players.findIndex(p => p.id === benchPlayer.id)
    const courtPlayerIndex = updatedTeam.players.findIndex(p => p.id === courtPlayer.id)
    
    if (benchPlayerIndex !== -1 && courtPlayerIndex !== -1) {
      // Bench player goes to court
      updatedTeam.players[benchPlayerIndex].isOnCourt = true
      updatedTeam.players[benchPlayerIndex].courtPosition = courtPlayer.courtPosition
      
      // Court player goes to bench
      updatedTeam.players[courtPlayerIndex].isOnCourt = false
      updatedTeam.players[courtPlayerIndex].courtPosition = undefined
    }
    
    if (team === "home") {
      onUpdateHomeTeam(updatedTeam)
    } else {
      onUpdateAwayTeam(updatedTeam)
    }
    
    setSubstituteDialogOpen(false)
    setBenchPlayerToSub(null)
    setSubstituteTeam(null)
    
    toast({
      title: "Substitution Complete",
      description: `${benchPlayer.name} replaced ${courtPlayer.name}`,
    })
  }

  // Update player position
  const updatePlayerPosition = (team: "home" | "away", playerId: string, position: number) => {
    const teamData = team === "home" ? homeTeam : awayTeam
    const playerToPlace = teamData.players.find((p) => p.id === playerId)
    
    // Check libero restrictions
    if (playerToPlace && isLibero(playerToPlace)) {
      if (!canLiberoPlayPosition(position)) {
        toast({
          title: "Libero Restriction",
          description: `Libero players cannot play in front row positions (2, 3, 4). Please select a back row position (1, 5, 6).`,
          variant: "destructive",
        })
        return
      }
    }
    
    if (team === "home") {
      const updatedTeam = { ...homeTeam }

      // Clear any player currently in this position
      updatedTeam.players.forEach((player) => {
        if (player.courtPosition === position) {
          player.courtPosition = undefined
        }
      })

      // Assign the new player to this position
      const playerIndex = updatedTeam.players.findIndex((p) => p.id === playerId)
      if (playerIndex !== -1) {
        updatedTeam.players[playerIndex].courtPosition = position
        updatedTeam.players[playerIndex].isOnCourt = true
      }

      onUpdateHomeTeam(updatedTeam)
    } else {
      const updatedTeam = { ...awayTeam }

      // Clear any player currently in this position
      updatedTeam.players.forEach((player) => {
        if (player.courtPosition === position) {
          player.courtPosition = undefined
        }
      })

      // Assign the new player to this position
      const playerIndex = updatedTeam.players.findIndex((p) => p.id === playerId)
      if (playerIndex !== -1) {
        updatedTeam.players[playerIndex].courtPosition = position
        updatedTeam.players[playerIndex].isOnCourt = true
      }

      onUpdateAwayTeam(updatedTeam)
    }
  }

  // Set player as server
  const setPlayerAsServer = (team: "home" | "away", playerId: string) => {
    if (team === "home") {
      const updatedTeam = { ...homeTeam, currentServer: playerId }
      onUpdateHomeTeam(updatedTeam)
    } else {
      const updatedTeam = { ...awayTeam, currentServer: playerId }
      onUpdateAwayTeam(updatedTeam)
    }
    onChangeServe(team)
  }

  // Open substitution dialog
  const openSubstituteDialog = (team: "home" | "away", benchPlayer: VolleyballPlayer) => {
    setBenchPlayerToSub(benchPlayer)
    setSubstituteTeam(team)
    setSubstituteDialogOpen(true)
  }

  // Render a position circle with player info
  const renderPosition = (team: "home" | "away", position: number) => {
    const teamData = team === "home" ? homeTeam : awayTeam
    const player = getPlayerAtPosition(teamData, position)
    const isServer = player && teamData.currentServer === player.id && servingTeam === team
    const isPlayerLibero = player && isLibero(player)

    return (
      <div className="flex flex-col items-center">
        <div
          className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center cursor-pointer transition-all
            ${isPlayerLibero 
              ? "bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800" 
              : team === "home" 
                ? "bg-red-500 hover:bg-red-600" 
                : "bg-blue-500 hover:bg-blue-600"
            }
            ${isServer ? "ring-4 ring-yellow-400 shadow-lg shadow-yellow-400/50" : ""}
            ${selectedPosition === position && selectedTeam === team ? "ring-2 ring-white" : ""}
          `}
          onClick={() => {
            setSelectedPosition(position)
            setSelectedTeam(team)
          }}
        >
          {player ? (
            <div className="text-center text-white">
              <div className="font-bold text-xl sm:text-2xl leading-tight">{player.number}</div>
              <div className="text-[9px] sm:text-[10px] leading-tight opacity-90 font-semibold">
                {isPlayerLibero ? "LIB" : player.position.substring(0, 3).toUpperCase()}
              </div>
            </div>
          ) : (
            <div className="text-white font-bold text-xl sm:text-2xl">{position}</div>
          )}
          {isServer && (
            <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] sm:text-xs">
              🏐
            </div>
          )}
          {isPlayerLibero && (
            <div className="absolute -bottom-1 -left-1 w-5 h-5 sm:w-6 sm:h-6 bg-purple-300 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-purple-800">
              L
            </div>
          )}
        </div>
        {player && (
          <div className={`mt-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold text-white shadow-md
            ${isPlayerLibero 
              ? "bg-purple-600" 
              : team === "home" 
                ? "bg-red-700" 
                : "bg-blue-700"
            }
          `}>
            {player.name.split(' ')[0]}
          </div>
        )}
      </div>
    )
  }

  // Render bench player (7th player outside court)
  const renderBenchPlayer = (team: "home" | "away") => {
    const teamData = team === "home" ? homeTeam : awayTeam
    const benchPlayer = getBenchPlayer(teamData)
    
    if (!benchPlayer) return null
    
    const isPlayerLibero = isLibero(benchPlayer)
    
    return (
      <div 
        className="flex flex-col items-center cursor-pointer group"
        onClick={() => openSubstituteDialog(team, benchPlayer)}
      >
        <div className="text-[10px] font-semibold text-gray-600 mb-1">BENCH</div>
        <div
          className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all border-2 border-dashed
            ${isPlayerLibero 
              ? "bg-purple-400/80 border-purple-600 group-hover:bg-purple-500" 
              : team === "home" 
                ? "bg-red-400/80 border-red-600 group-hover:bg-red-500" 
                : "bg-blue-400/80 border-blue-600 group-hover:bg-blue-500"
            }
          `}
        >
          <div className="text-center text-white">
            <div className="font-bold text-lg sm:text-xl leading-tight">{benchPlayer.number}</div>
            <div className="text-[8px] sm:text-[9px] leading-tight opacity-90 font-semibold">
              {isPlayerLibero ? "LIB" : benchPlayer.position.substring(0, 3).toUpperCase()}
            </div>
          </div>
          {isPlayerLibero && (
            <div className="absolute -bottom-1 -left-1 w-4 h-4 sm:w-5 sm:h-5 bg-purple-300 rounded-full flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-purple-800">
              L
            </div>
          )}
        </div>
        <div className={`mt-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold text-white shadow-md
          ${isPlayerLibero 
            ? "bg-purple-600" 
            : team === "home" 
              ? "bg-red-700" 
              : "bg-blue-700"
          }
        `}>
          {benchPlayer.name.split(' ')[0]}
        </div>
        <div className="mt-1 text-[9px] text-gray-500 group-hover:text-gray-700">Click to Sub</div>
      </div>
    )
  }

  const homeBenchPlayer = getBenchPlayer(homeTeam)
  const awayBenchPlayer = getBenchPlayer(awayTeam)

  return (
    <div className="w-full mb-8">
      <div className="relative w-full max-w-6xl mx-auto">
        {/* Main court container with bench areas */}
        <div className="flex items-center justify-center gap-4">
          {/* Home bench player (left side, outside court) */}
          <div className="flex-shrink-0 w-20 sm:w-24">
            {renderBenchPlayer("home")}
          </div>

          {/* Court */}
          <div className="relative flex-1 max-w-4xl h-[500px] sm:h-[550px] bg-gradient-to-b from-orange-200 to-orange-300 rounded-lg shadow-2xl overflow-visible">
            {/* Court outline */}
            <div className="absolute top-4 left-4 right-4 bottom-4 bg-gradient-to-b from-orange-100 to-orange-200 rounded-lg border-4 border-white shadow-inner">
              {/* Center Net Line (Black) */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-800 z-20"></div>
              
              {/* Net visualization */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-full z-10">
                <div className="absolute inset-0 bg-gray-700 opacity-80"></div>
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="absolute w-full h-[1px] bg-gray-600 opacity-40" style={{ top: `${i * 5}%` }}></div>
                ))}
              </div>

              {/* Attack lines (3-meter lines) */}
              <div className="absolute top-0 left-[30%] w-[2px] h-full bg-white opacity-70"></div>
              <div className="absolute top-0 right-[30%] w-[2px] h-full bg-white opacity-70"></div>

              {/* Home court (left side) - RED TEAM */}
              <div className="absolute top-0 left-0 w-1/2 h-full">
                {/* Team label - at the end of court (left edge) */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 -rotate-90 bg-red-600 text-white px-4 py-1.5 rounded-full font-bold shadow-lg z-30 text-xs sm:text-sm whitespace-nowrap">
                  {homeTeam.name}
                </div>

                {/* Position 4 - Front Left */}
                <div className="absolute" style={{ top: '18%', left: '20%' }}>
                  {renderPosition("home", 4)}
                </div>

                {/* Position 3 - Front Middle */}
                <div className="absolute" style={{ top: '18%', left: '55%' }}>
                  {renderPosition("home", 3)}
                </div>

                {/* Position 2 - Middle Right (closer to net but not overlapping) */}
                <div className="absolute" style={{ top: '45%', left: '55%' }}>
                  {renderPosition("home", 2)}
                </div>

                {/* Position 1 - Back Right (Server position) */}
                <div className="absolute" style={{ top: '72%', left: '55%' }}>
                  {renderPosition("home", 1)}
                </div>

                {/* Position 6 - Back Middle */}
                <div className="absolute" style={{ top: '72%', left: '20%' }}>
                  {renderPosition("home", 6)}
                </div>

                {/* Position 5 - Middle Left */}
                <div className="absolute" style={{ top: '45%', left: '20%' }}>
                  {renderPosition("home", 5)}
                </div>
              </div>

              {/* Away court (right side) - BLUE TEAM */}
              <div className="absolute top-0 right-0 w-1/2 h-full">
                {/* Team label - at the end of court (right edge) */}
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 rotate-90 bg-blue-600 text-white px-4 py-1.5 rounded-full font-bold shadow-lg z-30 text-xs sm:text-sm whitespace-nowrap">
                  {awayTeam.name}
                </div>

                {/* Position 4 - Front Left (from their perspective, our right) */}
                <div className="absolute" style={{ top: '18%', right: '20%' }}>
                  {renderPosition("away", 4)}
                </div>

                {/* Position 3 - Front Middle */}
                <div className="absolute" style={{ top: '18%', right: '55%' }}>
                  {renderPosition("away", 3)}
                </div>

                {/* Position 2 - Middle Right */}
                <div className="absolute" style={{ top: '45%', right: '55%' }}>
                  {renderPosition("away", 2)}
                </div>

                {/* Position 1 - Back Right */}
                <div className="absolute" style={{ top: '72%', right: '55%' }}>
                  {renderPosition("away", 1)}
                </div>

                {/* Position 6 - Back Middle */}
                <div className="absolute" style={{ top: '72%', right: '20%' }}>
                  {renderPosition("away", 6)}
                </div>

                {/* Position 5 - Middle Left */}
                <div className="absolute" style={{ top: '45%', right: '20%' }}>
                  {renderPosition("away", 5)}
                </div>
              </div>
            </div>

            {/* Serving indicator */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-30">
              <div className="bg-yellow-400 text-black px-4 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></div>
                {servingTeam === "home" ? homeTeam.name : awayTeam.name} Serving
              </div>
            </div>
          </div>

          {/* Away bench player (right side, outside court) */}
          <div className="flex-shrink-0 w-20 sm:w-24">
            {renderBenchPlayer("away")}
          </div>
        </div>
      </div>

      {/* Player selection panel */}
      {selectedPosition !== null && selectedTeam !== null && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-4xl mx-auto">
          <h3 className="font-bold mb-2 text-sm">
            Select Player for Position {selectedPosition} ({selectedTeam === "home" ? homeTeam.name : awayTeam.name})
          </h3>
          <div className="flex gap-4 flex-wrap">
            <Select
              onValueChange={(value) => updatePlayerPosition(selectedTeam, value, selectedPosition)}
              value={getPlayerAtPosition(selectedTeam === "home" ? homeTeam : awayTeam, selectedPosition)?.id || ""}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select player" />
              </SelectTrigger>
              <SelectContent>
                {(selectedTeam === "home" ? homeTeam : awayTeam).players.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    #{player.number} {player.name} ({player.position})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="default"
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
              onClick={() => {
                const player = getPlayerAtPosition(selectedTeam === "home" ? homeTeam : awayTeam, selectedPosition)
                if (player) {
                  setPlayerAsServer(selectedTeam, player.id)
                }
              }}
            >
              Set as Server
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPosition(null)
                setSelectedTeam(null)
              }}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Substitution Dialog */}
      <Dialog open={substituteDialogOpen} onOpenChange={setSubstituteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Substitute Player</DialogTitle>
            <DialogDescription>
              Select which player on court to replace with {benchPlayerToSub?.name} (#{benchPlayerToSub?.number})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {substituteTeam && getPlayersOnCourt(substituteTeam === "home" ? homeTeam : awayTeam).map((player) => {
              const isPlayerLibero = isLibero(player)
              const benchIsLibero = benchPlayerToSub && isLibero(benchPlayerToSub)
              
              // If bench player is libero, only show back row positions
              if (benchIsLibero && player.courtPosition !== undefined && isFrontRowPosition(player.courtPosition)) {
                return null
              }
              
              return (
                <Button
                  key={player.id}
                  variant="outline"
                  className={`justify-start h-auto py-3 ${
                    isPlayerLibero ? "border-purple-400" : ""
                  }`}
                  onClick={() => {
                    if (benchPlayerToSub && substituteTeam) {
                      handleSubstitution(substituteTeam, benchPlayerToSub, player)
                    }
                  }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white font-bold
                    ${isPlayerLibero 
                      ? "bg-purple-500" 
                      : substituteTeam === "home" 
                        ? "bg-red-500" 
                        : "bg-blue-500"
                    }
                  `}>
                    {player.number}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">{player.name}</div>
                    <div className="text-xs text-gray-500">
                      Position {player.courtPosition} • {player.position}
                      {isPlayerLibero && " (Libero)"}
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setSubstituteDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
