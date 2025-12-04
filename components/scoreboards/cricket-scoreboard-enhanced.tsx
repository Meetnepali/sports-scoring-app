"use client"

import React, { useState, useEffect } from "react"
import type { Match } from "@/lib/static-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Undo2, Trophy, AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { TossConfigurationDialog } from "@/components/cricket/toss-configuration-dialog"
import { CricketScorecardTab } from "@/components/cricket/cricket-scorecard-tab"
import { ManOfMatchSelector } from "@/components/cricket/man-of-match-selector"
import { useAuth } from "@/lib/auth-context"
import {
  formatOvers,
  ballsToOvers,
  oversToTotalBalls,
  checkInningsComplete,
  calculateMatchWinner,
  checkBowlerOverLimit,
  calculateRunRate,
  calculateRequiredRunRate,
} from "@/lib/cricket-match-logic"

interface CricketScoreboardProps {
  match: Match
}

interface CricketConfig {
  total_overs: number
  max_overs_per_bowler: number
  config_completed: boolean
  elected_to_bat_first_team_id: string
}

interface PlayerStats {
  [playerId: string]: {
    runs: number
    balls: number
    isOut: boolean
  }
}

interface BowlerStats {
  [bowlerId: string]: {
    overs: number
    balls: number
  }
}

