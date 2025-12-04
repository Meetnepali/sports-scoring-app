"use client"

import React, { useState } from "react"
import type { Match } from "@/lib/static-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Undo2, Trophy } from "lucide-react"

interface CricketScoreboardProps {
  match: Match
}

const formatOvers = (overs: number): string => {
  const wholeOvers = Math.floor(overs)
  const balls = Math.round((overs % 1) * 10)
  return `${wholeOvers}.${balls}`
}

const getTotalBalls = (overs: number): number => {
  const wholeOvers = Math.floor(overs)
  const balls = Math.round((overs % 1) * 10)
  return wholeOvers * 6 + balls
}

const ballsToOvers = (balls: number): number => {
  const wholeOvers = Math.floor(balls / 6)
  const remainingBalls = balls % 6
  return wholeOvers + remainingBalls / 10
}

export default function CricketScoreboard({ match }: CricketScoreboardProps) {
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
  const [scoreHistory, setScoreHistory] = useState<any[]>([])
  const [showAnimation, setShowAnimation] = useState<{ type: string; value: number } | null>(null)

  const battingTeam = currentInnings === 0 ? match.homeTeam : match.awayTeam
  const bowlingTeam = currentInnings === 0 ? match.awayTeam : match.homeTeam
  const currentInningsData = score.innings[currentInnings]

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
    }
  }

  // Record runs - simplified to avoid double counting
  const recordRuns = (runs: number) => {
    if (!striker || !currentBowler) {
      alert("Please select striker and bowler first!")
      return
    }

    saveState()

    setScore((prev: any) => {
      const newScore = JSON.parse(JSON.stringify(prev))
      const innings = newScore.innings[currentInnings]
      
      // Add runs to total
      innings.runs += runs
      
      // Add ball to over count (not for wides/no-balls)
      const totalBalls = getTotalBalls(innings.overs)
      innings.overs = ballsToOvers(totalBalls + 1)
      
      // Swap strike if odd runs
      if (runs % 2 === 1) {
        const temp = striker
        setStriker(nonStriker)
        setNonStriker(temp)
      }
      
      // Check if over complete (6 balls)
      if ((totalBalls + 1) % 6 === 0) {
        const temp = striker
        setStriker(nonStriker)
        setNonStriker(temp)
      }

      // Show animation for boundaries
      if (runs === 4 || runs === 6) {
        setShowAnimation({ type: "boundary", value: runs })
        setTimeout(() => setShowAnimation(null), 1500)
      }
      
      return newScore
    })
  }

  // Record extras - simplified
  const recordExtra = (type: "wides" | "noBalls" | "byes" | "legByes", runs: number = 1) => {
    if (!currentBowler) {
      alert("Please select bowler first!")
      return
    }

    saveState()

    setScore((prev: any) => {
      const newScore = JSON.parse(JSON.stringify(prev))
      const innings = newScore.innings[currentInnings]
      
      // Add to extras
      innings.extras[type] += runs
      
      // Add runs to total (for wides and no-balls)
      if (type === "wides" || type === "noBalls") {
        innings.runs += runs
      }
      
      // Only add ball to over if not wide/no-ball
      if (type === "byes" || type === "legByes") {
        const totalBalls = getTotalBalls(innings.overs)
        innings.overs = ballsToOvers(totalBalls + 1)
        
        // Check if over complete
        if ((totalBalls + 1) % 6 === 0) {
          const temp = striker
          setStriker(nonStriker)
          setNonStriker(temp)
        }
      }
      
      return newScore
    })
  }

  // Record wicket
  const recordWicket = () => {
    if (!striker || !currentBowler) {
      alert("Please select striker and bowler first!")
      return
    }

    saveState()

    setScore((prev: any) => {
      const newScore = JSON.parse(JSON.stringify(prev))
      const innings = newScore.innings[currentInnings]
      
      if (innings.wickets < 10) {
        innings.wickets += 1
        
        // Add ball to over
        const totalBalls = getTotalBalls(innings.overs)
        innings.overs = ballsToOvers(totalBalls + 1)
        
        // Check if over complete
        if ((totalBalls + 1) % 6 === 0) {
          const temp = striker
          setStriker(nonStriker)
          setNonStriker(temp)
        }
        
        // Show wicket animation
        setShowAnimation({ type: "wicket", value: 1 })
        setTimeout(() => setShowAnimation(null), 1500)
        
        // Clear striker (new batsman needs to be selected)
        setStriker("")
      }
      
      return newScore
    })
  }

  // Switch innings
  const switchInnings = () => {
    if (confirm("Switch to next innings? This cannot be undone.")) {
      const nextInnings = currentInnings === 0 ? 1 : 0
      setCurrentInnings(nextInnings)
      setScore((prev: any) => ({ ...prev, currentInnings: nextInnings }))
      setStriker("")
      setNonStriker("")
      setCurrentBowler("")
    }
  }

  // Get current over balls for display
  const getCurrentOverBalls = () => {
    const totalBalls = getTotalBalls(currentInningsData.overs)
    const ballsInOver = totalBalls % 6
    return Array.from({ length: 6 }, (_, i) => ({
      bowled: i < ballsInOver,
      current: i === ballsInOver,
    }))
  }

  const runRate = currentInningsData.overs > 0 
    ? (currentInningsData.runs / (getTotalBalls(currentInningsData.overs) / 6)).toFixed(2)
    : "0.00"

  const totalExtras = Object.values(currentInningsData.extras || {}).reduce((a: number, b: number) => a + b, 0)

  if (match.status !== "live") {
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
          
          <div className="text-center mt-6 text-gray-500">
            Match is {match.status}. Start the match to begin scoring.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
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
          Cricket Scoreboard
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* Score Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Team 1 */}
          <div className={`p-6 rounded-lg border-2 ${currentInnings === 0 ? 'bg-blue-50 border-blue-400 shadow-lg' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg">{match.homeTeam.name}</h3>
              {currentInnings === 0 && <Badge className="bg-blue-600">Batting</Badge>}
            </div>
            <div className="text-5xl font-bold">{score.innings[0].runs}/{score.innings[0].wickets}</div>
            <div className="text-gray-600 text-sm mt-1">({formatOvers(score.innings[0].overs)} overs)</div>
          </div>

          {/* Team 2 */}
          <div className={`p-6 rounded-lg border-2 ${currentInnings === 1 ? 'bg-blue-50 border-blue-400 shadow-lg' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg">{match.awayTeam.name}</h3>
              {currentInnings === 1 && <Badge className="bg-blue-600">Batting</Badge>}
            </div>
            <div className="text-5xl font-bold">{score.innings[1].runs}/{score.innings[1].wickets}</div>
            <div className="text-gray-600 text-sm mt-1">({formatOvers(score.innings[1].overs)} overs)</div>
          </div>
        </div>

        {/* Current Over Display */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Current Over: {formatOvers(currentInningsData.overs)}</h3>
            <div className="text-sm text-gray-600">Run Rate: {runRate}</div>
          </div>
          <div className="flex gap-2 justify-center">
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

        {/* Player Selection - ALL IN ONE PLACE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
          <div>
            <label className="text-sm font-semibold mb-2 block">⚡ Striker (Batting)</label>
            <Select value={striker} onValueChange={setStriker}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select striker" />
              </SelectTrigger>
              <SelectContent>
                {battingTeam.players.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Non-Striker (Batting)</label>
            <Select value={nonStriker} onValueChange={setNonStriker}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select non-striker" />
              </SelectTrigger>
              <SelectContent>
                {battingTeam.players.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">🎯 Current Bowler</label>
            <Select value={currentBowler} onValueChange={setCurrentBowler}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select bowler" />
              </SelectTrigger>
              <SelectContent>
                {bowlingTeam.players.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Warning if players not selected */}
        {(!striker || !currentBowler) && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 text-center">
            <p className="text-red-700 font-semibold">⚠️ Please select striker and bowler to start scoring</p>
          </div>
        )}

        {/* Scoring Buttons - BIG AND CLEAR */}
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-lg border-2 border-green-300">
            <h3 className="font-bold text-center mb-3 text-lg">Record Runs</h3>
            <div className="grid grid-cols-6 gap-2">
              <Button
                onClick={() => recordRuns(0)}
                className="h-16 text-xl font-bold bg-gray-200 hover:bg-gray-300 text-gray-800"
                disabled={!striker || !currentBowler}
              >
                0
              </Button>
              <Button
                onClick={() => recordRuns(1)}
                className="h-16 text-xl font-bold bg-blue-200 hover:bg-blue-300 text-blue-900"
                disabled={!striker || !currentBowler}
              >
                1
              </Button>
              <Button
                onClick={() => recordRuns(2)}
                className="h-16 text-xl font-bold bg-blue-200 hover:bg-blue-300 text-blue-900"
                disabled={!striker || !currentBowler}
              >
                2
              </Button>
              <Button
                onClick={() => recordRuns(3)}
                className="h-16 text-xl font-bold bg-blue-200 hover:bg-blue-300 text-blue-900"
                disabled={!striker || !currentBowler}
              >
                3
              </Button>
              <Button
                onClick={() => recordRuns(4)}
                className="h-16 text-xl font-bold bg-green-400 hover:bg-green-500 text-white"
                disabled={!striker || !currentBowler}
              >
                4
              </Button>
              <Button
                onClick={() => recordRuns(6)}
                className="h-16 text-xl font-bold bg-green-600 hover:bg-green-700 text-white"
                disabled={!striker || !currentBowler}
              >
                6
              </Button>
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
                disabled={!striker || !currentBowler || currentInningsData.wickets >= 10}
              >
                OUT! (Wickets: {currentInningsData.wickets})
              </Button>
            </div>

            {/* Extras */}
            <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
              <h3 className="font-bold text-center mb-3">Extras (Total: {totalExtras})</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => recordExtra("wides")}
                  className="h-12 bg-yellow-200 hover:bg-yellow-300 text-yellow-900"
                  disabled={!currentBowler}
                >
                  Wide
                </Button>
                <Button
                  onClick={() => recordExtra("noBalls")}
                  className="h-12 bg-orange-200 hover:bg-orange-300 text-orange-900"
                  disabled={!currentBowler}
                >
                  No Ball
                </Button>
                <Button
                  onClick={() => recordExtra("byes")}
                  className="h-12 bg-yellow-200 hover:bg-yellow-300 text-yellow-900"
                  disabled={!currentBowler}
                >
                  Bye
                </Button>
                <Button
                  onClick={() => recordExtra("legByes")}
                  className="h-12 bg-yellow-200 hover:bg-yellow-300 text-yellow-900"
                  disabled={!currentBowler}
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
            <Button variant="outline" onClick={undoLastAction} className="flex items-center gap-2">
              <Undo2 className="h-4 w-4" />
              Undo
            </Button>
          )}
          <Button variant="outline" onClick={switchInnings} className="bg-purple-100 hover:bg-purple-200">
            Switch Innings
          </Button>
        </div>

        {/* Extras Summary */}
        <div className="bg-gray-50 p-3 rounded-lg border text-sm">
          <div className="flex justify-between">
            <span>Extras Breakdown:</span>
            <span>
              W: {currentInningsData.extras?.wides || 0} | NB: {currentInningsData.extras?.noBalls || 0} | 
              B: {currentInningsData.extras?.byes || 0} | LB: {currentInningsData.extras?.legByes || 0}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
