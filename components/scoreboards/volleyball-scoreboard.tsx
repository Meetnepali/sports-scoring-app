"use client"

import { useState, useEffect, useRef } from "react"
import type { Match } from "@/lib/static-data"
import type { VolleyballScore, VolleyballTeam, VolleyballPlayer, VolleyballPosition, VolleyballMatchConfig } from "@/lib/volleyball-types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PlusCircle, MinusCircle, UserPlus, Edit } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import VolleyballCourt from "@/components/volleyball-court"
import { TossConfigurationDialog } from "@/components/volleyball/toss-configuration-dialog"
import { updateMatchScore } from "@/lib/client-api"
import { useAuth } from "@/lib/auth-context"

interface VolleyballScoreboardProps {
  match: Match
}

export default function VolleyballScoreboard({ match }: VolleyballScoreboardProps) {
  const { toast } = useToast()
  const { isAdmin } = useAuth()
  
  // Initialize volleyball-specific data
  const initializeTeam = (team: any): VolleyballTeam => {
    return {
      id: team.id,
      name: team.name,
      players: team.players.map((player: any, index: number) => ({
        id: player.id,
        name: player.name,
        number: player.number || index + 1,
        position: player.position || "Outside Hitter",
        isOnCourt: index < 6, // First 6 players are on court by default
        courtPosition: index < 6 ? index + 1 : undefined, // Assign positions 1-6 to first 6 players
      })),
      currentServer: team.players[0]?.id, // First player is server by default
    }
  }

  const initialScore: VolleyballScore = match.score
    ? {
        ...match.score,
        sets: Array.isArray(match.score.sets) ? match.score.sets.map((set: any) => ({
          home: Number(set.home) || 0,
          away: Number(set.away) || 0
        })) : [
          { home: 0, away: 0 },
          { home: 0, away: 0 },
          { home: 0, away: 0 },
          { home: 0, away: 0 },
          { home: 0, away: 0 },
        ],
        currentSet: Number(match.score.currentSet) || 0,
        homeTeam: initializeTeam(match.homeTeam),
        awayTeam: initializeTeam(match.awayTeam),
        servingTeam: match.score.servingTeam || "home",
      }
    : {
        sets: [
          { home: 0, away: 0 },
          { home: 0, away: 0 },
          { home: 0, away: 0 },
          { home: 0, away: 0 },
          { home: 0, away: 0 },
        ],
        currentSet: 0,
        homeTeam: initializeTeam(match.homeTeam),
        awayTeam: initializeTeam(match.awayTeam),
        servingTeam: "home",
      }

  const [score, setScore] = useState<VolleyballScore>(initialScore)
  const [currentSet, setCurrentSet] = useState(() => {
    const setIndex = Number(initialScore.currentSet)
    return !isNaN(setIndex) && setIndex >= 0 ? setIndex : 0
  })
  const [editingPlayer, setEditingPlayer] = useState<{
    team: "home" | "away"
    player: VolleyballPlayer
  } | null>(null)
  const [volleyballConfig, setVolleyballConfig] = useState<VolleyballMatchConfig | null>(null)
  const [showTossDialog, setShowTossDialog] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false)
  const [teamNeedingPlayer, setTeamNeedingPlayer] = useState<"home" | "away" | null>(null)
  const [newPlayerPosition, setNewPlayerPosition] = useState<VolleyballPosition | "">("")
  const [matchCompleted, setMatchCompleted] = useState(false)
  const [showWinnerAnnouncement, setShowWinnerAnnouncement] = useState(false)
  const [winnerInfo, setWinnerInfo] = useState<{ team: "home" | "away"; name: string; setsWon: number; setsLost: number } | null>(null)

  // Fetch volleyball configuration on mount
  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoadingConfig(true)
        const response = await fetch(`/api/matches/${match.id}/volleyball/config`)
        const data = await response.json()
        
        if (data.config) {
          setVolleyballConfig(data.config)
          
          // Initialize score with correct number of sets
          if (data.config.numberOfSets) {
            const setsArray = Array.from({ length: data.config.numberOfSets }, (_, i) => 
              score.sets[i] || { home: 0, away: 0 }
            )
            setScore((prev) => ({
              ...prev,
              sets: setsArray,
              numberOfSets: data.config.numberOfSets,
              servingTeam: data.config.servingTeam || prev.servingTeam,
            }))
          }
          
          // Show toss dialog if match is started/live and config not completed
          if ((match.status === "started" || match.status === "live") && !data.config.configCompleted) {
            setShowTossDialog(true)
          }
        } else if (match.status === "started" || match.status === "live") {
          // Match is started/live but no config exists - config should have been created during match creation
          console.warn("Match is started/live but no volleyball config found")
          // Still show dialog so admin can complete configuration
          setShowTossDialog(true)
        }
      } catch (error) {
        console.error("Error fetching volleyball config:", error)
      } finally {
        setLoadingConfig(false)
      }
    }

    fetchConfig()
  }, [match.id])
  
  // Watch for match status changes (when match is started)
  useEffect(() => {
    if ((match.status === "started" || match.status === "live") && !loadingConfig && volleyballConfig && !volleyballConfig.configCompleted) {
      setShowTossDialog(true)
    }
  }, [match.status, loadingConfig, volleyballConfig])

  // Sync local state with match prop changes (for live updates)
  useEffect(() => {
    if (match.score) {
      const newScore = {
        ...match.score,
        sets: Array.isArray(match.score.sets) ? match.score.sets.map((set: any) => ({
          home: Number(set.home) || 0,
          away: Number(set.away) || 0
        })) : score.sets,
        currentSet: Number(match.score.currentSet) ?? score.currentSet,
        servingTeam: match.score.servingTeam || score.servingTeam,
        homeTeam: score.homeTeam, // Preserve team structure
        awayTeam: score.awayTeam, // Preserve team structure
      }
      
      // Only update if score actually changed (avoid unnecessary updates)
      if (JSON.stringify(newScore.sets) !== JSON.stringify(score.sets) ||
          newScore.currentSet !== score.currentSet ||
          newScore.servingTeam !== score.servingTeam) {
        setScore(newScore)
        setCurrentSet(newScore.currentSet)
      }
    }
  }, [match.score, match.status])
  
  // Validate 7 players when match status is "started" or "live" and config is completed
  useEffect(() => {
    if ((match.status === "started" || match.status === "live") && 
        volleyballConfig?.configCompleted && 
        !showTossDialog && 
        !showAddPlayerDialog) {
      const { hasAllPlayers, teamNeedingPlayer } = checkTeamsHave7Players()
      
      if (!hasAllPlayers && teamNeedingPlayer) {
        setTeamNeedingPlayer(teamNeedingPlayer)
        setShowAddPlayerDialog(true)
        toast({
          title: "7 Players Required",
          description: `${teamNeedingPlayer === "home" ? match.homeTeam.name : match.awayTeam.name} needs 7 players to continue.`,
          variant: "destructive",
        })
      }
    }
  }, [match.status, volleyballConfig, showTossDialog, showAddPlayerDialog])

  // Persist score changes to database (with debouncing)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    // Only persist if match is live and config is completed
    const canScore = (match.status === "live" || match.status === "started") && volleyballConfig?.configCompleted
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
  }, [score, match.id, match.status, volleyballConfig?.configCompleted])


  // Update score for a team with official volleyball rules
  const updateScore = (team: "home" | "away", amount: number) => {
    setScore((prevScore) => {
      const newSets = [...prevScore.sets]
      
      // Safety check: ensure current set exists
      if (!newSets[currentSet]) {
        console.error(`Set at index ${currentSet} does not exist`)
        return prevScore
      }
      
      const currentScore = newSets[currentSet][team]
      const opponentTeam = team === "home" ? "away" : "home"
      const opponentScore = newSets[currentSet][opponentTeam]

      // Update score (don't go below 0)
      if (currentScore + amount >= 0) {
        newSets[currentSet] = {
          ...newSets[currentSet],
          [team]: currentScore + amount,
        }
      }

      // Determine serving team - when serve changes, just shift from one team to the other
      let newServingTeam = prevScore.servingTeam
      
      if (amount > 0) {
        // Team that scored gets/keeps the serve
        newServingTeam = team
      }
      
      // Check if set is won (OFFICIAL RULES)
      // Sets 1-4: First to 25 points with at least 2-point lead
      // Set 5: First to 15 points with at least 2-point lead
      const isSetFive = currentSet === 4
      const pointsToWin = isSetFive ? 15 : 25
      const setsToWin = prevScore.numberOfSets === 3 ? 2 : 3
      
      if (amount > 0 && newScore >= pointsToWin && newScore - opponentScore >= 2) {
        // SET WON!
        const { homeWins: currentHomeWins, awayWins: currentAwayWins } = getSetWinsFromSets(newSets)
        
        // Move to next set automatically (always play all sets, even if match is already won)
        const nextSet = currentSet + 1
        const maxSets = prevScore.numberOfSets || 5
        if (nextSet < maxSets) {
          setTimeout(() => {
            setCurrentSet(nextSet)
            toast({
              title: `✅ Set ${currentSet + 1} Complete!`,
              description: `${team === "home" ? match.homeTeam.name : match.awayTeam.name} wins ${newScore}-${opponentScore}. Moving to Set ${nextSet + 1}.`,
            })
          }, 100)
        } else {
          // All sets completed - Check if match is won and complete
          if (currentHomeWins >= setsToWin || currentAwayWins >= setsToWin) {
            // MATCH COMPLETE - Call API to complete match
            const winnerId = team === "home" ? match.homeTeam.id : match.awayTeam.id
            const winnerName = team === "home" ? match.homeTeam.name : match.awayTeam.name
            const finalScore = {
              sets: newSets,
              homeWins: currentHomeWins,
              awayWins: currentAwayWins,
              currentSet: currentSet,
            }
            
            setTimeout(async () => {
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
                
                setMatchCompleted(true)
                setWinnerInfo({
                  team,
                  name: winnerName,
                  setsWon: team === "home" ? currentHomeWins : currentAwayWins,
                  setsLost: team === "home" ? currentAwayWins : currentHomeWins,
                })
                setShowWinnerAnnouncement(true)
                
                toast({
                  title: "🏐 Match Complete!",
                  description: `${winnerName} wins ${team === "home" ? currentHomeWins : currentAwayWins}-${team === "home" ? currentAwayWins : currentHomeWins}!`,
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
          }
        }
      }

      return {
        ...prevScore,
        sets: newSets,
        servingTeam: newServingTeam,
        currentSet: currentSet,
      }
    })
  }

  // Helper function to calculate set wins from sets array
  const getSetWinsFromSets = (sets: Array<{home: number, away: number}>) => {
    let homeWins = 0
    let awayWins = 0

    sets.forEach((set, index) => {
      const pointsToWin = index === 4 ? 15 : 25
      if (set.home >= pointsToWin && set.home - set.away >= 2) {
        homeWins++
      } else if (set.away >= pointsToWin && set.away - set.home >= 2) {
        awayWins++
      }
    })

    return { homeWins, awayWins }
  }

  // Get set wins
  const getSetWins = () => {
    return getSetWinsFromSets(score.sets)
  }

  // Update a player's details
  const updatePlayer = (team: "home" | "away", updatedPlayer: VolleyballPlayer) => {
    setScore((prevScore) => {
      const teamKey = team === "home" ? "homeTeam" : "awayTeam"
      const teamData = prevScore[teamKey]

      const updatedPlayers = teamData.players.map((player) => (player.id === updatedPlayer.id ? updatedPlayer : player))

      return {
        ...prevScore,
        [teamKey]: {
          ...teamData,
          players: updatedPlayers,
        },
      }
    })

    setEditingPlayer(null)
  }

  // Add a new player
  const addPlayer = (team: "home" | "away", name: string, number: number, position: VolleyballPosition) => {
    setScore((prevScore) => {
      const teamKey = team === "home" ? "homeTeam" : "awayTeam"
      const teamData = prevScore[teamKey]

      const newPlayer: VolleyballPlayer = {
        id: `${team}-player-${Date.now()}`,
        name,
        number,
        position,
        isOnCourt: false,
      }

      return {
        ...prevScore,
        [teamKey]: {
          ...teamData,
          players: [...teamData.players, newPlayer],
        },
      }
    })
  }

  // Update team
  const updateTeam = (team: "home" | "away", updatedTeam: VolleyballTeam) => {
    setScore((prevScore) => ({
      ...prevScore,
      [team === "home" ? "homeTeam" : "awayTeam"]: updatedTeam,
    }))
  }

  // Change serving team
  const changeServe = (team: "home" | "away") => {
    setScore((prevScore) => ({
      ...prevScore,
      servingTeam: team,
    }))
  }

  // Check if teams have 7 players (required for volleyball)
  const checkTeamsHave7Players = (): { hasAllPlayers: boolean; teamNeedingPlayer: "home" | "away" | null } => {
    const homePlayerCount = score.homeTeam.players.length
    const awayPlayerCount = score.awayTeam.players.length
    
    if (homePlayerCount < 7) {
      return { hasAllPlayers: false, teamNeedingPlayer: "home" }
    }
    if (awayPlayerCount < 7) {
      return { hasAllPlayers: false, teamNeedingPlayer: "away" }
    }
    return { hasAllPlayers: true, teamNeedingPlayer: null }
  }

  // Handle toss configuration completion
  const handleTossComplete = async (config: any) => {
    setVolleyballConfig((prev) => ({
      ...prev!,
      tossWinnerTeamId: config.tossWinnerTeamId,
      tossDecision: config.tossDecision,
      selectedCourtSide: config.selectedCourtSide,
      servingTeam: config.servingTeam,
      configCompleted: true,
    }))
    
    setScore((prev) => ({
      ...prev,
      servingTeam: config.servingTeam,
    }))
    
    setShowTossDialog(false)
    
    // Check if teams have 7 players before starting match
    const { hasAllPlayers, teamNeedingPlayer } = checkTeamsHave7Players()
    
    if (!hasAllPlayers && teamNeedingPlayer) {
      setTeamNeedingPlayer(teamNeedingPlayer)
      setShowAddPlayerDialog(true)
      toast({
        title: "7 Players Required",
        description: `${teamNeedingPlayer === "home" ? match.homeTeam.name : match.awayTeam.name} needs 7 players to start the match.`,
        variant: "destructive",
      })
      return
    }
    
    // Update match status from "started" to "live" after toss is completed
    if (match.status === "started") {
      try {
        await fetch(`/api/matches/${match.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "live" }),
        })
        // Update match status locally (parent component will refetch)
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
  
  // Handle adding 7th player and then completing toss
  const handleAdd7thPlayerComplete = async () => {
    setShowAddPlayerDialog(false)
    // Check again if both teams have 7 players
    const { hasAllPlayers, teamNeedingPlayer } = checkTeamsHave7Players()
    
    if (!hasAllPlayers && teamNeedingPlayer) {
      // Still missing player - keep dialog open
      setTeamNeedingPlayer(teamNeedingPlayer)
      setShowAddPlayerDialog(true)
      toast({
        title: "7 Players Required",
        description: `${teamNeedingPlayer === "home" ? match.homeTeam.name : match.awayTeam.name} still needs 7 players.`,
        variant: "destructive",
      })
      return
    }
    
    // All teams have 7 players - proceed with starting match
    if (match.status === "started") {
      try {
        await fetch(`/api/matches/${match.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "live" }),
        })
        toast({
          title: "Match Ready!",
          description: "Both teams have 7 players. Match is now live.",
        })
      } catch (error) {
        console.error("Error updating match status:", error)
      }
    }
  }

  const { homeWins, awayWins } = getSetWins()

  // Show loading state while config is being fetched
  if (loadingConfig) {
    return (
      <Card className="shadow-lg border-t-4 border-t-blue-600">
        <CardContent className="p-12 text-center">
          <div className="text-gray-500">Loading match configuration...</div>
        </CardContent>
      </Card>
    )
  }

  // Show message if match is scheduled
  if (match.status === "scheduled") {
    return (
      <Card className="shadow-lg border-t-4 border-t-blue-600">
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-center text-xl md:text-2xl">Volleyball Scoreboard</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-12 text-gray-500">
            Match is scheduled. Start the match to begin configuration.
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show message if config not completed (toss dialog will show automatically)
  if ((match.status === "started" || match.status === "live") && volleyballConfig && !volleyballConfig.configCompleted && !showTossDialog) {
    return (
      <Card className="shadow-lg border-t-4 border-t-blue-600">
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-center text-xl md:text-2xl">Volleyball Scoreboard</CardTitle>
        </CardHeader>
        <CardContent className="p-12 text-center">
          <div className="text-yellow-600 mb-4">⚠️</div>
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
    <>
    <Card className="shadow-lg border-t-4 border-t-blue-600">
      <CardHeader className="bg-gray-50">
        <CardTitle className="text-center text-xl md:text-2xl">Volleyball Scoreboard</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="court" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-none">
            <TabsTrigger value="court">Court</TabsTrigger>
            <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
            <TabsTrigger value="players" disabled={match.status !== "live"}>
              Players
            </TabsTrigger>
          </TabsList>

          <TabsContent value="court" className="p-4">
            <VolleyballCourt
              homeTeam={score.homeTeam}
              awayTeam={score.awayTeam}
              servingTeam={score.servingTeam}
              onUpdateHomeTeam={(team) => updateTeam("home", team)}
              onUpdateAwayTeam={(team) => updateTeam("away", team)}
              onChangeServe={changeServe}
            />

            {/* Current Set Score - Visible to Everyone when match is live or completed */}
            {(match.status === "live" || match.status === "completed") && (
              <div className="grid grid-cols-2 gap-6 mt-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="font-semibold mb-4 text-center">{match.homeTeam.name}</h3>
                  <div className="text-center text-4xl font-bold mb-4">{score.sets[currentSet]?.home || 0}</div>
                  {isAdmin && match.status === "live" && (
                    <>
                      <div className="flex justify-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => updateScore("home", -1)}>
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => updateScore("home", 1)}>
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="font-semibold mb-4 text-center">{match.awayTeam.name}</h3>
                  <div className="text-center text-4xl font-bold mb-4">{score.sets[currentSet]?.away || 0}</div>
                  {isAdmin && match.status === "live" && (
                    <>
                      <div className="flex justify-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => updateScore("away", -1)}>
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => updateScore("away", 1)}>
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Set Information - Visible to Everyone */}
            {(match.status === "live" || match.status === "completed") && (
              <div className="text-center mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900">
                  Set {currentSet + 1} of {score.numberOfSets || 5} • First to {currentSet === 4 ? "15" : "25"} points (win by 2)
                </p>
                {(() => {
                  const currentSetScore = score.sets[currentSet] || { home: 0, away: 0 }
                  const isSetFive = currentSet === 4
                  const pointsToWin = isSetFive ? 15 : 25
                  const isDeuceRange = currentSetScore.home >= (pointsToWin - 2) && currentSetScore.away >= (pointsToWin - 2)
                  const isDeuce = currentSetScore.home >= pointsToWin - 1 && currentSetScore.away >= pointsToWin - 1 && 
                                 Math.abs(currentSetScore.home - currentSetScore.away) < 2
                  
                  if (isDeuce) {
                    return (
                      <div className="mt-2 p-2 bg-yellow-100 border-2 border-yellow-400 rounded-lg">
                        <p className="text-sm font-bold text-yellow-900 animate-pulse">
                          🔥 DEUCE! Must win by 2 points!
                        </p>
                      </div>
                    )
                  } else if (isDeuceRange) {
                    return (
                      <p className="text-xs text-blue-700 mt-1">
                        ⚡ Close game - approaching deuce situation!
                      </p>
                    )
                  }
                  return null
                })()}
              </div>
            )}
            
            {!isAdmin && (match.status === "live" || match.status === "completed") && (
              <div className="text-center mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 mr-2">Read-Only Mode</Badge>
                  You can view scores but cannot make changes. Admin access required to update scores.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scorecard" className="p-4 space-y-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <h3 className="font-semibold">{match.homeTeam.name}</h3>
                <div className="text-3xl font-bold">{homeWins}</div>
              </div>

              <div className="text-center">
                <h3 className="font-semibold">Sets</h3>
                <div className="text-3xl font-bold">
                  {homeWins} - {awayWins}
                </div>
              </div>

              <div className="text-center">
                <h3 className="font-semibold">{match.awayTeam.name}</h3>
                <div className="text-3xl font-bold">{awayWins}</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left">Set</th>
                    <th className="p-2 text-center">{match.homeTeam.name}</th>
                    <th className="p-2 text-center">{match.awayTeam.name}</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {score.sets.map((set, index) => {
                    const isSetFive = index === 4
                    const pointsToWin = isSetFive ? 15 : 25
                    const isSetComplete = (set.home >= pointsToWin && set.home - set.away >= 2) || 
                                         (set.away >= pointsToWin && set.away - set.home >= 2)
                    const isCurrentSet = index === currentSet && match.status === "live"
                    
                    return (
                      <tr 
                        key={index} 
                        className={`${isCurrentSet ? "bg-blue-50" : ""} ${isSetComplete ? "bg-green-50" : ""}`}
                      >
                        <td className="p-2 border-b font-medium">
                          Set {index + 1}
                          {isSetComplete && <span className="ml-1 text-green-600">✓</span>}
                        </td>
                        <td className={`p-2 border-b text-center font-semibold ${set.home > set.away && isSetComplete ? "text-green-600" : ""}`}>
                          {set.home}
                        </td>
                        <td className={`p-2 border-b text-center font-semibold ${set.away > set.home && isSetComplete ? "text-green-600" : ""}`}>
                          {set.away}
                        </td>
                        <td className="p-2 border-b text-center">
                          {isCurrentSet && !isSetComplete && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                              Live
                            </span>
                          )}
                          {isSetComplete && (
                            <span className="text-xs font-medium text-green-600">Completed</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {match.status === "live" && (
              <div className="flex justify-center mb-4">
                <div className="flex space-x-2">
                  {score.sets.map((_, index) => (
                    <Button
                      key={index}
                      variant={currentSet === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentSet(index)}
                    >
                      Set {index + 1}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="players" className="p-4 space-y-6">
            <Tabs defaultValue="home-team">
              <TabsList className="w-full">
                <TabsTrigger value="home-team" className="flex-1">
                  {match.homeTeam.name}
                </TabsTrigger>
                <TabsTrigger value="away-team" className="flex-1">
                  {match.awayTeam.name}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="home-team" className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Players</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="flex items-center gap-1">
                        <UserPlus className="h-4 w-4" />
                        Add Player
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Player</DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          const formData = new FormData(e.currentTarget)
                          const name = formData.get("name") as string
                          const number = Number.parseInt(formData.get("number") as string)
                          const position = formData.get("position") as VolleyballPosition

                          if (name && number && position) {
                            addPlayer("home", name, number, position)
                            e.currentTarget.reset()
                          }
                        }}
                        className="space-y-4 mt-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" name="name" required />
                          </div>
                          <div>
                            <Label htmlFor="number">Number</Label>
                            <Input id="number" name="number" type="number" min="1" max="99" required />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="position">Position</Label>
                          <Select name="position" defaultValue="Outside Hitter">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Setter">Setter</SelectItem>
                              <SelectItem value="Outside Hitter">Outside Hitter</SelectItem>
                              <SelectItem value="Middle Blocker">Middle Blocker</SelectItem>
                              <SelectItem value="Opposite">Opposite</SelectItem>
                              <SelectItem value="Libero">Libero</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full">
                          Add Player
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-5 bg-gray-100 p-2 rounded font-semibold text-sm">
                    <div>Number</div>
                    <div className="col-span-2">Name</div>
                    <div>Position</div>
                    <div>Status</div>
                  </div>

                  {score.homeTeam.players.map((player) => (
                    <div key={player.id} className="grid grid-cols-5 p-2 border-b items-center text-sm">
                      <div className="font-bold text-lg">{player.number}</div>
                      <div className="col-span-2">{player.name}</div>
                      <div>{player.position}</div>
                      <div className="flex items-center justify-between">
                        <span className={player.isOnCourt ? "text-green-600" : "text-gray-500"}>
                          {player.isOnCourt ? (
                            <>
                              On Court
                              {player.courtPosition && <span> (Pos {player.courtPosition})</span>}
                            </>
                          ) : (
                            "Bench"
                          )}
                        </span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingPlayer({ team: "home", player })}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Player</DialogTitle>
                            </DialogHeader>
                            {editingPlayer && (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault()
                                  const formData = new FormData(e.currentTarget)
                                  const name = formData.get("name") as string
                                  const number = Number.parseInt(formData.get("number") as string)
                                  const position = formData.get("position") as VolleyballPosition

                                  if (name && number && position && editingPlayer) {
                                    updatePlayer(editingPlayer.team, {
                                      ...editingPlayer.player,
                                      name,
                                      number,
                                      position,
                                    })
                                  }
                                }}
                                className="space-y-4 mt-4"
                              >
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="edit-name">Name</Label>
                                    <Input
                                      id="edit-name"
                                      name="name"
                                      defaultValue={editingPlayer.player.name}
                                      required
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-number">Number</Label>
                                    <Input
                                      id="edit-number"
                                      name="number"
                                      type="number"
                                      min="1"
                                      max="99"
                                      defaultValue={editingPlayer.player.number}
                                      required
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="edit-position">Position</Label>
                                  <Select name="position" defaultValue={editingPlayer.player.position}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Setter">Setter</SelectItem>
                                      <SelectItem value="Outside Hitter">Outside Hitter</SelectItem>
                                      <SelectItem value="Middle Blocker">Middle Blocker</SelectItem>
                                      <SelectItem value="Opposite">Opposite</SelectItem>
                                      <SelectItem value="Libero">Libero</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button type="submit" className="w-full">
                                  Update Player
                                </Button>
                              </form>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="away-team" className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Players</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="flex items-center gap-1">
                        <UserPlus className="h-4 w-4" />
                        Add Player
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Player</DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          const formData = new FormData(e.currentTarget)
                          const name = formData.get("name") as string
                          const number = Number.parseInt(formData.get("number") as string)
                          const position = formData.get("position") as VolleyballPosition

                          if (name && number && position) {
                            addPlayer("away", name, number, position)
                            e.currentTarget.reset()
                          }
                        }}
                        className="space-y-4 mt-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" name="name" required />
                          </div>
                          <div>
                            <Label htmlFor="number">Number</Label>
                            <Input id="number" name="number" type="number" min="1" max="99" required />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="position">Position</Label>
                          <Select name="position" defaultValue="Outside Hitter">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Setter">Setter</SelectItem>
                              <SelectItem value="Outside Hitter">Outside Hitter</SelectItem>
                              <SelectItem value="Middle Blocker">Middle Blocker</SelectItem>
                              <SelectItem value="Opposite">Opposite</SelectItem>
                              <SelectItem value="Libero">Libero</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full">
                          Add Player
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-5 bg-gray-100 p-2 rounded font-semibold text-sm">
                    <div>Number</div>
                    <div className="col-span-2">Name</div>
                    <div>Position</div>
                    <div>Status</div>
                  </div>

                  {score.awayTeam.players.map((player) => (
                    <div key={player.id} className="grid grid-cols-5 p-2 border-b items-center text-sm">
                      <div className="font-bold text-lg">{player.number}</div>
                      <div className="col-span-2">{player.name}</div>
                      <div>{player.position}</div>
                      <div className="flex items-center justify-between">
                        <span className={player.isOnCourt ? "text-green-600" : "text-gray-500"}>
                          {player.isOnCourt ? (
                            <>
                              On Court
                              {player.courtPosition && <span> (Pos {player.courtPosition})</span>}
                            </>
                          ) : (
                            "Bench"
                          )}
                        </span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingPlayer({ team: "away", player })}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Player</DialogTitle>
                            </DialogHeader>
                            {editingPlayer && (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault()
                                  const formData = new FormData(e.currentTarget)
                                  const name = formData.get("name") as string
                                  const number = Number.parseInt(formData.get("number") as string)
                                  const position = formData.get("position") as VolleyballPosition

                                  if (name && number && position && editingPlayer) {
                                    updatePlayer(editingPlayer.team, {
                                      ...editingPlayer.player,
                                      name,
                                      number,
                                      position,
                                    })
                                  }
                                }}
                                className="space-y-4 mt-4"
                              >
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="edit-name">Name</Label>
                                    <Input
                                      id="edit-name"
                                      name="name"
                                      defaultValue={editingPlayer.player.name}
                                      required
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-number">Number</Label>
                                    <Input
                                      id="edit-number"
                                      name="number"
                                      type="number"
                                      min="1"
                                      max="99"
                                      defaultValue={editingPlayer.player.number}
                                      required
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="edit-position">Position</Label>
                                  <Select name="position" defaultValue={editingPlayer.player.position}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Setter">Setter</SelectItem>
                                      <SelectItem value="Outside Hitter">Outside Hitter</SelectItem>
                                      <SelectItem value="Middle Blocker">Middle Blocker</SelectItem>
                                      <SelectItem value="Opposite">Opposite</SelectItem>
                                      <SelectItem value="Libero">Libero</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button type="submit" className="w-full">
                                  Update Player
                                </Button>
                              </form>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>

    {/* Toss Configuration Dialog */}
    {volleyballConfig && !loadingConfig && (
      <TossConfigurationDialog
        open={showTossDialog}
        matchId={match.id}
        homeTeam={match.homeTeam}
        awayTeam={match.awayTeam}
        numberOfSets={volleyballConfig.numberOfSets}
        onComplete={handleTossComplete}
        onCancel={() => setShowTossDialog(false)}
      />
      )}

      {/* Add 7th Player Dialog */}
      <Dialog open={showAddPlayerDialog} onOpenChange={setShowAddPlayerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add 7th Player Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-gray-600">
              Volleyball requires 7 players per team (6 on court + 1 libero/substitute).
              {teamNeedingPlayer && (
                <span className="font-semibold block mt-2">
                  {teamNeedingPlayer === "home" ? match.homeTeam.name : match.awayTeam.name} currently has{" "}
                  {teamNeedingPlayer === "home" ? score.homeTeam.players.length : score.awayTeam.players.length} players.
                  Please add the 7th player.
                </span>
              )}
            </p>
            
            {teamNeedingPlayer && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const name = formData.get("name") as string
                  const number = Number.parseInt(formData.get("number") as string)
                  const position = newPlayerPosition as VolleyballPosition

                  if (name && number && position) {
                    addPlayer(teamNeedingPlayer, name, number, position)
                    e.currentTarget.reset()
                    setNewPlayerPosition("")
                    handleAdd7thPlayerComplete()
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="player-name">Name *</Label>
                    <Input id="player-name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="player-number">Number *</Label>
                    <Input id="player-number" name="number" type="number" min="1" max="99" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="player-position">Position *</Label>
                  <Select value={newPlayerPosition} onValueChange={(value) => setNewPlayerPosition(value as VolleyballPosition)}>
                    <SelectTrigger id="player-position">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Setter">Setter</SelectItem>
                      <SelectItem value="Outside Hitter">Outside Hitter</SelectItem>
                      <SelectItem value="Middle Blocker">Middle Blocker</SelectItem>
                      <SelectItem value="Opposite">Opposite</SelectItem>
                      <SelectItem value="Libero" disabled>Libero (already have one)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddPlayerDialog(false)
                      setTeamNeedingPlayer(null)
                      setNewPlayerPosition("")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={!newPlayerPosition}
                  >
                    Add Player
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Winner Announcement Dialog */}
      <Dialog open={showWinnerAnnouncement} onOpenChange={setShowWinnerAnnouncement}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="text-6xl mb-4">🏐🏆</div>
            <DialogHeader>
              <DialogTitle className="text-2xl text-center">Match Complete!</DialogTitle>
            </DialogHeader>
            {winnerInfo && (
              <div className="mt-4">
                <p className="text-lg text-gray-600 mb-2">Winner</p>
                <h3 className="text-3xl font-bold text-green-600 mb-4">{winnerInfo.name}</h3>
                <div className="bg-gray-100 rounded-lg p-4 inline-block">
                  <p className="text-xl font-semibold">
                    {winnerInfo.setsWon} - {winnerInfo.setsLost}
                  </p>
                  <p className="text-sm text-gray-500">Sets</p>
                </div>
                <div className="mt-6">
                  <Button onClick={() => {
                    setShowWinnerAnnouncement(false)
                    // Reload page to show completed state
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
    </>
  )
}

