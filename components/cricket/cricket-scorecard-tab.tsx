"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy, TrendingUp, TrendingDown } from "lucide-react"
import { formatOvers } from "@/lib/cricket-match-logic"

interface BattingStats {
  player_name: string
  player_number: number
  runs_scored: number
  balls_faced: number
  fours: number
  sixes: number
  strike_rate: number
  is_out: boolean
  wicket_type: string | null
  team_id: string
}

interface BowlingStats {
  player_name: string
  player_number: number
  overs_bowled: number
  runs_conceded: number
  wickets_taken: number
  maidens: number
  economy_rate: number
  team_id: string
}

interface FallOfWicket {
  player_name: string
  wicket_type: string
  over_number: number
  ball_number: number
  score_at_wicket: number
}

interface ExtrasData {
  innings_number: number
  wides: number
  noballs: number
  byes: number
  legbyes: number
  total_extras: number
}

interface ScorecardConfig {
  toss_winner_team_name: string
  toss_decision: string
  bat_first_team_name: string
  total_overs: number
}

interface MatchSummary {
  winner_team_name: string | null
  win_margin: string | null
  man_of_match_name: string | null
  match_status: string
}

interface CricketScorecardTabProps {
  matchId: string
  homeTeamId: string
  awayTeamId: string
  homeTeamName: string
  awayTeamName: string
}

