"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit2, Save, X, ChevronRight, Calendar, Trophy, Award, TrendingUp } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Match {
  id: string
  round?: number
  roundNumber?: number
  position?: number
  team1?: string
  team2?: string
  teamId?: string
  winner?: string
  winnerId?: string
  nextMatchId?: string
  date?: string
  matchDate?: string
  score1?: number
  score2?: number
  score?: { team1?: number; team2?: number } | any
  nodeData?: {
    color?: string
    backgroundColor?: string
    x?: number
    y?: number
    [key: string]: any
  }
}

interface Team {
  id: string
  name: string
  logo?: string
}

interface TournamentBracketProps {
  matches: Match[]
  teams: Team[]
  sport: string
  name: string
  onUpdateMatch?: (match: Match) => void
  editable?: boolean
  bracketType?: "single" | "double" | "consolation"
}

interface TeamStats {
  teamId: string
  teamName: string
  played: number
  won: number
  lost: number
  points: number
  scored: number
  conceded: number
  goalDifference?: number
  logo?: string
}

export default function TournamentBracket({
  matches,
  teams,
  sport,
  name,
  onUpdateMatch,
  editable = false,
  bracketType = "single",
}: TournamentBracketProps) {
  const [editingMatch, setEditingMatch] = useState<string | null>(null)
  const [editData, setEditData] = useState<{
    team1?: string
    team2?: string
    winner?: string
    date?: string
    score1?: number
    score2?: number
  }>({})
  const [hoveredMatch, setHoveredMatch] = useState<string | null>(null)

  // Get maximum round number (support both old and new format)
  const maxRound = Math.max(
    ...matches.map((match) => match.roundNumber || match.round || 1),
    1
  )

  // Group matches by round
  const matchesByRound: Record<number, Match[]> = {}
  for (let i = 1; i <= maxRound; i++) {
    matchesByRound[i] = matches
      .filter((match) => (match.roundNumber || match.round || 1) === i)
      .sort((a, b) => (a.position || 0) - (b.position || 0))
  }

  // Get team name by ID
  const getTeamName = (teamId?: string) => {
    if (!teamId) return "TBD"
    const team = teams.find((t) => t.id === teamId)
    return team ? team.name : "Unknown Team"
  }

  // Get team logo by ID
  const getTeamLogo = (teamId?: string) => {
    if (!teamId) return null
    const team = teams.find((t) => t.id === teamId)
    return team?.logo
  }

  // Start editing a match
  const startEditing = (match: Match) => {
    setEditingMatch(match.id)
    setEditData({
      team1: match.team1,
      team2: match.team2,
      winner: match.winner,
      date: match.date,
      score1: match.score1,
      score2: match.score2,
    })
  }

  // Save match edits
  const saveEdits = (match: Match) => {
    if (onUpdateMatch) {
      onUpdateMatch({
        ...match,
        ...editData,
      })
    }
    setEditingMatch(null)
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingMatch(null)
  }

  // Determine if this is a championship bracket
  const isChampionship = bracketType === "single" || bracketType === "double"

  // Calculate points table
  const calculatePointsTable = (): TeamStats[] => {
    const stats: Record<string, TeamStats> = {}

    // Initialize stats for all teams
    teams.forEach((team) => {
      stats[team.id] = {
        teamId: team.id,
        teamName: team.name,
        logo: team.logo,
        played: 0,
        won: 0,
        lost: 0,
        points: 0,
        scored: 0,
        conceded: 0,
        goalDifference: 0,
      }
    })

    // Process all matches with results
    matches.forEach((match) => {
      if (match.team1 && match.team2 && match.winner && match.score1 !== undefined && match.score2 !== undefined) {
        const team1Stats = stats[match.team1]
        const team2Stats = stats[match.team2]

        if (team1Stats && team2Stats) {
          // Update played
          team1Stats.played++
          team2Stats.played++

          // Update scores
          team1Stats.scored += match.score1
          team1Stats.conceded += match.score2
          team2Stats.scored += match.score2
          team2Stats.conceded += match.score1

          // Update wins/losses and points
          if (match.winner === match.team1) {
            team1Stats.won++
            team2Stats.lost++
            // 3 points for win (football/futsal), 2 for other sports
            team1Stats.points += sport === "futsal" || sport === "football" ? 3 : 2
          } else if (match.winner === match.team2) {
            team2Stats.won++
            team1Stats.lost++
            team2Stats.points += sport === "futsal" || sport === "football" ? 3 : 2
          }

          // Calculate goal difference
          team1Stats.goalDifference = team1Stats.scored - team1Stats.conceded
          team2Stats.goalDifference = team2Stats.scored - team2Stats.conceded
        }
      }
    })

    // Convert to array and sort by points, then goal difference
    return Object.values(stats)
      .filter((stat) => stat.played > 0) // Only show teams that have played
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.goalDifference !== a.goalDifference) return b.goalDifference! - a.goalDifference!
        return b.scored - a.scored
      })
  }

  const pointsTable = calculatePointsTable()

  // Render points table
  const renderPointsTable = () => {
    if (pointsTable.length === 0) {
      return (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Results Yet</h3>
          <p className="text-muted-foreground">Points table will appear after matches are played</p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-primary to-primary/80 text-white">
              <th className="p-3 text-left font-semibold border-r border-white/20">Pos</th>
              <th className="p-3 text-left font-semibold border-r border-white/20">Team</th>
              <th className="p-3 text-center font-semibold border-r border-white/20">P</th>
              <th className="p-3 text-center font-semibold border-r border-white/20">W</th>
              <th className="p-3 text-center font-semibold border-r border-white/20">L</th>
              <th className="p-3 text-center font-semibold border-r border-white/20">F</th>
              <th className="p-3 text-center font-semibold border-r border-white/20">A</th>
              <th className="p-3 text-center font-semibold border-r border-white/20">GD</th>
              <th className="p-3 text-center font-semibold bg-primary-dark">Pts</th>
            </tr>
          </thead>
          <tbody>
            {pointsTable.map((team, index) => (
              <tr
                key={team.teamId}
                className={`border-b hover:bg-muted/50 transition-colors ${
                  index === 0 ? "bg-yellow-50 dark:bg-yellow-900/20" : ""
                }`}
              >
                <td className="p-3 font-bold border-r">
                  <div className="flex items-center">
                    {index + 1}
                    {index === 0 && <Trophy className="h-4 w-4 text-yellow-500 ml-2" />}
                    {index === 1 && <Award className="h-4 w-4 text-gray-400 ml-2" />}
                    {index === 2 && <Award className="h-4 w-4 text-orange-600 ml-2" />}
                  </div>
                </td>
                <td className="p-3 font-medium border-r">
                  <div className="flex items-center">
                    {team.logo ? (
                      <div className="w-8 h-8 mr-3 relative flex-shrink-0">
                        <Image
                          src={team.logo}
                          alt={team.teamName}
                          fill
                          className="object-contain"
                          sizes="32px"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-primary/20 rounded-full mr-3 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold">{team.teamName.substring(0, 2).toUpperCase()}</span>
                      </div>
                    )}
                    <span className="truncate">{team.teamName}</span>
                  </div>
                </td>
                <td className="p-3 text-center border-r">{team.played}</td>
                <td className="p-3 text-center text-green-600 dark:text-green-400 font-semibold border-r">
                  {team.won}
                </td>
                <td className="p-3 text-center text-red-600 dark:text-red-400 font-semibold border-r">
                  {team.lost}
                </td>
                <td className="p-3 text-center border-r">{team.scored}</td>
                <td className="p-3 text-center border-r">{team.conceded}</td>
                <td
                  className={`p-3 text-center font-semibold border-r ${
                    team.goalDifference! > 0
                      ? "text-green-600 dark:text-green-400"
                      : team.goalDifference! < 0
                        ? "text-red-600 dark:text-red-400"
                        : ""
                  }`}
                >
                  {team.goalDifference! > 0 ? "+" : ""}
                  {team.goalDifference}
                </td>
                <td className="p-3 text-center font-bold text-lg bg-primary/10">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Table Legend
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
            <div><span className="font-semibold">P:</span> Played</div>
            <div><span className="font-semibold">W:</span> Won</div>
            <div><span className="font-semibold">L:</span> Lost</div>
            <div><span className="font-semibold">F:</span> For (Scored)</div>
            <div><span className="font-semibold">A:</span> Against (Conceded)</div>
            <div><span className="font-semibold">GD:</span> Goal Difference</div>
            <div><span className="font-semibold">Pts:</span> Points</div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            * Win: {sport === "futsal" || sport === "football" ? "3" : "2"} points
          </p>
        </div>
      </div>
    )
  }

  // Render a match card
  const renderMatch = (match: Match) => {
    const isEditing = editingMatch === match.id
    const isHovered = hoveredMatch === match.id
    // Support both old format (team1/team2) and new format (teamId in node data)
    const team1Id = match.team1 || (match.nodeData?.team1Id as string | undefined)
    const team2Id = match.team2 || (match.nodeData?.team2Id as string | undefined)
    const team1Logo = getTeamLogo(team1Id)
    const team2Logo = getTeamLogo(team2Id)
    const matchDate = match.matchDate || match.date
    const backgroundColor = match.nodeData?.backgroundColor || undefined
    const nodeColor = match.nodeData?.color || undefined

    return (
      <div
        key={match.id}
        className="relative"
        onMouseEnter={() => setHoveredMatch(match.id)}
        onMouseLeave={() => setHoveredMatch(null)}
      >
        <Card
          className={`w-full transition-all duration-200 ${
            isHovered ? "shadow-xl scale-105 border-white/40" : "shadow-lg"
          } ${match.winner || match.winnerId ? "bg-white/95 dark:bg-gray-900/95" : "bg-white dark:bg-gray-900"} backdrop-blur-sm`}
          style={backgroundColor ? { backgroundColor, borderColor: nodeColor } : {}}
        >
          <div className="p-4">
            {isEditing ? (
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Team 1</label>
                  <select
                    className="w-full p-2 border rounded-md text-sm mt-1"
                    value={editData.team1 || team1Id || ""}
                    onChange={(e) => setEditData({ ...editData, team1: e.target.value || undefined })}
                  >
                    <option value="">TBD</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Team 2</label>
                  <select
                    className="w-full p-2 border rounded-md text-sm mt-1"
                    value={editData.team2 || team2Id || ""}
                    onChange={(e) => setEditData({ ...editData, team2: e.target.value || undefined })}
                  >
                    <option value="">TBD</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Score 1</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-md text-sm mt-1"
                      value={editData.score1 || 0}
                      onChange={(e) =>
                        setEditData({ ...editData, score1: Number.parseInt(e.target.value) || undefined })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Score 2</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-md text-sm mt-1"
                      value={editData.score2 || 0}
                      onChange={(e) =>
                        setEditData({ ...editData, score2: Number.parseInt(e.target.value) || undefined })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Winner</label>
                  <select
                    className="w-full p-2 border rounded-md text-sm mt-1"
                    value={editData.winner || ""}
                    onChange={(e) => setEditData({ ...editData, winner: e.target.value || undefined })}
                  >
                    <option value="">Not decided</option>
                    {editData.team1 && <option value={editData.team1}>{getTeamName(editData.team1)}</option>}
                    {editData.team2 && <option value={editData.team2}>{getTeamName(editData.team2)}</option>}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Date</label>
                  <input
                    type="datetime-local"
                    className="w-full p-2 border rounded-md text-sm mt-1"
                    value={editData.date || ""}
                    onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-2 mt-3">
                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => saveEdits(match)}>
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {/* Match info header */}
                {matchDate && (
                  <div className="flex items-center justify-center mb-3 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(matchDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}

                {/* Teams */}
                <div className="space-y-3">
                  {/* Team 1 */}
                  <div
                    className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                      (match.winner || match.winnerId) === team1Id
                        ? "bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-900/20 border-2 border-green-500 shadow-sm"
                        : "bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      {team1Logo ? (
                        <div className="w-8 h-8 mr-3 relative flex-shrink-0">
                          <Image
                            src={team1Logo}
                            alt={getTeamName(team1Id)}
                            fill
                            className="object-contain"
                            sizes="32px"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full mr-3 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {team1Id ? getTeamName(team1Id).substring(0, 2).toUpperCase() : "?"}
                          </span>
                        </div>
                      )}
                      <span className="font-semibold text-sm truncate">{getTeamName(team1Id)}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {(match.score1 !== undefined || (match.score && match.score.team1 !== undefined)) && (
                        <span className="font-bold text-lg min-w-[2rem] text-center">
                          {match.score1 ?? (match.score?.team1 as number)}
                        </span>
                      )}
                      {(match.winner || match.winnerId) === team1Id && <Trophy className="h-5 w-5 text-yellow-500 flex-shrink-0" />}
                    </div>
                  </div>

                  {/* VS divider */}
                  <div className="flex items-center justify-center">
                    <div className="h-px flex-1 bg-border"></div>
                    <span className="px-3 text-xs font-bold text-muted-foreground">VS</span>
                    <div className="h-px flex-1 bg-border"></div>
                  </div>

                  {/* Team 2 */}
                  <div
                    className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                      (match.winner || match.winnerId) === team2Id
                        ? "bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-900/20 border-2 border-green-500 shadow-sm"
                        : "bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      {team2Logo ? (
                        <div className="w-8 h-8 mr-3 relative flex-shrink-0">
                          <Image
                            src={team2Logo}
                            alt={getTeamName(team2Id)}
                            fill
                            className="object-contain"
                            sizes="32px"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full mr-3 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {team2Id ? getTeamName(team2Id).substring(0, 2).toUpperCase() : "?"}
                          </span>
                        </div>
                      )}
                      <span className="font-semibold text-sm truncate">{getTeamName(team2Id)}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {(match.score2 !== undefined || (match.score && match.score.team2 !== undefined)) && (
                        <span className="font-bold text-lg min-w-[2rem] text-center">
                          {match.score2 ?? (match.score?.team2 as number)}
                        </span>
                      )}
                      {(match.winner || match.winnerId) === team2Id && <Trophy className="h-5 w-5 text-yellow-500 flex-shrink-0" />}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-between items-center mt-4 gap-2">
                  {team1Id && team2Id && !match.winner && !match.winnerId && (
                    <Link
                      href={`/matches/create?sport=${sport}&team1=${team1Id}&team2=${team2Id}&tournament=${name}`}
                      className="flex-1"
                    >
                      <Button size="sm" variant="outline" className="w-full">
                        <Calendar className="h-3 w-3 mr-1" />
                        Schedule Match
                      </Button>
                    </Link>
                  )}
                  {editable && (
                    <Button size="sm" variant="ghost" onClick={() => startEditing(match)} className="flex-shrink-0">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full">
      <Tabs defaultValue="bracket" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="bracket" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Tournament Bracket
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Points Table
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bracket" className="mt-0">
          <div className="overflow-x-auto">
            <div className="relative min-w-max p-6 bg-gradient-to-br from-primary via-primary/90 to-primary/70 dark:from-primary/80 dark:via-primary/60 dark:to-primary/40 rounded-xl shadow-2xl">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-[radial-gradient(circle,_white_1px,_transparent_1px)] bg-[size:24px_24px]"></div>
              </div>

              {/* Tournament header */}
              <div className="relative z-10 text-center mb-8">
                <div className="inline-flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-4">
                  <Trophy className="h-6 w-6 text-yellow-300 mr-3" />
                  <h2 className="text-white text-2xl font-bold tracking-wide">{name}</h2>
                </div>
                <p className="text-white/80 text-sm uppercase tracking-wider">{sport} Championship</p>
              </div>

              {/* Bracket rounds */}
              <div className="relative z-10 flex justify-center">
                <div className="inline-flex gap-12">
                  {Object.entries(matchesByRound).map(([round, roundMatches], roundIndex) => (
                    <div key={round} className="flex flex-col min-w-[280px]">
                      {/* Round header */}
                      <div className="mb-6 text-center">
                        <div className="inline-block bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                          <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                            {Number(round) === maxRound
                              ? "🏆 Grand Final"
                              : Number(round) === maxRound - 1
                                ? "Semi-Finals"
                                : Number(round) === maxRound - 2
                                  ? "Quarter-Finals"
                                  : `Round ${round}`}
                          </h3>
                        </div>
                      </div>

                      {/* Matches */}
                      <div className="flex-1 flex flex-col justify-around space-y-8">
                        {roundMatches.map((match, matchIndex) => (
                          <div key={match.id} className="relative flex items-center">
                            {/* Match card */}
                            <div className="flex-1">{renderMatch(match)}</div>

                            {/* Connector to next round */}
                            {Number(round) < maxRound && (
                              <div className="relative ml-4 flex items-center">
                                {/* Horizontal line */}
                                <div className="w-8 h-0.5 bg-white/40"></div>

                                {/* Vertical line connecting pairs */}
                                {matchIndex % 2 === 0 && matchIndex + 1 < roundMatches.length && (
                                  <div
                                    className="absolute left-8 w-0.5 bg-white/40"
                                    style={{
                                      top: "50%",
                                      height: `calc(${(roundMatches.length > 2 ? 100 : 200) / (roundMatches.length / 2)}% + ${matchIndex === 0 ? "2rem" : "0rem"})`,
                                    }}
                                  ></div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Champion display */}
              {matches.length > 0 && (matches[matches.length - 1]?.winner || matches[matches.length - 1]?.winnerId) && (
                <div className="relative z-10 text-center mt-12">
                  <div className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl px-8 py-4 shadow-2xl animate-pulse">
                    <Trophy className="h-8 w-8 text-white mx-auto mb-2" />
                    <p className="text-white text-sm font-semibold mb-1">CHAMPION</p>
                    <p className="text-white text-2xl font-bold">
                      {getTeamName(matches[matches.length - 1].winner || matches[matches.length - 1].winnerId)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="table" className="mt-0">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold">Tournament Standings</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Live points table updated after each match
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{pointsTable.length} Teams</span>
                </div>
              </div>
              {renderPointsTable()}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
