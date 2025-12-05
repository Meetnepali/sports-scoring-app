"use client"

import React, { useState, useEffect, useRef } from "react"
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
import TableTennisCourt from "@/components/table-tennis-court"
import { TossConfigurationDialog } from "@/components/table-tennis/toss-configuration-dialog"
import { useAuth } from "@/lib/auth-context"
import { updateMatchScore } from "@/lib/client-api"

interface TableTennisScoreboardProps {
  match: Match
}

export default function TableTennisScoreboard({ match }: TableTennisScoreboardProps) {
  const { toast } = useToast()
  const { isAdmin } = useAuth()
  // Default configuration (will be updated from config)
  const defaultSetsToWin = 2
  const defaultPointsToWin = 11
  const defaultTotalSets = 3 // Best of 3
  
  const initialScore = match.score ? {
    sets: Array.isArray(match.score.sets) && match.score.sets.length > 0 
      ? match.score.sets.map((set: any) => ({
          home: Number(set?.home) || 0,
          away: Number(set?.away) || 0,
          type: set?.type || "singles" // singles or doubles
        })) 
      : Array.from({ length: defaultTotalSets }, () => ({ home: 0, away: 0, type: "singles" })),
    currentSet: Number(match.score.currentSet) || 0,
    servingPlayer: match.score.servingPlayer || "home",
    pointsToWin: Number(match.score.pointsToWin) || defaultPointsToWin,
    setsToWin: Number(match.score.setsToWin) || defaultSetsToWin,
    isDoubles: match.score.isDoubles || false,
  } : {
    sets: Array.from({ length: defaultTotalSets }, () => ({ home: 0, away: 0, type: "singles" })),
    currentSet: 0,
    servingPlayer: "home",
    pointsToWin: defaultPointsToWin,
    setsToWin: defaultSetsToWin,
    isDoubles: false,
  }

  const [score, setScore] = useState(initialScore)
  const [currentSet, setCurrentSet] = useState(() => {
    const setIndex = Number(initialScore.currentSet)
    return !isNaN(setIndex) && setIndex >= 0 ? setIndex : 0
  })
  const [servingPlayer, setServingPlayer] = useState(score.servingPlayer || "home")
  const [isDoubles, setIsDoubles] = useState(score.isDoubles || false)
  const [showAnimation, setShowAnimation] = useState<{ team: "home" | "away"; value: number } | null>(null)
  const [showWinnerDialog, setShowWinnerDialog] = useState(false)
  const [winnerInfo, setWinnerInfo] = useState<{ team: "home" | "away"; name: string; setsWon: number; setsLost: number } | null>(null)
  const [tableTennisConfig, setTableTennisConfig] = useState<any>(null)
  const [showTossDialog, setShowTossDialog] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [showSetTypeDialog, setShowSetTypeDialog] = useState(false)

  // Fetch table tennis configuration on mount and when match status changes
  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoadingConfig(true)
        const response = await fetch(`/api/matches/${match.id}/table-tennis/config`)
        const data = await response.json()
        
        if (data.config) {
          setTableTennisConfig(data.config)
          
          // Initialize serving player from config if available
          if (data.config.servingTeam) {
            setServingPlayer(data.config.servingTeam)
            setScore((prev: any) => ({
              ...prev,
              servingPlayer: data.config.servingTeam,
            }))
          }
          
          // Initialize sets and points configuration from config if available
          if (data.config.setsToWin || data.config.pointsToWinPerSet) {
            setScore((prev: any) => {
              const setsToWin = data.config.setsToWin || prev.setsToWin || 2
              const pointsToWin = data.config.pointsToWinPerSet || prev.pointsToWin || 11
              const totalSets = setsToWin === 2 ? 3 : setsToWin === 3 ? 5 : 7
              // Ensure we have the correct number of sets
              let sets = prev.sets || []
              if (sets.length !== totalSets) {
                sets = Array.from({ length: totalSets }, (_, i) => sets[i] || { home: 0, away: 0, type: "singles" })
              }
              // Ensure all sets have type field
              sets = sets.map((set: any) => ({
                ...set,
                type: set.type || "singles"
              }))
              return {
                ...prev,
                sets,
                setsToWin,
                pointsToWin,
              }
            })
          }
          
          // Show toss dialog if match is started/live and config not completed
          if ((match.status === "started" || match.status === "live") && !data.config.configCompleted) {
            setShowTossDialog(true)
          }
        } else if (match.status === "started" || match.status === "live") {
          // Match is started/live but no config exists - show dialog
          setShowTossDialog(true)
        }
      } catch (error) {
        console.error("Error fetching table tennis config:", error)
      } finally {
        setLoadingConfig(false)
      }
    }

    fetchConfig()
  }, [match.id, match.status])
  
  // Watch for match status changes (when match is started) - only for admins
  useEffect(() => {
    if (isAdmin && (match.status === "started" || match.status === "live") && !loadingConfig && tableTennisConfig && !tableTennisConfig.configCompleted) {
      setShowTossDialog(true)
    }
  }, [match.status, loadingConfig, tableTennisConfig, isAdmin])

  // Sync local state with match prop changes (for live updates)
  useEffect(() => {
    if (match.score) {
      const newScore = {
        sets: Array.isArray(match.score.sets) && match.score.sets.length > 0
          ? match.score.sets.map((set: any) => ({
              home: Number(set?.home) || 0,
              away: Number(set?.away) || 0,
              type: set?.type || "singles"
            })) 
          : score.sets,
        currentSet: Number(match.score.currentSet) ?? score.currentSet,
        servingPlayer: match.score.servingPlayer || score.servingPlayer,
        pointsToWin: Number(match.score.pointsToWin) || score.pointsToWin,
        setsToWin: Number(match.score.setsToWin) || score.setsToWin,
        isDoubles: match.score.isDoubles ?? score.isDoubles,
      }
      
      // Only update if score actually changed (avoid unnecessary updates)
      if (JSON.stringify(newScore.sets) !== JSON.stringify(score.sets) ||
          newScore.currentSet !== score.currentSet ||
          newScore.servingPlayer !== score.servingPlayer) {
        setScore(newScore)
        const validSetIndex = !isNaN(newScore.currentSet) && newScore.currentSet >= 0 ? newScore.currentSet : 0
        setCurrentSet(validSetIndex)
        setServingPlayer(newScore.servingPlayer)
        setIsDoubles(newScore.isDoubles)
      }
    }
  }, [match.score, match.status])

  // Handle toss configuration completion
  const handleTossComplete = async (config: any) => {
    setTableTennisConfig((prev: any) => ({
      ...prev!,
      tossWinnerTeamId: config.tossWinnerTeamId,
      tossDecision: config.tossDecision,
      selectedTableSide: config.selectedTableSide,
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

  // Update score for a team with official table tennis rules
  const updateScore = (team: "home" | "away", amount: number) => {
    setScore((prevScore: any) => {
      const newSets = [...prevScore.sets]
      
      // Safety check: ensure current set exists
      if (!newSets[currentSet]) {
        console.error(`Set at index ${currentSet} does not exist`)
        return prevScore
      }
      
      const currentScore = Number(newSets[currentSet][team]) || 0
      const opponentTeam = team === "home" ? "away" : "home"
      const opponentScore = Number(newSets[currentSet][opponentTeam]) || 0

      if (currentScore + amount < 0) return prevScore

      newSets[currentSet] = {
        ...newSets[currentSet],
        [team]: currentScore + amount,
      }

      // Show animation for point
      if (amount > 0) {
        setShowAnimation({ team, value: amount })
        setTimeout(() => setShowAnimation(null), 1000)
      }

      const newScore = currentScore + amount
      const totalPoints = newScore + opponentScore
      const isDeuce = newScore >= 10 && opponentScore >= 10

      // OFFICIAL SERVER ROTATION RULES
      // - Every 2 points during normal play (0-10)
      // - Every 1 point during deuce (10-10 or higher)
      let newServingPlayer = servingPlayer
      if (amount > 0) {
        if (isDeuce) {
          // In deuce, alternate every point
          newServingPlayer = servingPlayer === "home" ? "away" : "home"
        } else {
          // Normal play: alternate every 2 points
          if (totalPoints % 2 === 0) {
            newServingPlayer = servingPlayer === "home" ? "away" : "home"
          }
        }
        setServingPlayer(newServingPlayer)
      }

      const pointsToWin = prevScore.pointsToWin || tableTennisConfig?.pointsToWinPerSet || 11

      // Check if set is won (OFFICIAL RULES: First to pointsToWin, win by 2)
      if (amount > 0 && newScore >= pointsToWin && newScore - opponentScore >= 2) {
        // SET WON!
        const { homeWins, awayWins } = getSetWinsFromSets(newSets, pointsToWin)
        const setsToWin = prevScore.setsToWin || tableTennisConfig?.setsToWin || 4

        // Check if match is won (best of 7)
        if (homeWins >= setsToWin || awayWins >= setsToWin) {
          // MATCH COMPLETE - Call API to complete match
          const winnerId = team === "home" ? match.homeTeam.id : match.awayTeam.id
          const winnerName = team === "home" ? match.homeTeam.name : match.awayTeam.name
          const finalScore = {
            sets: newSets,
            homeWins,
            awayWins,
            currentSet,
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
                setsWon: team === "home" ? homeWins : awayWins,
                setsLost: team === "home" ? awayWins : homeWins,
              })
              setShowWinnerDialog(true)

              toast({
                title: "🏓 Match Complete!",
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
          // Move to next set
          const nextSet = currentSet + 1
          if (nextSet < newSets.length) {
            setTimeout(() => {
              // Check if next set has a type set, if not show dialog
              if (!newSets[nextSet]?.type) {
                setCurrentSet(nextSet)
                setServingPlayer(servingPlayer === "home" ? "away" : "home") // Alternate server
                setShowSetTypeDialog(true)
              } else {
                setCurrentSet(nextSet)
                setServingPlayer(servingPlayer === "home" ? "away" : "home") // Alternate server
                setIsDoubles(newSets[nextSet].type === "doubles")
                alert(`Set ${currentSet + 1} complete! ${team === "home" ? match.homeTeam.name : match.awayTeam.name} wins ${newScore}-${opponentScore}. Moving to Set ${nextSet + 1}.`)
              }
            }, 500)
          }
        }
      }

      return {
        ...prevScore,
        sets: newSets,
        servingPlayer: newServingPlayer,
      }
    })
  }

  // Helper function to calculate set wins
  const getSetWinsFromSets = (sets: any[], pointsToWin: number) => {
    let homeWins = 0
    let awayWins = 0

    sets.forEach((set: any) => {
      const homeScore = Number(set.home) || 0
      const awayScore = Number(set.away) || 0
      
      if (homeScore >= pointsToWin && homeScore - awayScore >= 2) {
        homeWins++
      } else if (awayScore >= pointsToWin && awayScore - homeScore >= 2) {
        awayWins++
      }
    })

    return { homeWins, awayWins }
  }

  // Toggle doubles mode
  const toggleDoublesMode = (enabled: boolean) => {
    setIsDoubles(enabled)
    setScore((prevScore: any) => {
      const newSets = [...prevScore.sets]
      if (newSets[currentSet]) {
        newSets[currentSet] = {
          ...newSets[currentSet],
          type: enabled ? "doubles" : "singles"
        }
      }
      return {
        ...prevScore,
        isDoubles: enabled,
        sets: newSets,
      }
    })
  }

  // Handle set type selection before starting a set
  const handleSetTypeSelect = (setType: "singles" | "doubles") => {
    setScore((prevScore: any) => {
      const newSets = [...prevScore.sets]
      const targetSetIndex = currentSet
      if (newSets[targetSetIndex]) {
        newSets[targetSetIndex] = {
          ...newSets[targetSetIndex],
          type: setType
        }
      }
      return {
        ...prevScore,
        sets: newSets,
      }
    })
    setIsDoubles(setType === "doubles")
    setShowSetTypeDialog(false)
  }

  // Enable scoring if match is live (or was started and config is completed) and config is completed AND user is admin
  const canScore = isAdmin && (match.status === "live" || (match.status === "started" && tableTennisConfig?.configCompleted)) && tableTennisConfig?.configCompleted

  // Check if we need to ask for set type when switching to a set (only for admins)
  useEffect(() => {
    if (isAdmin && canScore && score.sets[currentSet] && !score.sets[currentSet].type) {
      setShowSetTypeDialog(true)
    } else if (canScore && score.sets[currentSet]?.type) {
      setIsDoubles(score.sets[currentSet].type === "doubles")
    }
  }, [currentSet, canScore, isAdmin])

  // Persist score changes to database (with debouncing)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    // Only persist if admin is actively scoring
    if (!isAdmin || !canScore) return
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Debounce the save operation (wait 500ms after last change)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const scoreToSave = {
          sets: score.sets,
          currentSet,
          servingPlayer,
          pointsToWin: score.pointsToWin,
          setsToWin: score.setsToWin,
          isDoubles,
        }
        await updateMatchScore(match.id, scoreToSave)
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
  }, [score.sets, currentSet, servingPlayer, score.pointsToWin, score.setsToWin, isDoubles, isAdmin, canScore, match.id])

  // Get set wins
  const getSetWins = () => {
    const pointsToWin = score.pointsToWin || tableTennisConfig?.pointsToWinPerSet || 11
    return getSetWinsFromSets(score.sets, pointsToWin)
  }

  const { homeWins, awayWins } = getSetWins()
  const setsToWin = score.setsToWin || tableTennisConfig?.setsToWin || 4
  const pointsToWin = score.pointsToWin || tableTennisConfig?.pointsToWinPerSet || 11
  const totalSets = setsToWin === 2 ? 3 : setsToWin === 3 ? 5 : 7
  const matchWinner = homeWins >= setsToWin ? "home" : awayWins >= setsToWin ? "away" : null

  // Show message if match is scheduled
  if (match.status === "scheduled") {
    return (
      <Card className="shadow-lg border-t-4 border-t-green-600">
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-center text-xl md:text-2xl">Table Tennis Scoreboard</CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600 text-lg">Match is scheduled. Start the match to begin configuration.</p>
        </CardContent>
      </Card>
    )
  }

  // Show message if config not completed (toss dialog will show automatically)
  if ((match.status === "started" || match.status === "live") && tableTennisConfig && !tableTennisConfig.configCompleted && !showTossDialog) {
    return (
      <Card className="shadow-lg border-t-4 border-t-green-600">
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-center text-xl md:text-2xl">Table Tennis Scoreboard</CardTitle>
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
    <Card className="shadow-lg border-t-4 border-t-green-600 relative">
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
        <CardTitle className="text-center text-xl md:text-2xl">Table Tennis Scoreboard</CardTitle>
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
            <TableTennisCourt
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              servingPlayer={servingPlayer}
              currentSet={currentSet}
              sets={score.sets}
              isDoubles={isDoubles}
            />

            {/* Main Score Display */}
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

            {/* Current Set Score - Visible to Everyone */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold mb-4 text-center">{match.homeTeam.name}</h3>
                <div className="text-center text-4xl font-bold mb-4">{score.sets[currentSet]?.home || 0}</div>
                {canScore && isAdmin && (
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => updateScore("home", -1)}>
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => updateScore("home", 1)}>
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold mb-4 text-center">{match.awayTeam.name}</h3>
                <div className="text-center text-4xl font-bold mb-4">{score.sets[currentSet]?.away || 0}</div>
                {canScore && isAdmin && (
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => updateScore("away", -1)}>
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => updateScore("away", 1)}>
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Set Information - Visible to Everyone */}
            <div className="text-center mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Badge variant={score.sets[currentSet]?.type === "doubles" ? "default" : "outline"}>
                  {score.sets[currentSet]?.type === "doubles" ? "Doubles" : "Singles"}
                </Badge>
                {!isAdmin && (
                  <Badge variant="outline" className="bg-gray-100 text-gray-600">
                    Read-Only
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium text-green-900">
                Set {currentSet + 1} of {totalSets} • First to {pointsToWin} points (win by 2) • Best of {totalSets} sets
              </p>
              {(score.sets[currentSet]?.home || 0) >= pointsToWin - 1 && (score.sets[currentSet]?.away || 0) >= pointsToWin - 1 ? (
                <p className="text-xs text-green-700 mt-1">
                  ⚡ Deuce! Server alternates every point. Win by 2 required!
                </p>
              ) : (
                <p className="text-xs text-green-700 mt-1">
                  Server alternates every 2 points
                </p>
              )}
            </div>
            
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
            {/* Current Set Type */}
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Set {currentSet + 1}: {score.sets[currentSet]?.type === "doubles" ? "Doubles" : "Singles"}
              </Badge>
            </div>

            {/* Current Set Score */}
            <div className="bg-gray-50 p-6 rounded-lg border">
              <div className="text-center mb-2">
                <h3 className="font-semibold">Current Set: {currentSet + 1}</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`text-5xl font-bold ${servingPlayer === "home" ? "text-red-600" : ""}`}>
                    {score.sets[currentSet]?.home || 0}
                    {servingPlayer === "home" && <span className="text-xl ml-1">•</span>}
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="text-xl font-bold">-</div>
                </div>

                <div className="text-center">
                  <div className={`text-5xl font-bold ${servingPlayer === "away" ? "text-blue-600" : ""}`}>
                    {score.sets[currentSet]?.away || 0}
                    {servingPlayer === "away" && <span className="text-xl ml-1">•</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Set History */}
            <div>
              <h3 className="font-semibold mb-4">Set History</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 text-left">Set</th>
                      <th className="p-2 text-center">Type</th>
                      <th className="p-2 text-center">{match.homeTeam.name}</th>
                      <th className="p-2 text-center">{match.awayTeam.name}</th>
                      <th className="p-2 text-center">Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {score.sets.map((set: any, index: number) => {
                      const pointsToWinPerSet = score.pointsToWin || tableTennisConfig?.pointsToWinPerSet || 11
                      let winner = null
                      if (set.home >= pointsToWinPerSet && set.home - set.away >= 2) {
                        winner = "home"
                      } else if (set.away >= pointsToWinPerSet && set.away - set.home >= 2) {
                        winner = "away"
                      }
                      const setType = set.type || "singles"

                      return (
                        <tr key={index} className={index === currentSet ? "bg-green-50" : ""}>
                          <td className="p-2 border-b">{index + 1}</td>
                          <td className="p-2 border-b text-center">
                            <Badge variant={setType === "doubles" ? "default" : "outline"} className="text-xs">
                              {setType === "doubles" ? "Doubles" : "Singles"}
                            </Badge>
                          </td>
                          <td className="p-2 border-b text-center font-semibold">{set.home}</td>
                          <td className="p-2 border-b text-center font-semibold">{set.away}</td>
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
                <div className="text-center text-4xl font-bold mb-4">{score.sets[currentSet]?.home || 0}</div>
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
                <div className="text-center text-4xl font-bold mb-4">{score.sets[currentSet]?.away || 0}</div>
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
              {score.sets.map((_: any, index: number) => (
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
          </TabsContent>
          )}
        </Tabs>
      </CardContent>

      {/* Winner Announcement Dialog */}
      <Dialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="text-6xl mb-4">🏓🏆</div>
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

      {/* Set Type Selection Dialog - Only for admins */}
      {isAdmin && (
        <Dialog open={showSetTypeDialog} onOpenChange={setShowSetTypeDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Select Set Type for Set {currentSet + 1}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                What type of set will be played for Set {currentSet + 1}?
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => handleSetTypeSelect("singles")}
                >
                  <Users className="h-6 w-6" />
                  <span className="font-semibold">Singles</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => handleSetTypeSelect("doubles")}
                >
                  <Users className="h-6 w-6" />
                  <span className="font-semibold">Doubles</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}
