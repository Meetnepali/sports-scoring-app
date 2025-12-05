"use client"

import { useState, useEffect } from "react"
import type { Match } from "@/lib/static-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import ChessBoard from "@/components/chess-board"
import { TossConfigurationDialog } from "@/components/chess/toss-configuration-dialog"

interface ChessScoreboardProps {
  match: Match
}

export default function ChessScoreboard({ match }: ChessScoreboardProps) {
  const initialGames = Array.isArray(match.score?.games) ? match.score.games : []
  const initialTeamScore = {
    home: Number(match.score?.teamScore?.home) || 0,
    away: Number(match.score?.teamScore?.away) || 0
  }

  const [games, setGames] = useState(initialGames)
  const [teamScore, setTeamScore] = useState(initialTeamScore)
  const [chessConfig, setChessConfig] = useState<any>(null)
  const [showTossDialog, setShowTossDialog] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const { toast } = useToast()

  // Fetch chess configuration on mount and when match status changes
  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoadingConfig(true)
        const response = await fetch(`/api/matches/${match.id}/chess/config`)
        const data = await response.json()
        
        if (data.config) {
          setChessConfig(data.config)
          
          // Show toss dialog if match is started/live and config not completed
          if ((match.status === "started" || match.status === "live") && !data.config.configCompleted) {
            setShowTossDialog(true)
          }
        } else if (match.status === "started" || match.status === "live") {
          // Match is started/live but no config exists - show dialog
          setShowTossDialog(true)
        }
      } catch (error) {
        console.error("Error fetching chess config:", error)
      } finally {
        setLoadingConfig(false)
      }
    }

    fetchConfig()
  }, [match.id, match.status])
  
  // Watch for match status changes (when match is started)
  useEffect(() => {
    if ((match.status === "started" || match.status === "live") && !loadingConfig && chessConfig && !chessConfig.configCompleted) {
      setShowTossDialog(true)
    }
  }, [match.status, loadingConfig, chessConfig])

  // Sync local state with match prop changes (for live updates)
  useEffect(() => {
    if (match.score) {
      const newGames = Array.isArray(match.score.games) ? match.score.games : games
      const newTeamScore = {
        home: Number(match.score?.teamScore?.home) ?? teamScore.home,
        away: Number(match.score?.teamScore?.away) ?? teamScore.away
      }
      
      // Only update if score actually changed (avoid unnecessary updates)
      if (JSON.stringify(newGames) !== JSON.stringify(games) ||
          newTeamScore.home !== teamScore.home ||
          newTeamScore.away !== teamScore.away) {
        setGames(newGames)
        setTeamScore(newTeamScore)
      }
    }
  }, [match.score, match.status])

  // Handle toss configuration completion
  const handleTossComplete = async (config: any) => {
    setChessConfig((prev: any) => ({
      ...prev!,
      tossWinnerTeamId: config.tossWinnerTeamId,
      tossDecision: config.tossDecision,
      selectedColor: config.selectedColor,
      whiteTeamId: config.whiteTeamId,
      configCompleted: true,
    }))
    
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

  const updateGameResult = async (index: number, result: string) => {
    // Update games state
    const updatedGames = [...games]
    updatedGames[index] = {
      ...updatedGames[index],
      result,
    }
    setGames(updatedGames)

    // Calculate new team score
    let home = 0
    let away = 0
    updatedGames.forEach((game: any) => {
      if (game.result === "1-0") {
        home += 1
      } else if (game.result === "0-1") {
        away += 1
      } else if (game.result === "½-½") {
        home += 0.5
        away += 0.5
      }
    })
    
    const newTeamScore = { home, away }
    setTeamScore(newTeamScore)
    
    // Save to database
    try {
      const scoreData = {
        games: updatedGames,
        teamScore: newTeamScore,
      }
      
      await fetch(`/api/matches/${match.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: scoreData }),
      })
    } catch (error) {
      console.error("Error saving chess score:", error)
      toast({
        title: "Error",
        description: "Failed to save score",
        variant: "destructive",
      })
    }
  }


  const getPlayerName = (playerId: string) => {
    const allPlayers = [...match.homeTeam.players, ...match.awayTeam.players]
    const player = allPlayers.find((p) => p.id === playerId)
    return player ? player.name : "Unknown Player"
  }

  // Show message if match is scheduled
  if (match.status === "scheduled") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chess Scoreboard</CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600 text-lg">Match is scheduled. Start the match to begin configuration.</p>
        </CardContent>
      </Card>
    )
  }

  // Show message if config not completed (toss dialog will show automatically)
  if ((match.status === "started" || match.status === "live") && chessConfig && !chessConfig.configCompleted && !showTossDialog) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chess Scoreboard</CardTitle>
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

  // Enable scoring if match is live (or was started and config is completed) and config is completed
  const canScore = (match.status === "live" || (match.status === "started" && chessConfig?.configCompleted)) && chessConfig?.configCompleted

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chess Scoreboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="board" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
            <TabsTrigger value="controls" disabled={!canScore}>
              Controls
            </TabsTrigger>
          </TabsList>

          <TabsContent value="board">
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <h3 className="font-semibold">{match.homeTeam.name}</h3>
                  <div className="text-3xl font-bold">{teamScore.home}</div>
                </div>

                <div className="text-center">
                  <h3 className="font-semibold">Score</h3>
                  <div className="text-3xl font-bold">
                    {teamScore.home} - {teamScore.away}
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="font-semibold">{match.awayTeam.name}</h3>
                  <div className="text-3xl font-bold">{teamScore.away}</div>
                </div>
              </div>

              <ChessBoard
                games={games}
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
                onUpdateGame={canScore ? updateGameResult : undefined}
              />
            </div>
          </TabsContent>

          <TabsContent value="scorecard">
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <h3 className="font-semibold">{match.homeTeam.name}</h3>
                  <div className="text-3xl font-bold">{teamScore.home}</div>
                </div>

                <div className="text-center">
                  <h3 className="font-semibold">Score</h3>
                  <div className="text-3xl font-bold">
                    {teamScore.home} - {teamScore.away}
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="font-semibold">{match.awayTeam.name}</h3>
                  <div className="text-3xl font-bold">{teamScore.away}</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 text-left">Board</th>
                      <th className="p-2 text-left">{match.homeTeam.name}</th>
                      <th className="p-2 text-center">Result</th>
                      <th className="p-2 text-left">{match.awayTeam.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.map((game: any, index: number) => (
                      <tr key={index}>
                        <td className="p-2 border-b">{index + 1}</td>
                        <td className="p-2 border-b">{getPlayerName(game.player1)}</td>
                        <td className="p-2 border-b text-center font-mono">
                          {game.result === "ongoing" ? <span className="text-yellow-500">*</span> : game.result}
                        </td>
                        <td className="p-2 border-b">{getPlayerName(game.player2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="controls">
            <div className="space-y-6">
              {games.map((game: any, index: number) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-4">
                    Board {index + 1}: {getPlayerName(game.player1)} vs {getPlayerName(game.player2)}
                  </h3>
                  <div className="flex items-center">
                    <span className="mr-4">Result:</span>
                    <Select value={game.result} onValueChange={(value) => updateGameResult(index, value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select result" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-0">1-0 (Home wins)</SelectItem>
                        <SelectItem value="0-1">0-1 (Away wins)</SelectItem>
                        <SelectItem value="½-½">½-½ (Draw)</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}

              {games.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-500">No games have been set up yet.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Toss Configuration Dialog */}
      {showTossDialog && (
        <TossConfigurationDialog
          open={showTossDialog}
          matchId={match.id}
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          onComplete={handleTossComplete}
          onCancel={() => setShowTossDialog(false)}
        />
      )}
    </Card>
  )
}