export function CricketScorecardTab({
  matchId,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
}: CricketScorecardTabProps) {
  const [batting, setBatting] = useState<BattingStats[]>([])
  const [bowling, setBowling] = useState<BowlingStats[]>([])
  const [fallOfWickets, setFallOfWickets] = useState<FallOfWicket[]>([])
  const [config, setConfig] = useState<ScorecardConfig | null>(null)
  const [summary, setSummary] = useState<MatchSummary | null>(null)
  const [extras, setExtras] = useState<ExtrasData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchScorecard()
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchScorecard, 5000)
    return () => clearInterval(interval)
  }, [matchId])

  const fetchScorecard = async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}/cricket/scorecard`)
      if (response.ok) {
        const data = await response.json()
        setBatting(data.batting || [])
        setBowling(data.bowling || [])
        setFallOfWickets(data.fallOfWickets || [])
        setConfig(data.config || null)
        setSummary(data.summary || null)
        setExtras(data.extras || [])
      }
    } catch (error) {
      console.error("Error fetching scorecard:", error)
    } finally {
      setLoading(false)
    }
  }

  const getBattingByTeamAndInnings = (teamId: string, innings: number) => {
    return batting.filter((b) => b.team_id === teamId && b.runs_scored + b.balls_faced > 0)
      .sort((a, b) => b.runs_scored - a.runs_scored)
  }

  const getBowlingByInnings = (innings: number, battingTeamId: string) => {
    // Bowling stats are for the opposite team
    const bowlingTeamId = battingTeamId === homeTeamId ? awayTeamId : homeTeamId
    return bowling.filter((b) => b.team_id === bowlingTeamId)
      .sort((a, b) => b.wickets_taken - a.wickets_taken || a.economy_rate - b.economy_rate)
  }

  const getFallOfWicketsByInnings = (innings: number) => {
    return fallOfWickets.filter((f) => f.innings_number === innings)
  }

  const getExtrasByInnings = (innings: number) => {
    return extras.find((e) => e.innings_number === innings)
  }

  const renderDismissal = (stat: BattingStats) => {
    if (!stat.is_out) return <span className="text-green-600 font-medium">Not Out</span>
    return <span className="text-red-600">{stat.wicket_type || "Out"}</span>
  }

  const renderBattingCard = (teamId: string, teamName: string, innings: number) => {
    const battingStats = getBattingByTeamAndInnings(teamId, innings)
    const bowlingStats = getBowlingByInnings(innings, teamId)
    const fow = getFallOfWicketsByInnings(innings)
    const extrasData = getExtrasByInnings(innings)

    if (battingStats.length === 0 && innings === 2) {
      return (
        <div className="text-center py-8 text-gray-500">
          Second innings not started yet
        </div>
      )
    }

    const totalRuns = battingStats.reduce((sum, b) => sum + b.runs_scored, 0) + (extrasData?.total_extras || 0)
    const totalWickets = battingStats.filter((b) => b.is_out).length

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">{teamName}</h3>
          <Badge className="text-lg px-4 py-1">
            {totalRuns}/{totalWickets}
          </Badge>
        </div>

        {/* Batting Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-bold">Batsman</TableHead>
                <TableHead className="text-center font-bold">R</TableHead>
                <TableHead className="text-center font-bold">B</TableHead>
                <TableHead className="text-center font-bold">4s</TableHead>
                <TableHead className="text-center font-bold">6s</TableHead>
                <TableHead className="text-center font-bold">SR</TableHead>
                <TableHead className="font-bold">Dismissal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {battingStats.length > 0 ? (
                battingStats.map((stat, idx) => {
                  const strikeRate = typeof stat.strike_rate === 'string' 
                    ? parseFloat(stat.strike_rate) 
                    : (typeof stat.strike_rate === 'number' ? stat.strike_rate : 0)
                  const strikeRateNum = isNaN(strikeRate) ? 0 : strikeRate
                  
                  return (
                    <TableRow key={idx} className={stat.is_out ? "" : "bg-green-50"}>
                      <TableCell className="font-medium">
                        {stat.player_name}
                        {!stat.is_out && <Badge variant="outline" className="ml-2 text-xs">Batting</Badge>}
                      </TableCell>
                      <TableCell className="text-center font-bold">{stat.runs_scored}</TableCell>
                      <TableCell className="text-center">{stat.balls_faced}</TableCell>
                      <TableCell className="text-center">{stat.fours}</TableCell>
                      <TableCell className="text-center">{stat.sixes}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {strikeRateNum.toFixed(2)}
                          {strikeRateNum > 120 && <TrendingUp className="h-3 w-3 text-green-600" />}
                          {strikeRateNum < 80 && stat.balls_faced > 10 && <TrendingDown className="h-3 w-3 text-red-600" />}
                        </div>
                      </TableCell>
                      <TableCell>{renderDismissal(stat)}</TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    No batting data yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Extras */}
        {extrasData && (
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <div className="font-semibold mb-1">Extras: {extrasData.total_extras}</div>
            <div className="text-sm text-gray-600">
              Wides: {extrasData.wides} | No Balls: {extrasData.noballs} | Byes: {extrasData.byes} | Leg Byes: {extrasData.legbyes}
            </div>
          </div>
        )}

        {/* Bowling Table */}
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Bowling</h4>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-bold">Bowler</TableHead>
                  <TableHead className="text-center font-bold">O</TableHead>
                  <TableHead className="text-center font-bold">M</TableHead>
                  <TableHead className="text-center font-bold">R</TableHead>
                  <TableHead className="text-center font-bold">W</TableHead>
                  <TableHead className="text-center font-bold">Econ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bowlingStats.length > 0 ? (
                  bowlingStats.map((stat, idx) => {
                    const economyRate = typeof stat.economy_rate === 'string' 
                      ? parseFloat(stat.economy_rate) 
                      : (typeof stat.economy_rate === 'number' ? stat.economy_rate : 0)
                    const economyRateNum = isNaN(economyRate) ? 0 : economyRate
                    
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{stat.player_name}</TableCell>
                        <TableCell className="text-center">{formatOvers(stat.overs_bowled)}</TableCell>
                        <TableCell className="text-center">{stat.maidens}</TableCell>
                        <TableCell className="text-center">{stat.runs_conceded}</TableCell>
                        <TableCell className="text-center font-bold">{stat.wickets_taken}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {economyRateNum.toFixed(2)}
                            {economyRateNum < 6 && stat.overs_bowled > 2 && <TrendingDown className="h-3 w-3 text-green-600" />}
                            {economyRateNum > 10 && <TrendingUp className="h-3 w-3 text-red-600" />}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      No bowling data yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Fall of Wickets */}
        {fow.length > 0 && (
          <div className="mt-4">
            <h4 className="text-lg font-semibold mb-2">Fall of Wickets</h4>
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <div className="flex flex-wrap gap-3">
                {fow.map((wicket, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-semibold">{wicket.score_at_wicket}/{idx + 1}</span>{" "}
                    <span className="text-gray-600">
                      ({wicket.player_name}, {formatOvers(wicket.over_number + wicket.ball_number / 10)} ov)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading scorecard...</div>
      </div>
    )
  }

  // Determine which team bats first
  const firstBattingTeamId = config?.bat_first_team_name === homeTeamName ? homeTeamId : awayTeamId
  const secondBattingTeamId = firstBattingTeamId === homeTeamId ? awayTeamId : homeTeamId
  const firstBattingTeamName = firstBattingTeamId === homeTeamId ? homeTeamName : awayTeamName
  const secondBattingTeamName = secondBattingTeamId === homeTeamId ? homeTeamName : awayTeamName

  return (
    <div className="space-y-6">
      {/* Match Summary */}
      {config && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Match Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Format:</span>
                <div className="font-semibold">{config.total_overs} Overs</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Toss:</span>
                <div className="font-semibold">
                  {config.toss_winner_team_name} (elected to {config.toss_decision})
                </div>
              </div>
            </div>
            {summary?.match_status === 'completed' && summary.winner_team_name && (
              <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-300">
                <div className="font-bold text-green-800">
                  {summary.winner_team_name} won by {summary.win_margin}
                </div>
                {summary.man_of_match_name && (
                  <div className="text-sm text-green-700 mt-1">
                    Player of the Match: <span className="font-semibold">{summary.man_of_match_name}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* First Innings */}
      <Card>
        <CardHeader className="bg-blue-50">
          <CardTitle>First Innings</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {renderBattingCard(firstBattingTeamId, firstBattingTeamName, 1)}
        </CardContent>
      </Card>

      {/* Second Innings */}
      <Card>
        <CardHeader className="bg-green-50">
          <CardTitle>Second Innings</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {renderBattingCard(secondBattingTeamId, secondBattingTeamName, 2)}
        </CardContent>
      </Card>
    </div>
  )
}