export default function CricketScoreboardEnhanced({ match }: CricketScoreboardProps) {
  const { toast } = useToast()
  const { isAdmin } = useAuth()
  
  // Toss and configuration
  const [showTossDialog, setShowTossDialog] = useState(false)
  const [config, setConfig] = useState<CricketConfig | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(true)
  
  // Match state
  const initialScore = match.score || {
    innings: [
      {
        team: match.homeTeam.id,
        runs: 0,
        wickets: 0,
        overs: 0,
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
      },
      {
        team: match.awayTeam.id,
        runs: 0,
        wickets: 0,
        overs: 0,
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
      },
    ],
    currentInnings: 0,
  }

  const [score, setScore] = useState(initialScore)
  const [currentInnings, setCurrentInnings] = useState(score.currentInnings || 0)
  const [striker, setStriker] = useState("")
  const [nonStriker, setNonStriker] = useState("")
  const [currentBowler, setCurrentBowler] = useState("")
  const [lastBowler, setLastBowler] = useState<string | null>(null) // Track last bowler to prevent consecutive overs
  const [overCompleteRequiresBowler, setOverCompleteRequiresBowler] = useState(false) // Flag when over completes and needs new bowler
  const [scoreHistory, setScoreHistory] = useState<any[]>([])
  const [showAnimation, setShowAnimation] = useState<{ type: string; value: number } | null>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStats>({})
  const [bowlerStats, setBowlerStats] = useState<BowlerStats>({})
  const [matchCompleted, setMatchCompleted] = useState(false)
  const [showManOfMatch, setShowManOfMatch] = useState(false)

  // Determine batting and bowling teams
  const battingTeamId = config?.elected_to_bat_first_team_id
    ? currentInnings === 0
      ? config.elected_to_bat_first_team_id
      : config.elected_to_bat_first_team_id === match.homeTeam.id
      ? match.awayTeam.id
      : match.homeTeam.id
    : currentInnings === 0
    ? match.homeTeam.id
    : match.awayTeam.id

  const battingTeam = battingTeamId === match.homeTeam.id ? match.homeTeam : match.awayTeam
  const bowlingTeam = battingTeamId === match.homeTeam.id ? match.awayTeam : match.homeTeam
  const currentInningsData = score.innings[currentInnings]

  // Load configuration on mount
  useEffect(() => {
    fetchConfig()
  }, [match.id])

  const fetchConfig = async () => {
    try {
      setLoadingConfig(true)
      const response = await fetch(`/api/matches/${match.id}/cricket/config`)
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
        
        // Check if we need to show toss dialog
        // Only show if: match is started/live AND config exists AND config not completed
        if (isAdmin && (match.status === "started" || match.status === "live") && data.config && !data.config.config_completed) {
          setShowTossDialog(true)
        }
      } else if (match.status === "started" || match.status === "live") {
        // Match is live but no config exists - this shouldn't happen
        // but we'll show a message
        console.warn("Match is live but no cricket config found")
      }
    } catch (error) {
      console.error("Error fetching config:", error)
    } finally {
      setLoadingConfig(false)
    }
  }
  
  // Watch for match status changes (e.g., when match is started) - only for admins
  useEffect(() => {
    if (isAdmin && (match.status === "started" || match.status === "live") && !loadingConfig && config && !config.config_completed) {
      setShowTossDialog(true)
    }
  }, [match.status, isAdmin, loadingConfig, config])

  const handleTossComplete = async (tossConfig: any) => {
    // Update config
    setConfig({
      ...config!,
      config_completed: true,
      elected_to_bat_first_team_id: tossConfig.electedToBatFirstTeamId,
    })
    setShowTossDialog(false)
    
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
        title: "Match Started!",
        description: "You can now begin scoring",
      })
    }
  }

  // Save state for undo
  const saveState = () => {
    setScoreHistory((prev) => [...prev, JSON.parse(JSON.stringify(score))].slice(-10))
  }

  // Undo last action
  const undoLastAction = () => {
    if (scoreHistory.length > 0) {
      const previousState = scoreHistory[scoreHistory.length - 1]
      setScoreHistory((prev) => prev.slice(0, -1))
      setScore(previousState)
      
      toast({
        title: "Undo Successful",
        description: "Last action has been reversed",
      })
    }
  }

  // Check if player can bat (not already out)
  const canPlayerBat = (playerId: string): boolean => {
    return !playerStats[playerId]?.isOut
  }

  // Check if bowler can bowl more
  const canBowlerBowl = (bowlerId: string): boolean => {
    if (!config) return true
    const bowlerOvers = bowlerStats[bowlerId]?.overs || 0
    return !checkBowlerOverLimit(bowlerOvers, config.max_overs_per_bowler)
  }

  // Get available batsmen (not out)
  const getAvailableBatsmen = () => {
    return battingTeam.players.filter((p) => canPlayerBat(p.id))
  }

  // Get available bowlers (under limit, and not the last bowler if over just completed)
  const getAvailableBowlers = () => {
    return bowlingTeam.players.filter((p) => {
      // Check if bowler can bowl (under limit)
      if (!canBowlerBowl(p.id)) return false
      
      // Cannot select the last bowler if over just completed (prevent consecutive overs)
      if (overCompleteRequiresBowler && lastBowler && p.id === lastBowler) {
        return false
      }
      
      return true
    })
  }

    // Record ball to database
    const recordBallToDb = async (ballData: any) => {
      try {
        await fetch(`/api/matches/${match.id}/cricket/ball`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ballData),
        })
      } catch (error) {
        console.error("Error recording ball:", error)
        toast({
          title: "Database Error",
          description: "Failed to save ball data. The score is updated locally.",
          variant: "destructive",
        })
      }
    }

    // Save score to database
    const saveScoreToDb = async (scoreToSave: any) => {
      try {
        await fetch(`/api/matches/${match.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: scoreToSave }),
        })
      } catch (error) {
        console.error("Error saving score:", error)
        // Don't show toast for score saves - it's less critical than ball data
      }
    }

  // Record runs
  const recordRuns = async (runs: number) => {
    if (!striker || !currentBowler) {
      toast({
        title: "Missing Selection",
        description: "Please select striker and bowler first!",
        variant: "destructive",
      })
      return
    }

    if (!canPlayerBat(striker)) {
      toast({
        title: "Player Out",
        description: "This player is already out and cannot bat!",
        variant: "destructive",
      })
      return
    }

    saveState()

    const newScore = JSON.parse(JSON.stringify(score))
    const innings = newScore.innings[currentInnings]
    
    // Add runs to total
    innings.runs += runs
    
    // Add ball to over count
    const totalBalls = oversToTotalBalls(innings.overs)
    innings.overs = ballsToOvers(totalBalls + 1)
    
    // Update player stats
    setPlayerStats((prev) => ({
      ...prev,
      [striker]: {
        runs: (prev[striker]?.runs || 0) + runs,
        balls: (prev[striker]?.balls || 0) + 1,
        isOut: false,
      },
    }))

    // Update bowler stats
    setBowlerStats((prev) => ({
      ...prev,
      [currentBowler]: {
        overs: ballsToOvers((prev[currentBowler]?.balls || 0) + 1),
        balls: (prev[currentBowler]?.balls || 0) + 1,
      },
    }))
    
    // Record to database
    await recordBallToDb({
      inningsNumber: currentInnings + 1,
      overNumber: Math.floor(totalBalls / 6),
      ballNumber: (totalBalls % 6) + 1,
      bowlerId: currentBowler,
      batsmanStrikerId: striker,
      batsmanNonStrikerId: nonStriker,
      runsScored: runs,
      extraType: null,
      extraRuns: 0,
      isWicket: false,
    })

    // Swap strike if odd runs
    if (runs % 2 === 1) {
      const temp = striker
      setStriker(nonStriker)
      setNonStriker(temp)
    }
    
    // Check if over complete (6 balls)
    if ((totalBalls + 1) % 6 === 0) {
      // Over complete - swap strike
      const temp = striker
      setStriker(nonStriker)
      setNonStriker(temp)
      
      // Set last bowler and require new bowler selection
      setLastBowler(currentBowler)
      setCurrentBowler("") // Clear current bowler - must select new one
      setOverCompleteRequiresBowler(true)
      
      toast({
        title: "Over Complete!",
        description: "Please select a new bowler (cannot be the same bowler).",
        variant: "default",
      })
    }

    // Show animation for boundaries
    if (runs === 4 || runs === 6) {
      setShowAnimation({ type: "boundary", value: runs })
      setTimeout(() => setShowAnimation(null), 1500)
    }
    
    setScore(newScore)
    
    // Save score to database
    saveScoreToDb(newScore)

    // Check innings completion
    if (config) {
      const targetRuns = currentInnings === 1 ? score.innings[0].runs : undefined
      const completionCheck = checkInningsComplete(
        { ...innings, runs: innings.runs + runs, overs: ballsToOvers(totalBalls + 1) },
        config.total_overs,
        currentInnings === 1,
        targetRuns
      )

      if (completionCheck.isComplete) {
        setTimeout(() => handleInningsComplete(completionCheck.reason), 1000)
      }
    }
  }

  // Record wicket
  const recordWicket = async () => {
    if (!striker || !currentBowler) {
      toast({
        title: "Missing Selection",
        description: "Please select striker and bowler first!",
        variant: "destructive",
      })
      return
    }

    saveState()

    const newScore = JSON.parse(JSON.stringify(score))
    const innings = newScore.innings[currentInnings]
    
    if (innings.wickets < 10) {
      innings.wickets += 1
      
      // Add ball to over
      const totalBalls = oversToTotalBalls(innings.overs)
      innings.overs = ballsToOvers(totalBalls + 1)
      
      // Update player stats - mark as out
      setPlayerStats((prev) => ({
        ...prev,
        [striker]: {
          runs: prev[striker]?.runs || 0,
          balls: (prev[striker]?.balls || 0) + 1,
          isOut: true,
        },
      }))

      // Update bowler stats
      setBowlerStats((prev) => ({
        ...prev,
        [currentBowler]: {
          overs: ballsToOvers((prev[currentBowler]?.balls || 0) + 1),
          balls: (prev[currentBowler]?.balls || 0) + 1,
        },
      }))
      
      // Record to database
      await recordBallToDb({
        inningsNumber: currentInnings + 1,
        overNumber: Math.floor(totalBalls / 6),
        ballNumber: (totalBalls % 6) + 1,
        bowlerId: currentBowler,
        batsmanStrikerId: striker,
        batsmanNonStrikerId: nonStriker,
        runsScored: 0,
        extraType: null,
        extraRuns: 0,
        isWicket: true,
        wicketType: "bowled", // Default wicket type - can be changed to other valid types like 'caught', 'lbw', etc.
        wicketPlayerId: striker,
      })
      
      // Check if over complete
      const wasOverComplete = (totalBalls + 1) % 6 === 0
      if (wasOverComplete) {
        // Over complete - swap strike
        const temp = striker
        setStriker(nonStriker)
        setNonStriker(temp)
        
        // Set last bowler and require new bowler selection
        setLastBowler(currentBowler)
        setCurrentBowler("") // Clear current bowler - must select new one
        setOverCompleteRequiresBowler(true)
      }
      
      // Show wicket animation
      setShowAnimation({ type: "wicket", value: 1 })
      setTimeout(() => setShowAnimation(null), 1500)
      
      // Clear striker (new batsman needs to be selected)
      setStriker("")
      
      toast({
        title: wasOverComplete ? "Wicket & Over Complete!" : "Wicket!",
        description: wasOverComplete ? "Select new batsman and new bowler (cannot be same bowler)" : "Select the next batsman",
        variant: "default",
      })
    }
    
    setScore(newScore)
    
    // Save score to database
    saveScoreToDb(newScore)

    // Check innings completion
    if (config) {
      const targetRuns = currentInnings === 1 ? score.innings[0].runs : undefined
      const completionCheck = checkInningsComplete(
        { ...innings, wickets: innings.wickets + 1, overs: ballsToOvers(oversToTotalBalls(innings.overs) + 1) },
        config.total_overs,
        currentInnings === 1,
        targetRuns
      )

      if (completionCheck.isComplete) {
        setTimeout(() => handleInningsComplete(completionCheck.reason), 1000)
      }
    }
  }

  // Record extras
  const recordExtra = async (type: "wides" | "noBalls" | "byes" | "legByes", runs: number = 1) => {
    if (!currentBowler) {
      toast({
        title: "Missing Selection",
        description: "Please select bowler first!",
        variant: "destructive",
      })
      return
    }

    saveState()

    const newScore = JSON.parse(JSON.stringify(score))
    const innings = newScore.innings[currentInnings]
    
    // Add to extras
    innings.extras[type] += runs
    
    // Add runs to total (for wides and no-balls)
    if (type === "wides" || type === "noBalls") {
      innings.runs += runs
    }
    
      // Only add ball to over if not wide/no-ball
      const isLegalBall = type === "byes" || type === "legByes"
      let wasOverComplete = false
      if (isLegalBall) {
        const totalBalls = oversToTotalBalls(innings.overs)
        innings.overs = ballsToOvers(totalBalls + 1)
        
        // Check if over complete
        wasOverComplete = (totalBalls + 1) % 6 === 0
        if (wasOverComplete) {
          // Over complete - swap strike
          const temp = striker
          setStriker(nonStriker)
          setNonStriker(temp)
          
          // Set last bowler and require new bowler selection
          setLastBowler(currentBowler)
          setCurrentBowler("") // Clear current bowler - must select new one
          setOverCompleteRequiresBowler(true)
        }
      }

      // Record to database - use current over state
      const totalBalls = oversToTotalBalls(innings.overs)
    await recordBallToDb({
      inningsNumber: currentInnings + 1,
      overNumber: Math.floor(totalBalls / 6),
      ballNumber: (totalBalls % 6) + (isLegalBall ? 1 : 0),
      bowlerId: currentBowler,
      batsmanStrikerId: striker,
      batsmanNonStrikerId: nonStriker,
      runsScored: 0,
      extraType: type,
      extraRuns: runs,
      isWicket: false,
    })
    
    setScore(newScore)
    
    // Save score to database
    saveScoreToDb(newScore)
  }

  // Handle innings completion
  const handleInningsComplete = (reason?: string) => {
    if (currentInnings === 0) {
      // First innings complete, switch to second
      toast({
        title: "Innings Complete!",
        description: `${battingTeam.name} finished with ${currentInningsData.runs}/${currentInningsData.wickets}. ${bowlingTeam.name} will now bat.`,
      })
      
      const nextInnings = 1
      const updatedScore = { ...score, currentInnings: nextInnings }
      setCurrentInnings(nextInnings)
      setScore(updatedScore)
      setStriker("")
      setNonStriker("")
      setCurrentBowler("")
      setLastBowler(null) // Reset last bowler for new innings
      setOverCompleteRequiresBowler(false) // Reset over complete flag
      
      // Save score update
      saveScoreToDb(updatedScore)
    } else {
      // Second innings complete, match over
      if (config) {
        const winner = calculateMatchWinner(
          score.innings[0],
          currentInningsData,
          match.homeTeam.id,
          match.awayTeam.id,
          config.elected_to_bat_first_team_id
        )

        toast({
          title: "Match Complete!",
          description: winner.isTie ? "Match Tied!" : `${winner.winnerId === match.homeTeam.id ? match.homeTeam.name : match.awayTeam.name} won by ${winner.winMargin}`,
        })

        // Save match summary (without man of match - can be set later)
        fetch(`/api/matches/${match.id}/cricket/man-of-match`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            winnerTeamId: winner.winnerId,
            winMargin: winner.winMargin,
            matchStatus: winner.isTie ? 'tie' : 'completed',
          }),
        }).catch(err => console.error("Error saving match summary:", err))

        // Complete the match via API with full score data
        const finalScore = {
          innings: score.innings.map((inn, idx) => ({
            ...inn,
            runs: idx === 1 ? currentInningsData.runs : inn.runs,
            wickets: idx === 1 ? currentInningsData.wickets : inn.wickets,
            overs: idx === 1 ? currentInningsData.overs : inn.overs,
          })),
          currentInnings: 1,
        }
        
        fetch(`/api/matches/${match.id}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: finalScore,
            winnerId: winner.winnerId,
          }),
        }).catch(err => console.error("Error completing match:", err))

        // Automatically change match status to "completed"
        fetch(`/api/matches/${match.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        }).catch(err => console.error("Error updating match status:", err))

        setMatchCompleted(true)
        
        // Show man of match dialog (but don't block - can be set later)
        setTimeout(() => {
          setShowManOfMatch(true)
        }, 2000)
      }
    }
  }

  // Manual innings switch
  const switchInnings = () => {
    if (confirm("Switch to next innings? This cannot be undone.")) {
      handleInningsComplete()
    }
  }

  // Get current over balls for display
  const getCurrentOverBalls = () => {
    const totalBalls = oversToTotalBalls(currentInningsData.overs)
    const ballsInOver = totalBalls % 6
    return Array.from({ length: 6 }, (_, i) => ({
      bowled: i < ballsInOver,
      current: i === ballsInOver,
    }))
  }

  const runRate = config ? calculateRunRate(currentInningsData.runs, currentInningsData.overs) : 0
  const requiredRunRate =
    config && currentInnings === 1
      ? calculateRequiredRunRate(
          score.innings[0].runs,
          currentInningsData.runs,
          currentInningsData.overs,
          config.total_overs
        )
      : 0

  const totalExtras = Object.values(currentInningsData.extras || {}).reduce(
    (a: number, b: number) => a + b,
    0
  )

  // Show toss dialog if needed
  if (showTossDialog && config) {
    return (
      <TossConfigurationDialog
        open={showTossDialog}
        matchId={match.id}
        homeTeam={match.homeTeam}
        awayTeam={match.awayTeam}
        totalOvers={config.total_overs}
        maxOversPerBowler={config.max_overs_per_bowler}
        onComplete={handleTossComplete}
        onCancel={() => setShowTossDialog(false)}
      />
    )
  }

  // Show man of match dialog if match complete
  if (showManOfMatch) {
    return (
      <ManOfMatchSelector
        open={showManOfMatch}
        matchId={match.id}
        onComplete={() => {
          setShowManOfMatch(false)
          toast({
            title: "Match Finalized",
            description: "View the complete scorecard in the Scorecard tab",
          })
        }}
        onCancel={() => setShowManOfMatch(false)}
      />
    )
  }

  // Show loading state while config is being fetched
  if (loadingConfig) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-12 text-center">
          <div className="text-gray-500">Loading match configuration...</div>
        </CardContent>
      </Card>
    )
  }

  // Match not started yet - show scheduled state
  if (match.status === "scheduled") {
    return (
      <Card className="shadow-lg">
        <CardHeader className="bg-muted">
          <CardTitle className="text-center text-xl">Cricket Scoreboard</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team 1 Score */}
            <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
              <h3 className="font-bold text-lg mb-3">{match.homeTeam.name}</h3>
              <div className="text-5xl font-bold mb-2">
                {score.innings[0].runs}/{score.innings[0].wickets}
              </div>
              <div className="text-gray-600">({formatOvers(score.innings[0].overs)} overs)</div>
            </div>

            {/* Team 2 Score */}
            <div className="text-center p-6 bg-green-50 rounded-lg border-2 border-green-200">
              <h3 className="font-bold text-lg mb-3">{match.awayTeam.name}</h3>
              <div className="text-5xl font-bold mb-2">
                {score.innings[1].runs}/{score.innings[1].wickets}
              </div>
              <div className="text-gray-600">({formatOvers(score.innings[1].overs)} overs)</div>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-gray-500">Match is scheduled. Start the match to begin configuration.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Match started/live but config doesn't exist
  if ((match.status === "started" || match.status === "live") && !config) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-12 text-center">
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 font-semibold">Match configuration missing!</p>
            <p className="text-sm text-red-600 mt-1">
              Please ensure the match was created with cricket configuration (total overs and bowler limits).
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Config exists but toss not completed
  // Dialog will be shown automatically via useEffect, but show placeholder if dialog closed
  if (!config.config_completed && !showTossDialog) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Toss Required</h3>
          <p className="text-gray-600 mb-4">
            {match.status === "started" 
              ? "Complete the toss to begin scoring. Match status will change to 'live' after toss."
              : "Complete the toss to begin scoring"}
          </p>
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
  
  // Scoring interface should only be accessible when status is "live" and config is completed
  // If status is "started" but config is completed (shouldn't happen, but safety check)
  if (match.status === "started" && config.config_completed) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Match Status Update Required</h3>
          <p className="text-gray-600 mb-4">Toss is completed. Please refresh the page to update match status to 'live'.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="scoring" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="scoring">Live Scoring</TabsTrigger>
        <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
      </TabsList>

      <TabsContent value="scoring">
        <Card className="shadow-lg relative overflow-hidden">
          {/* Animations */}
          {showAnimation?.type === "boundary" && (
            <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/20">
              <div className="bg-green-500 text-white text-6xl font-bold rounded-2xl px-12 py-8 shadow-2xl animate-bounce">
                {showAnimation.value === 4 ? "FOUR!" : "SIX!"}
              </div>
            </div>
          )}
          
          {showAnimation?.type === "wicket" && (
            <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/20">
              <div className="bg-red-600 text-white text-5xl font-bold rounded-2xl px-12 py-8 shadow-2xl animate-pulse">
                WICKET!
              </div>
            </div>
          )}

          <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
            <CardTitle className="text-center text-2xl flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6" />
              {config.total_overs} Over Match - Innings {currentInnings + 1}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-4 space-y-4">
            {/* Score Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Team 1 (Home Team) */}
              <div
                className={`p-6 rounded-lg border-2 ${
                  battingTeamId === match.homeTeam.id
                    ? "bg-blue-50 border-blue-400 shadow-lg"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg">{match.homeTeam.name}</h3>
                  {battingTeamId === match.homeTeam.id && (
                    <Badge className="bg-blue-600">Batting</Badge>
                  )}
                </div>
                <div className="text-5xl font-bold">
                  {(() => {
                    // Determine which innings index contains home team's score
                    const firstBatTeamId = config?.elected_to_bat_first_team_id || match.homeTeam.id
                    const homeTeamInningsIndex = firstBatTeamId === match.homeTeam.id ? 0 : 1
                    const homeInnings = score.innings[homeTeamInningsIndex] || score.innings[0]
                    return `${homeInnings.runs}/${homeInnings.wickets}`
                  })()}
                </div>
                <div className="text-gray-600 text-sm mt-1">
                  ({(() => {
                    const firstBatTeamId = config?.elected_to_bat_first_team_id || match.homeTeam.id
                    const homeTeamInningsIndex = firstBatTeamId === match.homeTeam.id ? 0 : 1
                    const homeInnings = score.innings[homeTeamInningsIndex] || score.innings[0]
                    return formatOvers(homeInnings.overs)
                  })()} overs)
                </div>
              </div>

              {/* Team 2 (Away Team) */}
              <div
                className={`p-6 rounded-lg border-2 ${
                  battingTeamId === match.awayTeam.id
                    ? "bg-blue-50 border-blue-400 shadow-lg"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg">{match.awayTeam.name}</h3>
                  {battingTeamId === match.awayTeam.id && (
                    <Badge className="bg-blue-600">Batting</Badge>
                  )}
                </div>
                <div className="text-5xl font-bold">
                  {(() => {
                    // Determine which innings index contains away team's score
                    const firstBatTeamId = config?.elected_to_bat_first_team_id || match.homeTeam.id
                    const awayTeamInningsIndex = firstBatTeamId === match.awayTeam.id ? 0 : 1
                    const awayInnings = score.innings[awayTeamInningsIndex] || score.innings[1]
                    return `${awayInnings.runs}/${awayInnings.wickets}`
                  })()}
                </div>
                <div className="text-gray-600 text-sm mt-1">
                  ({(() => {
                    const firstBatTeamId = config?.elected_to_bat_first_team_id || match.homeTeam.id
                    const awayTeamInningsIndex = firstBatTeamId === match.awayTeam.id ? 0 : 1
                    const awayInnings = score.innings[awayTeamInningsIndex] || score.innings[1]
                    return formatOvers(awayInnings.overs)
                  })()} overs)
                </div>
              </div>
            </div>

            {/* Match Situation */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div>
                  <div className="text-xs text-gray-600">Current Over</div>
                  <div className="font-bold text-lg">{formatOvers(currentInningsData.overs)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Run Rate</div>
                  <div className="font-bold text-lg">{runRate.toFixed(2)}</div>
                </div>
                {currentInnings === 1 && (
                  <>
                    <div>
                      <div className="text-xs text-gray-600">Required RR</div>
                      <div className="font-bold text-lg">{requiredRunRate.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Need</div>
                      <div className="font-bold text-lg">
                        {score.innings[0].runs - currentInningsData.runs + 1} runs
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2 justify-center mt-3">
                {getCurrentOverBalls().map((ball, i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      ball.current
                        ? "bg-blue-500 text-white animate-pulse"
                        : ball.bowled
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Player Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
              <div>
                <label className="text-sm font-semibold mb-2 block">⚡ Striker (Batting)</label>
                <Select value={striker} onValueChange={setStriker}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select striker" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableBatsmen().map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name}
                        {playerStats[player.id] && ` (${playerStats[player.id].runs}*)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Non-Striker</label>
                <Select value={nonStriker} onValueChange={setNonStriker}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select non-striker" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableBatsmen().map((player) => (
                      <SelectItem key={player.id} value={player.id} disabled={player.id === striker}>
                        {player.name}
                        {playerStats[player.id] && ` (${playerStats[player.id].runs}*)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">🎯 Current Bowler</label>
                <Select 
                  value={currentBowler} 
                  onValueChange={(value) => {
                    setCurrentBowler(value)
                    setOverCompleteRequiresBowler(false) // Clear flag when bowler selected
                  }}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder={overCompleteRequiresBowler ? "Select new bowler (over complete)" : "Select bowler"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableBowlers().map((player) => {
                      const oversBowled = bowlerStats[player.id]?.overs || 0
                      const isLastBowler = lastBowler === player.id && overCompleteRequiresBowler
                      return (
                        <SelectItem 
                          key={player.id} 
                          value={player.id}
                          disabled={isLastBowler}
                        >
                          {player.name}
                          {oversBowled > 0 && ` (${formatOvers(oversBowled)} ov)`}
                          {isLastBowler && " - Cannot bowl consecutive overs"}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {overCompleteRequiresBowler && (
                  <p className="text-xs text-yellow-600 mt-1">
                    ⚠️ Over complete. Please select a different bowler.
                  </p>
                )}
              </div>
            </div>

            {/* Warnings */}
            {(!striker || !currentBowler) && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 text-center">
                <p className="text-red-700 font-semibold flex items-center justify-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Please select striker and bowler to start scoring
                </p>
              </div>
            )}

            {matchCompleted && (
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 text-center">
                <p className="text-green-700 font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Match Complete! View scorecard for full details.
                </p>
              </div>
            )}

            {/* Scoring Buttons */}
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-lg border-2 border-green-300">
                <h3 className="font-bold text-center mb-3 text-lg">Record Runs</h3>
                <div className="grid grid-cols-6 gap-2">
                  {[0, 1, 2, 3, 4, 6].map((run) => (
                    <Button
                      key={run}
                      onClick={() => recordRuns(run)}
                      className={`h-16 text-xl font-bold ${
                        run === 0
                          ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                          : run === 4
                          ? "bg-green-400 hover:bg-green-500 text-white"
                          : run === 6
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-blue-200 hover:bg-blue-300 text-blue-900"
                      }`}
                      disabled={!isAdmin || !striker || !currentBowler || matchCompleted || match.status !== "live"}
                    >
                      {run}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Wicket and Extras */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Wicket */}
                <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
                  <h3 className="font-bold text-center mb-3">Wicket</h3>
                  <Button
                    onClick={recordWicket}
                    className="w-full h-14 text-lg font-bold bg-red-500 hover:bg-red-600 text-white"
                    disabled={
                      !striker || !currentBowler || currentInningsData.wickets >= 10 || matchCompleted
                    }
                  >
                    OUT! (Wickets: {currentInningsData.wickets}/10)
                  </Button>
                </div>

                {/* Extras */}
                <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
                  <h3 className="font-bold text-center mb-3">Extras (Total: {totalExtras})</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => recordExtra("wides")}
                      className="h-12 bg-yellow-200 hover:bg-yellow-300 text-yellow-900"
                      disabled={!isAdmin || !currentBowler || matchCompleted || match.status !== "live"}
                    >
                      Wide
                    </Button>
                    <Button
                      onClick={() => recordExtra("noBalls")}
                      className="h-12 bg-orange-200 hover:bg-orange-300 text-orange-900"
                      disabled={!isAdmin || !currentBowler || matchCompleted || match.status !== "live"}
                    >
                      No Ball
                    </Button>
                    <Button
                      onClick={() => recordExtra("byes")}
                      className="h-12 bg-yellow-200 hover:bg-yellow-300 text-yellow-900"
                      disabled={!isAdmin || !currentBowler || matchCompleted || match.status !== "live"}
                    >
                      Bye
                    </Button>
                    <Button
                      onClick={() => recordExtra("legByes")}
                      className="h-12 bg-yellow-200 hover:bg-yellow-300 text-yellow-900"
                      disabled={!isAdmin || !currentBowler || matchCompleted || match.status !== "live"}
                    >
                      Leg Bye
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {scoreHistory.length > 0 && (
                <Button
                  variant="outline"
                  onClick={undoLastAction}
                  className="flex items-center gap-2"
                  disabled={!isAdmin || matchCompleted || match.status !== "live"}
                >
                  <Undo2 className="h-4 w-4" />
                  Undo
                </Button>
              )}
              {currentInnings === 0 && !matchCompleted && (
                <Button
                  variant="outline"
                  onClick={switchInnings}
                  className="bg-purple-100 hover:bg-purple-200"
                >
                  End Innings & Switch
                </Button>
              )}
              {matchCompleted && (
                <Button onClick={() => setShowManOfMatch(true)} className="bg-yellow-500 hover:bg-yellow-600">
                  Select Man of the Match
                </Button>
              )}
            </div>

            {/* Extras Summary */}
            <div className="bg-gray-50 p-3 rounded-lg border text-sm">
              <div className="flex justify-between">
                <span>Extras Breakdown:</span>
                <span>
                  W: {currentInningsData.extras?.wides || 0} | NB:{" "}
                  {currentInningsData.extras?.noBalls || 0} | B: {currentInningsData.extras?.byes || 0} |
                  LB: {currentInningsData.extras?.legByes || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="scorecard">
        <CricketScorecardTab
          matchId={match.id}
          homeTeamId={match.homeTeam.id}
          awayTeamId={match.awayTeam.id}
          homeTeamName={match.homeTeam.name}
          awayTeamName={match.awayTeam.name}
        />
      </TabsContent>
    </Tabs>
  )
}

