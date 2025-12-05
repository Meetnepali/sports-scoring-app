"use client"

import { useState, useEffect, useRef } from "react"
import type { Match } from "@/lib/static-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PlusCircle, MinusCircle, Timer, Save, CheckCircle, Trophy } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { updateMatchScore } from "@/lib/client-api"
import { useToast } from "@/hooks/use-toast"
import { TossConfigurationDialog } from "@/components/futsal/toss-configuration-dialog"

interface FutsalScoreboardProps {
  match: Match
}

export default function FutsalScoreboard({ match }: FutsalScoreboardProps) {
  // Ensure score values are numbers
  const initialScore = {
    home: Number(match.score?.home || 0),
    away: Number(match.score?.away || 0),
    period: match.score?.period || "First Half",
    time: match.score?.time || "00:00",
    goals: Array.isArray(match.score?.goals) ? match.score.goals : [],
  }

  const [score, setScore] = useState(initialScore)
  const [saving, setSaving] = useState(false)
  const [matchComplete, setMatchComplete] = useState(false)
  const [winner, setWinner] = useState<"home" | "away" | "draw" | null>(null)
  const [showWinnerDialog, setShowWinnerDialog] = useState(false)
  const [futsalConfig, setFutsalConfig] = useState<any>(null)
  const [showTossDialog, setShowTossDialog] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const { toast } = useToast()

  // Fetch futsal configuration on mount and when match status changes
  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoadingConfig(true)
        const response = await fetch(`/api/matches/${match.id}/futsal/config`)
        const data = await response.json()
        
        if (data.config) {
          setFutsalConfig(data.config)
          
          // Show toss dialog if match is started/live and config not completed
          if ((match.status === "started" || match.status === "live") && !data.config.configCompleted) {
            setShowTossDialog(true)
          }
        } else if (match.status === "started" || match.status === "live") {
          // Match is started/live but no config exists - show dialog
          setShowTossDialog(true)
        }
      } catch (error) {
        console.error("Error fetching futsal config:", error)
      } finally {
        setLoadingConfig(false)
      }
    }

    fetchConfig()
  }, [match.id, match.status])
  
  // Watch for match status changes (when match is started)
  useEffect(() => {
    if ((match.status === "started" || match.status === "live") && !loadingConfig && futsalConfig && !futsalConfig.configCompleted) {
      setShowTossDialog(true)
    }
  }, [match.status, loadingConfig, futsalConfig])

  // Sync local state with match prop changes (for live updates)
  useEffect(() => {
    if (match.score) {
      const newScore = {
        home: Number(match.score.home || 0),
        away: Number(match.score.away || 0),
        period: match.score.period || score.period,
        time: match.score.time || score.time,
        goals: Array.isArray(match.score.goals) ? match.score.goals : score.goals,
      }
      
      // Only update if score actually changed (avoid unnecessary updates)
      if (newScore.home !== score.home ||
          newScore.away !== score.away ||
          newScore.period !== score.period ||
          newScore.time !== score.time ||
          JSON.stringify(newScore.goals) !== JSON.stringify(score.goals)) {
        setScore(newScore)
      }
    }
  }, [match.score, match.status])

  // Persist score changes to database (with debouncing)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    // Only persist if match is live and config is completed
    const canScore = (match.status === "live" || match.status === "started") && futsalConfig?.configCompleted
    if (!canScore) return
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Debounce the save operation (wait 500ms after last change)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateMatchScore(match.id, score)
      } catch (error) {
        console.error("Error auto-saving score:", error)
        // Don't show error toast for auto-save to avoid spam
      }
    }, 500)
    
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [score, match.id, match.status, futsalConfig?.configCompleted])

  // Handle toss configuration completion
  const handleTossComplete = async (config: any) => {
    setFutsalConfig((prev: any) => ({
      ...prev!,
      tossWinnerTeamId: config.tossWinnerTeamId,
      tossDecision: config.tossDecision,
      selectedSide: config.selectedSide,
      kickingOffTeam: config.kickingOffTeam,
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

  // Enable scoring if match is live (or was started and config is completed) and config is completed
  const isLive = (match.status === "live" || (match.status === "started" && futsalConfig?.configCompleted)) && futsalConfig?.configCompleted

  const updateScore = (team: "home" | "away", amount: number) => {
    setScore((prevScore: any) => {
      // Ensure current score is a number
      const currentScore = Number(prevScore[team]) || 0
      if (currentScore + amount < 0) return prevScore

      const newScore = { ...prevScore }
      newScore[team] = currentScore + amount

      // Ensure goals array exists
      if (!Array.isArray(newScore.goals)) {
        newScore.goals = []
      }

      // Add a goal to the goals array if increasing
      if (amount > 0) {
        const teamId = team === "home" ? match.homeTeam.id : match.awayTeam.id
        const players = team === "home" ? match.homeTeam.players : match.awayTeam.players
        const playerId = players.length > 0 ? players[0].id : "unknown"

        newScore.goals = [
          ...newScore.goals,
          {
            team: teamId,
            player: playerId,
            time: newScore.time,
          },
        ]
      } else if (amount < 0 && newScore.goals.length > 0) {
        // Remove the last goal for this team if decreasing
        const teamId = team === "home" ? match.homeTeam.id : match.awayTeam.id
        const lastGoalIndex = [...newScore.goals].reverse().findIndex((g) => g.team === teamId)

        if (lastGoalIndex !== -1) {
          const actualIndex = newScore.goals.length - 1 - lastGoalIndex
          newScore.goals = [...newScore.goals.slice(0, actualIndex), ...newScore.goals.slice(actualIndex + 1)]
        }
      }

      return newScore
    })
  }

  const updatePeriod = (period: string) => {
    setScore((prevScore: any) => ({
      ...prevScore,
      period,
    }))

    // Check for match completion based on period
    if (period === "Full Time" && !matchComplete) {
      checkMatchCompletion()
    }
  }

  const checkMatchCompletion = async () => {
    const homeScore = Number(score.home) || 0
    const awayScore = Number(score.away) || 0

    const completeMatch = async (winnerTeam: "home" | "away" | "draw") => {
      const winnerId = winnerTeam === "home" ? match.homeTeam.id : winnerTeam === "away" ? match.awayTeam.id : null
      const finalScore = {
        home: homeScore,
        away: awayScore,
        period: score.period,
        goals: score.goals,
      }

      try {
        // Complete the match via API
        await fetch(`/api/matches/${match.id}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: finalScore,
            winnerId: winnerId,
          }),
        })

        // Update match status
        await fetch(`/api/matches/${match.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        })

        setWinner(winnerTeam)
        setMatchComplete(true)
        setShowWinnerDialog(true)

        toast({
          title: "⚽ Match Complete!",
          description: winnerTeam === "draw" 
            ? `Match ended in a ${homeScore}-${awayScore} draw!`
            : `${winnerTeam === "home" ? match.homeTeam.name : match.awayTeam.name} wins ${homeScore}-${awayScore}!`,
        })
      } catch (error) {
        console.error("Error completing match:", error)
        toast({
          title: "Error",
          description: "Failed to save match result",
          variant: "destructive",
        })
      }
    }

    if (score.period === "Penalties") {
      // In penalties, just determine winner
      if (homeScore > awayScore) {
        await completeMatch("home")
      } else if (awayScore > homeScore) {
        await completeMatch("away")
      }
    } else if (score.period === "Extra Time") {
      // After extra time, if still tied, suggest penalties
      if (homeScore === awayScore) {
        const goToPenalties = confirm(`Match is still tied ${homeScore}-${awayScore} after Extra Time. Go to Penalties?`)
        if (goToPenalties) {
          updatePeriod("Penalties")
          setScore((prev: any) => ({
            ...prev,
            home: 0,
            away: 0,
            period: "Penalties",
          }))
        }
      } else {
        await completeMatch(homeScore > awayScore ? "home" : "away")
      }
    } else {
      // Regular time or second half
      if (homeScore > awayScore) {
        await completeMatch("home")
      } else if (awayScore > homeScore) {
        await completeMatch("away")
      } else {
        const goToExtra = confirm(`Match ended in a ${homeScore}-${homeScore} draw. Go to Extra Time?`)
        if (goToExtra) {
          updatePeriod("Extra Time")
          setMatchComplete(false)
          setWinner(null)
        } else {
          await completeMatch("draw")
        }
      }
    }
  }

  const updateTime = (time: string) => {
    setScore((prevScore: any) => ({
      ...prevScore,
      time,
    }))
  }

  const getPlayerName = (playerId: string) => {
    const allPlayers = [...match.homeTeam.players, ...match.awayTeam.players]
    const player = allPlayers.find((p) => p.id === playerId)
    return player ? player.name : "Unknown Player"
  }

  const getTeamName = (teamId: string) => {
    return teamId === match.homeTeam.id ? match.homeTeam.name : match.awayTeam.name
  }

  // Show message if match is scheduled
  if (match.status === "scheduled") {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-2xl">Futsal Scoreboard</CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600 text-lg">Match is scheduled. Start the match to begin configuration.</p>
        </CardContent>
      </Card>
    )
  }

  // Show message if config not completed (toss dialog will show automatically)
  if ((match.status === "started" || match.status === "live") && futsalConfig && !futsalConfig.configCompleted && !showTossDialog) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-2xl">Futsal Scoreboard</CardTitle>
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

  const handleSaveScore = async () => {
    try {
      setSaving(true)
      await updateMatchScore(match.id, score)
      toast({
        title: "Score Saved!",
        description: "Match score has been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving score:", error)
      toast({
        title: "Error",
        description: "Failed to save score. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Futsal Scoreboard</CardTitle>
          {isLive && (
            <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full animate-pulse">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-semibold">LIVE SCORING ENABLED</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="scorecard" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
            <TabsTrigger value="controls" disabled={!isLive}>
              Controls
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scorecard">
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm font-medium">{score.period}</div>
                  <div className="flex items-center">
                    <Timer className="h-4 w-4 mr-1" />
                    <span>{score.time}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <h3 className="font-semibold">{match.homeTeam.name}</h3>
                    <div className="text-5xl font-bold my-4">{score.home}</div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="text-xl font-bold">-</div>
                  </div>

                  <div className="text-center">
                    <h3 className="font-semibold">{match.awayTeam.name}</h3>
                    <div className="text-5xl font-bold my-4">{score.away}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Goals</h3>
                {score.goals && score.goals.length > 0 ? (
                  <div className="space-y-2">
                    {score.goals.map((goal: any, index: number) => (
                      <div key={index} className="flex justify-between p-2 border-b">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">{getPlayerName(goal.player)}</span>
                          <span className="text-sm text-gray-500">({getTeamName(goal.team)})</span>
                        </div>
                        <div className="text-sm">{goal.time}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No goals yet</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="controls">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-4 text-center">{match.homeTeam.name}</h3>
                  <div className="text-center text-4xl font-bold mb-4">{score.home}</div>
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => updateScore("home", -1)}>
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => updateScore("home", 1)}>
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-4 text-center">{match.awayTeam.name}</h3>
                  <div className="text-center text-4xl font-bold mb-4">{score.away}</div>
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

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-4 text-center">Period</h3>
                  <Select value={score.period} onValueChange={updatePeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First Half">First Half</SelectItem>
                      <SelectItem value="Second Half">Second Half</SelectItem>
                      <SelectItem value="Extra Time">Extra Time</SelectItem>
                      <SelectItem value="Penalties">Penalties</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-4 text-center">Match Time</h3>
                  <input
                    type="text"
                    value={score.time}
                    onChange={(e) => updateTime(e.target.value)}
                    placeholder="MM:SS"
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              {/* Save Score Button */}
              {isLive && (
                <div className="flex flex-col gap-3 pt-4">
                  <Button 
                    onClick={handleSaveScore} 
                    disabled={saving}
                    className="w-full max-w-md mx-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        Save Score
                      </>
                    )}
                  </Button>

                  {!matchComplete && (
                    <Button 
                      onClick={checkMatchCompletion}
                      variant="outline"
                      className="w-full max-w-md mx-auto font-bold py-3"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Complete Match
                    </Button>
                  )}

                  {matchComplete && winner && (
                    <div className="text-center p-4 bg-green-100 rounded-lg border-2 border-green-500">
                      <p className="text-lg font-bold text-green-900">
                        🏆 {winner === "draw" ? "Match Drawn!" : `${winner === "home" ? match.homeTeam.name : match.awayTeam.name} Wins!`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Winner Announcement Dialog */}
      <Dialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="text-6xl mb-4">⚽🏆</div>
            <DialogHeader>
              <DialogTitle className="text-2xl text-center">Match Complete!</DialogTitle>
            </DialogHeader>
            {winner && (
              <div className="mt-4">
                <p className="text-lg text-gray-600 mb-2">{winner === "draw" ? "Result" : "Winner"}</p>
                <h3 className="text-3xl font-bold text-green-600 mb-4">
                  {winner === "draw" 
                    ? "Match Drawn!" 
                    : winner === "home" 
                      ? match.homeTeam.name 
                      : match.awayTeam.name}
                </h3>
                <div className="bg-gray-100 rounded-lg p-4 inline-block">
                  <p className="text-xl font-semibold">
                    {score.home} - {score.away}
                  </p>
                  <p className="text-sm text-gray-500">Final Score</p>
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
