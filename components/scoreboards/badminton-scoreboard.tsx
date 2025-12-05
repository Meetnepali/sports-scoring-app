"use client"

import React, { useState, useEffect } from "react"
import type { Match } from "@/lib/static-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PlusCircle, MinusCircle, RotateCw, Users, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import BadmintonCourt from "@/components/badminton-court"
import { TossConfigurationDialog } from "@/components/badminton/toss-configuration-dialog"
import { useAuth } from "@/lib/auth-context"

interface BadmintonScoreboardProps {
  match: Match
}

export default function BadmintonScoreboard({ match }: BadmintonScoreboardProps) {
  const { toast } = useToast()
  const { isAdmin } = useAuth()
  // Default configuration (will be updated from config)
  const defaultGamesToWin = 2
  const defaultPointsToWin = 21
  const defaultTotalGames = 3 // Best of 3
  
  const initialScore = match.score ? {
    games: Array.isArray(match.score.games) ? match.score.games.map((game: any) => ({
      home: Number(game.home) || 0,
      away: Number(game.away) || 0,
      type: game.type || "singles" // singles or doubles
    })) : Array.from({ length: defaultTotalGames }, () => ({ home: 0, away: 0, type: "singles" })),
    currentGame: Number(match.score.currentGame) || 0,
    servingPlayer: match.score.servingPlayer || "home",
    pointsToWin: Number(match.score.pointsToWin) || defaultPointsToWin,
    gamesToWin: Number(match.score.gamesToWin) || defaultGamesToWin,
    isDoubles: match.score.isDoubles || false,
  } : {
    games: Array.from({ length: defaultTotalGames }, () => ({ home: 0, away: 0, type: "singles" })),
    currentGame: 0,
    servingPlayer: "home",
    pointsToWin: defaultPointsToWin,
    gamesToWin: defaultGamesToWin,
    isDoubles: false,
  }

  const [score, setScore] = useState(initialScore)
  const [currentGame, setCurrentGame] = useState(Number(score.currentGame) || 0)
  const [servingPlayer, setServingPlayer] = useState(score.servingPlayer)
  const [isDoubles, setIsDoubles] = useState(score.isDoubles || false)
  const [showAnimation, setShowAnimation] = useState<{ team: "home" | "away"; value: number } | null>(null)
  const [showWinnerDialog, setShowWinnerDialog] = useState(false)
  const [winnerInfo, setWinnerInfo] = useState<{ team: "home" | "away"; name: string; gamesWon: number; gamesLost: number } | null>(null)
  const [badmintonConfig, setBadmintonConfig] = useState<any>(null)
  const [showTossDialog, setShowTossDialog] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [showGameTypeDialog, setShowGameTypeDialog] = useState(false)

  // Fetch badminton configuration on mount and when match status changes
  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoadingConfig(true)
        const response = await fetch(`/api/matches/${match.id}/badminton/config`)
        const data = await response.json()
        
        if (data.config) {
          setBadmintonConfig(data.config)
          
          // Initialize serving player from config if available
          if (data.config.servingTeam) {
            setServingPlayer(data.config.servingTeam)
            setScore((prev: any) => ({
              ...prev,
              servingPlayer: data.config.servingTeam,
            }))
          }
          
          // Initialize games and points configuration from config if available
          if (data.config.gamesToWin || data.config.pointsToWinPerGame) {
            setScore((prev: any) => {
              const gamesToWin = data.config.gamesToWin || prev.gamesToWin || 2
              const pointsToWin = data.config.pointsToWinPerGame || prev.pointsToWin || 21
              const totalGames = gamesToWin === 2 ? 3 : 5
              // Ensure we have the correct number of games
              let games = prev.games || []
              if (games.length !== totalGames) {
                games = Array.from({ length: totalGames }, (_, i) => games[i] || { home: 0, away: 0, type: "singles" })
              }
              // Ensure all games have type field
              games = games.map((game: any) => ({
                ...game,
                type: game.type || "singles"
              }))
              return {
                ...prev,
                games,
                gamesToWin,
                pointsToWin,
              }
            })
          }
          
          // Show toss dialog if match is started/live and config not completed (only for admins)
          if (isAdmin && (match.status === "started" || match.status === "live") && !data.config.configCompleted) {
            setShowTossDialog(true)
          }
        } else if (isAdmin && match.status === "started" || match.status === "live") {
          // Match is started/live but no config exists - show dialog (only for admins)
          setShowTossDialog(true)
        }
      } catch (error) {
        console.error("Error fetching badminton config:", error)
      } finally {
        setLoadingConfig(false)
      }
    }

    fetchConfig()
  }, [match.id, match.status])
  
  // Watch for match status changes (when match is started) - only for admins
  useEffect(() => {
    if (isAdmin && (match.status === "started" || match.status === "live") && !loadingConfig && badmintonConfig && !badmintonConfig.configCompleted) {
      setShowTossDialog(true)
    }
  }, [match.status, loadingConfig, badmintonConfig, isAdmin])

  // Sync local state with match prop changes (for live updates)
  useEffect(() => {
    if (match.score) {
      const newScore = {
        games: Array.isArray(match.score.games) ? match.score.games.map((game: any) => ({
          home: Number(game.home) || 0,
          away: Number(game.away) || 0,
          type: game.type || "singles"
        })) : score.games,
        currentGame: Number(match.score.currentGame) ?? score.currentGame,
        servingPlayer: match.score.servingPlayer || score.servingPlayer,
        pointsToWin: Number(match.score.pointsToWin) || score.pointsToWin,
        gamesToWin: Number(match.score.gamesToWin) || score.gamesToWin,
        isDoubles: match.score.isDoubles ?? score.isDoubles,
      }
      
      // Only update if score actually changed (avoid unnecessary updates)
      if (JSON.stringify(newScore.games) !== JSON.stringify(score.games) ||
          newScore.currentGame !== score.currentGame ||
          newScore.servingPlayer !== score.servingPlayer) {
        setScore(newScore)
        setCurrentGame(newScore.currentGame)
        setServingPlayer(newScore.servingPlayer)
        setIsDoubles(newScore.isDoubles)
      }
    }
  }, [match.score, match.status])

  // Handle toss configuration completion
  const handleTossComplete = async (config: any) => {
    setBadmintonConfig((prev: any) => ({
      ...prev!,
      tossWinnerTeamId: config.tossWinnerTeamId,
      tossDecision: config.tossDecision,
      selectedCourtSide: config.selectedCourtSide,
      servingTeam: config.servingTeam,
      configCompleted: true,
    }))
    
    setScore((prev: any) => ({
      ...prev,
      servingPlayer: config.servingTeam,
    }))
    
    setServingPlayer(config.servingTeam)
    setShowTossDialog(false)
    
    // Update match status from "started" to "live" after toss is completed
    if (match.status === "started") {
      try {
        await fetch(`/api/matches/${match.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "live" }),
        })
        toast({
          title: "Toss Completed!",
          description: "Match is now live. You can begin scoring.",
        })
      } catch (error) {
        console.error("Error updating match status:", error)
        toast({
          title: "Toss Completed!",
          description: "You can now begin scoring",
        })
      }
    } else {
      toast({
        title: "Toss Completed!",
        description: "You can now begin scoring",
      })
    }
  }

  // Animation effect
  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setShowAnimation(null)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [showAnimation])

  // Update score for a team with official badminton rules
  const updateScore = (team: "home" | "away", amount: number) => {
    setScore((prevScore: any) => {
      const newGames = [...prevScore.games]
      const currentScore = Number(newGames[currentGame][team]) || 0
      const opponentTeam = team === "home" ? "away" : "home"
      const opponentScore = Number(newGames[currentGame][opponentTeam]) || 0

      if (currentScore + amount < 0) return prevScore

      newGames[currentGame] = {
        ...newGames[currentGame],
        [team]: currentScore + amount,
      }

      // Show animation for point
      if (amount > 0) {
        setShowAnimation({ team, value: amount })
      }

      // Switch server if the scoring team is not the serving team (rally point system)
      let newServingPlayer = servingPlayer
      if (amount > 0 && servingPlayer !== team) {
        newServingPlayer = team
        setServingPlayer(team)
      }

      const newScore = currentScore + amount
      const pointsToWin = prevScore.pointsToWin || badmintonConfig?.pointsToWinPerGame || 21
      const maxPoints = pointsToWin === 11 ? 15 : pointsToWin === 15 ? 19 : 30

      // Check if game is won (OFFICIAL RULES: First to pointsToWin, win by 2, max maxPoints)
      if (amount > 0) {
        if ((newScore >= pointsToWin && newScore - opponentScore >= 2) || newScore === maxPoints) {
          // GAME WON!
          const { homeWins, awayWins } = getGameWinsFromGames(newGames, pointsToWin)
          const gamesToWin = prevScore.gamesToWin || badmintonConfig?.gamesToWin || 2

          // Check if match is won (best of 3)
          if (homeWins >= gamesToWin || awayWins >= gamesToWin) {
            // MATCH COMPLETE - Call API to complete match
            const winnerId = team === "home" ? match.homeTeam.id : match.awayTeam.id
            const winnerName = team === "home" ? match.homeTeam.name : match.awayTeam.name
            const finalScore = {
              games: newGames,
              homeWins,
              awayWins,
              currentGame,
            }

            setTimeout(async () => {
              try {
                await fetch(`/api/matches/${match.id}/complete`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    score: finalScore,
                    winnerId: winnerId,
                  }),
                })

                await fetch(`/api/matches/${match.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "completed" }),
                })

                setWinnerInfo({
                  team,
                  name: winnerName,
                  gamesWon: team === "home" ? homeWins : awayWins,
                  gamesLost: team === "home" ? awayWins : homeWins,
                })
                setShowWinnerDialog(true)

                toast({
                  title: "🏸 Match Complete!",
                  description: `${winnerName} wins ${team === "home" ? homeWins : awayWins}-${team === "home" ? awayWins : homeWins}!`,
                })
              } catch (error) {
                console.error("Error completing match:", error)
                toast({
                  title: "Error",
                  description: "Failed to save match result",
                  variant: "destructive",
                })
              }
            }, 100)
          } else {
            // Move to next game
            const nextGame = currentGame + 1
            if (nextGame < newGames.length) {
              setTimeout(() => {
                // Check if next game has a type set, if not show dialog
                if (!newGames[nextGame]?.type) {
                  setCurrentGame(nextGame)
                  setServingPlayer(team) // Winner serves first in next game
                  setShowGameTypeDialog(true)
                } else {
                  setCurrentGame(nextGame)
                  setServingPlayer(team) // Winner serves first in next game
                  setIsDoubles(newGames[nextGame].type === "doubles")
                  alert(`Game ${currentGame + 1} complete! ${team === "home" ? match.homeTeam.name : match.awayTeam.name} wins ${newScore}-${opponentScore}. Moving to Game ${nextGame + 1}.`)
                }
              }, 500)
            }
          }
        }
      }

      return {
        ...prevScore,
        games: newGames,
        servingPlayer: newServingPlayer,
      }
    })
  }

  // Helper function to calculate game wins
  const getGameWinsFromGames = (games: any[], pointsToWin: number) => {
    let homeWins = 0
    let awayWins = 0
    const maxPoints = pointsToWin === 11 ? 15 : pointsToWin === 15 ? 19 : 30

    games.forEach((game: any) => {
      const homeScore = Number(game.home) || 0
      const awayScore = Number(game.away) || 0
      
      if ((homeScore >= pointsToWin && homeScore - awayScore >= 2) || homeScore === maxPoints) {
        homeWins++
      } else if ((awayScore >= pointsToWin && awayScore - homeScore >= 2) || awayScore === maxPoints) {
        awayWins++
      }
    })

    return { homeWins, awayWins }
  }

  // Toggle doubles mode
  const toggleDoublesMode = (enabled: boolean) => {
    setIsDoubles(enabled)
    setScore((prevScore: any) => {
      const newGames = [...prevScore.games]
      if (newGames[currentGame]) {
        newGames[currentGame] = {
          ...newGames[currentGame],
          type: enabled ? "doubles" : "singles"
        }
      }
      return {
        ...prevScore,
        isDoubles: enabled,
        games: newGames,
      }
    })
  }

  // Handle game type selection before starting a game
  const handleGameTypeSelect = (gameType: "singles" | "doubles") => {
    setScore((prevScore: any) => {
      const newGames = [...prevScore.games]
      const targetGameIndex = currentGame
      if (newGames[targetGameIndex]) {
        newGames[targetGameIndex] = {
          ...newGames[targetGameIndex],
          type: gameType
        }
      }
      return {
        ...prevScore,
        games: newGames,
      }
    })
    setIsDoubles(gameType === "doubles")
    setShowGameTypeDialog(false)
  }

  // Enable scoring if match is live (or was started and config is completed) and config is completed AND user is admin
  const canScore = isAdmin && (match.status === "live" || (match.status === "started" && badmintonConfig?.configCompleted)) && badmintonConfig?.configCompleted

  // Check if we need to ask for game type when switching to a game (only for admins)
  useEffect(() => {
    if (isAdmin && canScore && score.games[currentGame] && !score.games[currentGame].type) {
      setShowGameTypeDialog(true)
    } else if (canScore && score.games[currentGame]?.type) {
      setIsDoubles(score.games[currentGame].type === "doubles")
    }
  }, [currentGame, canScore, isAdmin])

  // Get game wins
  const getGameWins = () => {
    const pointsToWin = score.pointsToWin || badmintonConfig?.pointsToWinPerGame || 21
    return getGameWinsFromGames(score.games, pointsToWin)
  }

  const { homeWins, awayWins } = getGameWins()
  const gamesToWin = score.gamesToWin || badmintonConfig?.gamesToWin || 2
  const pointsToWin = score.pointsToWin || badmintonConfig?.pointsToWinPerGame || 21
  const maxPoints = pointsToWin === 11 ? 15 : pointsToWin === 15 ? 19 : 30
  const totalGames = gamesToWin === 2 ? 3 : 5
  const matchWinner = homeWins >= gamesToWin ? "home" : awayWins >= gamesToWin ? "away" : null

  // Show message if match is scheduled
  if (match.status === "scheduled") {
    return (
      <Card className="shadow-lg border-t-4 border-t-yellow-600">
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-center text-xl md:text-2xl">Badminton Scoreboard</CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600 text-lg">Match is scheduled. Start the match to begin configuration.</p>
        </CardContent>
      </Card>
    )
  }

  // Show message if config not completed (toss dialog will show automatically)
  if ((match.status === "started" || match.status === "live") && badmintonConfig && !badmintonConfig.configCompleted && !showTossDialog) {
    return (
      <Card className="shadow-lg border-t-4 border-t-yellow-600">
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-center text-xl md:text-2xl">Badminton Scoreboard</CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center space-y-4">
          <h3 className="text-xl font-bold mb-2">Toss Required</h3>
          <p className="text-gray-600 mb-4">Complete the toss to begin scoring</p>
          <Button 
            onClick={() => setShowTossDialog(true)} 
            className="mt-4"
          >
            Start Toss Configuration
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-t-4 border-t-yellow-600 relative">
      {/* Animation overlay */}
      {showAnimation && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div
            className={`animate-bounce ${
              showAnimation.team === "home" ? "bg-red-500" : "bg-blue-500"
            } text-white text-4xl font-bold rounded-full w-20 h-20 flex items-center justify-center`}
          >
            +{showAnimation.value}
          </div>
        </div>
      )}

      <CardHeader className="bg-gray-50">
        <CardTitle className="text-center text-xl md:text-2xl">Badminton Scoreboard</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="court" className="w-full">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'} rounded-none`}>
            <TabsTrigger value="court">Court</TabsTrigger>
            <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="controls" disabled={!canScore || matchWinner !== null}>
                Controls
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="court" className="p-4 space-y-6">
            <BadmintonCourt
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              servingPlayer={servingPlayer}
              currentGame={currentGame}
              games={score.games}
              isDoubles={isDoubles}
            />

            {/* Main Score Display */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <h3 className="font-semibold">{match.homeTeam.name}</h3>
                <div className="text-3xl font-bold">{homeWins}</div>
              </div>

              <div className="text-center">
                <h3 className="font-semibold">Games</h3>
                <div className="text-3xl font-bold">
                  {homeWins} - {awayWins}
                </div>
                {matchWinner && (
                  <Badge className={matchWinner === "home" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                    {matchWinner === "home" ? match.homeTeam.name : match.awayTeam.name} Wins!
                  </Badge>
                )}
              </div>

              <div className="text-center">
                <h3 className="font-semibold">{match.awayTeam.name}</h3>
                <div className="text-3xl font-bold">{awayWins}</div>
              </div>
            </div>

            {canScore && (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="font-semibold mb-4 text-center">{match.homeTeam.name}</h3>
                    <div className="text-center text-4xl font-bold mb-4">{score.games[currentGame].home}</div>
                    <div className="flex justify-center gap-4">
                      <Button variant="outline" size="icon" onClick={() => updateScore("home", -1)}>
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => updateScore("home", 1)}>
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="font-semibold mb-4 text-center">{match.awayTeam.name}</h3>
                    <div className="text-center text-4xl font-bold mb-4">{score.games[currentGame].away}</div>
                    <div className="flex justify-center gap-4">
                      <Button variant="outline" size="icon" onClick={() => updateScore("away", -1)}>
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => updateScore("away", 1)}>
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Game Information */}
                <div className="text-center mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Badge variant={score.games[currentGame]?.type === "doubles" ? "default" : "outline"}>
                      {score.games[currentGame]?.type === "doubles" ? "Doubles" : "Singles"}
                    </Badge>
                    {!isAdmin && (
                      <Badge variant="outline" className="bg-gray-100 text-gray-600">
                        Read-Only
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-yellow-900">
                    Game {currentGame + 1} of {totalGames} • First to {pointsToWin} points (win by 2, max {maxPoints})
                  </p>
                  {score.games[currentGame].home >= pointsToWin - 1 && score.games[currentGame].away >= pointsToWin - 1 && (
                    <p className="text-xs text-yellow-700 mt-1">
                      ⚡ Deuce! Win by 2 or first to {maxPoints} points
                    </p>
                  )}
                </div>
              </>
            )}
            {!isAdmin && (
              <div className="text-center mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 mr-2">Read-Only Mode</Badge>
                  You can view scores but cannot make changes. Admin access required to update scores.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scorecard" className="p-4 space-y-6">
            {/* Current Game Type */}
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Game {currentGame + 1}: {score.games[currentGame]?.type === "doubles" ? "Doubles" : "Singles"}
              </Badge>
            </div>

            {/* Current Game Score */}
            <div className="bg-gray-50 p-6 rounded-lg border">
              <div className="text-center mb-2">
                <h3 className="font-semibold">Current Game: {currentGame + 1}</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`text-5xl font-bold ${servingPlayer === "home" ? "text-red-600" : ""}`}>
                    {score.games[currentGame].home}
                    {servingPlayer === "home" && <span className="text-xl ml-1">•</span>}
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="text-xl font-bold">-</div>
                </div>

                <div className="text-center">
                  <div className={`text-5xl font-bold ${servingPlayer === "away" ? "text-blue-600" : ""}`}>
                    {score.games[currentGame].away}
                    {servingPlayer === "away" && <span className="text-xl ml-1">•</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Game History */}
            <div>
              <h3 className="font-semibold mb-4">Game History</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 text-left">Game</th>
                      <th className="p-2 text-center">Type</th>
                      <th className="p-2 text-center">{match.homeTeam.name}</th>
                      <th className="p-2 text-center">{match.awayTeam.name}</th>
                      <th className="p-2 text-center">Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {score.games.map((game: any, index: number) => {
                      const pointsToWinPerGame = score.pointsToWin || badmintonConfig?.pointsToWinPerGame || 21
                      const maxPointsPerGame = pointsToWinPerGame === 11 ? 15 : pointsToWinPerGame === 15 ? 19 : 30
                      let winner = null
                      if ((game.home >= pointsToWinPerGame && game.home - game.away >= 2) || game.home === maxPointsPerGame) {
                        winner = "home"
                      } else if ((game.away >= pointsToWinPerGame && game.away - game.home >= 2) || game.away === maxPointsPerGame) {
                        winner = "away"
                      }
                      const gameType = game.type || "singles"

                      return (
                        <tr key={index} className={index === currentGame ? "bg-yellow-50" : ""}>
                          <td className="p-2 border-b">{index + 1}</td>
                          <td className="p-2 border-b text-center">
                            <Badge variant={gameType === "doubles" ? "default" : "outline"} className="text-xs">
                              {gameType === "doubles" ? "Doubles" : "Singles"}
                            </Badge>
                          </td>
                          <td className="p-2 border-b text-center font-semibold">{game.home}</td>
                          <td className="p-2 border-b text-center font-semibold">{game.away}</td>
                          <td className="p-2 border-b text-center">
                            {winner === "home" && <span className="text-red-600">{match.homeTeam.name}</span>}
                            {winner === "away" && <span className="text-blue-600">{match.awayTeam.name}</span>}
                            {!winner && "-"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="controls" className="p-4 space-y-6">
            {/* Match Type Toggle */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="doubles-mode" className="font-semibold">
                    Doubles Mode
                  </Label>
                  <Users className="h-4 w-4 text-gray-500" />
                </div>
                <Switch id="doubles-mode" checked={isDoubles} onCheckedChange={toggleDoublesMode} />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {isDoubles
                  ? "Doubles mode is enabled. Two players per team will be shown on the court."
                  : "Singles mode is enabled. One player per team will be shown on the court."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold mb-4 text-center">{match.homeTeam.name}</h3>
                <div className="text-center text-4xl font-bold mb-4">{score.games[currentGame].home}</div>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => updateScore("home", -1)}>
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => updateScore("home", 1)}>
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4 text-center">
                  <Button
                    variant={servingPlayer === "home" ? "default" : "outline"}
                    onClick={() => setServingPlayer("home")}
                    className="w-full"
                  >
                    Serving
                  </Button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold mb-4 text-center">{match.awayTeam.name}</h3>
                <div className="text-center text-4xl font-bold mb-4">{score.games[currentGame].away}</div>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => updateScore("away", -1)}>
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => updateScore("away", 1)}>
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4 text-center">
                  <Button
                    variant={servingPlayer === "away" ? "default" : "outline"}
                    onClick={() => setServingPlayer("away")}
                    className="w-full"
                  >
                    Serving
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  setServingPlayer(servingPlayer === "home" ? "away" : "home")
                }}
              >
                <RotateCw className="h-4 w-4" />
                Switch Server
              </Button>
            </div>

            <div className="flex justify-center gap-4">
              {score.games.map((_: any, index: number) => (
                <Button
                  key={index}
                  variant={currentGame === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentGame(index)}
                >
                  Game {index + 1}
                </Button>
              ))}
            </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>

      {/* Winner Announcement Dialog */}
      <Dialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="text-6xl mb-4">🏸🏆</div>
            <DialogHeader>
              <DialogTitle className="text-2xl text-center">Match Complete!</DialogTitle>
            </DialogHeader>
            {winnerInfo && (
              <div className="mt-4">
                <p className="text-lg text-gray-600 mb-2">Winner</p>
                <h3 className="text-3xl font-bold text-green-600 mb-4">{winnerInfo.name}</h3>
                <div className="bg-gray-100 rounded-lg p-4 inline-block">
                  <p className="text-xl font-semibold">
                    {winnerInfo.gamesWon} - {winnerInfo.gamesLost}
                  </p>
                  <p className="text-sm text-gray-500">Games</p>
                </div>
                <div className="mt-6">
                  <Button onClick={() => {
                    setShowWinnerDialog(false)
                    window.location.reload()
                  }}>
                    View Match Details
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Toss Configuration Dialog - Only for admins */}
      {isAdmin && showTossDialog && (
        <TossConfigurationDialog
          open={showTossDialog}
          matchId={match.id}
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          onComplete={handleTossComplete}
          onCancel={() => setShowTossDialog(false)}
        />
      )}

      {/* Game Type Selection Dialog - Only for admins */}
      {isAdmin && (
        <Dialog open={showGameTypeDialog} onOpenChange={setShowGameTypeDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Select Game Type for Game {currentGame + 1}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              What type of game will be played for Game {currentGame + 1}?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => handleGameTypeSelect("singles")}
              >
                <Users className="h-6 w-6" />
                <span className="font-semibold">Singles</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => handleGameTypeSelect("doubles")}
              >
                <Users className="h-6 w-6" />
                <span className="font-semibold">Doubles</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
