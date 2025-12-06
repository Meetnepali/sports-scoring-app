"use client"

import React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Users, Calendar, ArrowLeft, Edit, ImageIcon, TrendingUp, Award } from "lucide-react"
import TournamentBracket from "@/components/tournament-bracket"
import { PointsTable } from "@/components/points-table"
import { 
  getTournamentById, 
  getTournamentSports, 
  getTournamentGroups, 
  getGroupTeams, 
  getTournamentBracketNodes,
  getGroupMatches 
} from "@/lib/client-api"
import Image from "next/image"
import PageTransition from "@/components/page-transition"
import { LoadingSpinner } from "@/components/loading-spinner"
import type { TournamentSport, TournamentGroup, GroupTeam, Team, BracketNode } from "@/lib/static-data"

const sportNames: Record<string, string> = {
  cricket: "Cricket",
  volleyball: "Volleyball",
  chess: "Chess",
  futsal: "Futsal",
  "table-tennis": "Table Tennis",
  badminton: "Badminton",
}

const formatNames: Record<string, string> = {
  "single-elimination": "Single Elimination",
  "double-elimination": "Double Elimination",
  "round-robin": "Round Robin",
  consolation: "Consolation Bracket",
}

const statusColors: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  ongoing: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
}

const sportColors: Record<string, string> = {
  cricket: "#3b82f6",
  volleyball: "#ef4444",
  chess: "#10b981",
  futsal: "#f59e0b",
  "table-tennis": "#8b5cf6",
  badminton: "#ec4899",
}

// Helper function to format score display based on sport
const formatScore = (score: any, sport: string): string => {
  if (!score) return '-'
  
  try {
    // Parse if it's a string
    const parsedScore = typeof score === 'string' ? JSON.parse(score) : score
    
    if (sport === 'cricket') {
      // Cricket: Show runs/wickets (overs)
      const runs = parsedScore.runs || 0
      const wickets = parsedScore.wickets || 0
      const overs = parsedScore.overs || 0
      return `${runs}/${wickets} (${overs})`
    }
    
    if (sport === 'volleyball' || sport === 'badminton' || sport === 'table-tennis') {
      // Show sets/games won
      return parsedScore.toString()
    }
    
    if (sport === 'chess') {
      // Show points (can be decimal)
      return parsedScore.toString()
    }
    
    // Default: futsal and others
    return parsedScore.toString()
  } catch (e) {
    // If parsing fails, just return the value
    return score.toString()
  }
}

export default function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [tournamentId, setTournamentId] = useState<string | null>(null)
  const [tournament, setTournament] = useState<any>(null)
  const [tournamentSports, setTournamentSports] = useState<TournamentSport[]>([])
  const [groups, setGroups] = useState<TournamentGroup[]>([])
  const [allGroupTeams, setAllGroupTeams] = useState<Record<string, GroupTeam[]>>({})
  const [bracketNodes, setBracketNodes] = useState<BracketNode[]>([])
  const [groupMatches, setGroupMatches] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [selectedSportIndex, setSelectedSportIndex] = useState(0)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      const id = resolvedParams.id
      setTournamentId(id)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    const loadTournamentData = async () => {
      if (!tournamentId) return

      try {
        setLoading(true)
        
        // Load tournament
        const tournamentData = await getTournamentById(tournamentId)
        setTournament(tournamentData)
        
        if (!tournamentData) return

        // Load sports
        const sports = await getTournamentSports(tournamentId)
        setTournamentSports(sports)

        if (sports.length > 0) {
          // Load groups for first sport
          const firstGroups = await getTournamentGroups(tournamentId, sports[0].sport)
          setGroups(firstGroups)

          if (firstGroups.length > 0) {
            // Load teams and matches for ALL groups
            const groupTeamsData: Record<string, GroupTeam[]> = {}
            const groupMatchesData: Record<string, any[]> = {}
            
            // Load data for all groups in parallel
            await Promise.all(
              firstGroups.map(async (group) => {
                try {
                  const teams = await getGroupTeams(group.id)
                  groupTeamsData[group.id] = teams
                  
                  const matches = await getGroupMatches(group.id)
                  groupMatchesData[group.id] = matches
                } catch (error) {
                  console.error(`Error loading data for group ${group.id}:`, error)
                  groupTeamsData[group.id] = []
                  groupMatchesData[group.id] = []
                }
              })
            )
            
            setAllGroupTeams(groupTeamsData)
            setGroupMatches(groupMatchesData)
            
            // Select first group and load bracket nodes
            const firstGroupId = firstGroups[0].id
            setSelectedGroupId(firstGroupId)
            
            const nodes = await getTournamentBracketNodes(tournamentId, firstGroupId)
            setBracketNodes(nodes)
          }
        }
      } catch (error) {
        console.error('Error loading tournament data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTournamentData()
  }, [tournamentId])

  const handleSportChange = async (sport: TournamentSport, index: number) => {
    setSelectedSportIndex(index)
    
    try {
      const sportGroups = await getTournamentGroups(tournamentId!, sport.sport)
      setGroups(sportGroups)

      if (sportGroups.length > 0) {
        // Load teams and matches for ALL groups
        const groupTeamsData: Record<string, GroupTeam[]> = {}
        const groupMatchesData: Record<string, any[]> = {}
        
        // Load data for all groups in parallel
        await Promise.all(
          sportGroups.map(async (group) => {
            try {
              const teams = await getGroupTeams(group.id)
              groupTeamsData[group.id] = teams
              
              const matches = await getGroupMatches(group.id)
              groupMatchesData[group.id] = matches
            } catch (error) {
              console.error(`Error loading data for group ${group.id}:`, error)
              groupTeamsData[group.id] = []
              groupMatchesData[group.id] = []
            }
          })
        )
        
        setAllGroupTeams(groupTeamsData)
        setGroupMatches(groupMatchesData)
        
        // Select first group and load bracket nodes
        const firstGroupId = sportGroups[0].id
        setSelectedGroupId(firstGroupId)

        const nodes = await getTournamentBracketNodes(tournamentId!, firstGroupId)
        setBracketNodes(nodes)
      } else {
        setSelectedGroupId(null)
        setAllGroupTeams({})
        setGroupMatches({})
        setBracketNodes([])
      }
    } catch (error) {
      console.error('Error loading sport data:', error)
    }
  }

  const handleGroupChange = async (groupId: string) => {
    setSelectedGroupId(groupId)
    
    try {
      if (!allGroupTeams[groupId]) {
        const teams = await getGroupTeams(groupId)
        setAllGroupTeams(prev => ({ ...prev, [groupId]: teams }))
      }

      if (!groupMatches[groupId]) {
        const matches = await getGroupMatches(groupId)
        setGroupMatches(prev => ({ ...prev, [groupId]: matches }))
      }

      const nodes = await getTournamentBracketNodes(tournamentId!, groupId)
      setBracketNodes(nodes)
    } catch (error) {
      console.error('Error loading group data:', error)
    }
  }

  if (loading || !tournamentId) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner />
        </div>
      </PageTransition>
    )
  }

  if (!tournament) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">Tournament not found</p>
            <p className="text-muted-foreground mb-4">The tournament you're looking for doesn't exist</p>
            <Link href="/tournaments">
              <Button>Back to Tournaments</Button>
            </Link>
          </div>
        </div>
      </PageTransition>
    )
  }

  const currentSport = tournamentSports[selectedSportIndex]
  const currentTeams = selectedGroupId ? allGroupTeams[selectedGroupId] || [] : []
  const currentMatches = selectedGroupId ? groupMatches[selectedGroupId] || [] : []

  // Transform bracket nodes for TournamentBracket component
  const transformedMatches = bracketNodes
    .filter(n => n.nodeType === 'match')
    .map(node => ({
      id: node.id,
      round: node.roundNumber || 1,
      roundNumber: node.roundNumber,
      position: node.position || 1,
      team1: node.nodeData?.team1Id || node.teamId,
      team2: node.nodeData?.team2Id,
      winner: node.winnerId,
      winnerId: node.winnerId,
      nextMatchId: node.nextMatchId,
      score1: node.score?.team1,
      score2: node.score?.team2,
      date: node.matchDate,
      matchDate: node.matchDate,
      score: node.score,
    }));

  return (
    <PageTransition key="tournament-detail">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center mb-6">
          <Link href="/tournaments">
            <Button variant="outline" size="icon" className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{tournament.name}</h1>
              <Badge className={statusColors[tournament.status || 'upcoming']}>
                {(tournament.status || 'upcoming').charAt(0).toUpperCase() + (tournament.status || 'upcoming').slice(1)}
              </Badge>
            </div>
            <div className="text-muted-foreground mt-1">
              {formatNames[tournament.format]} • Started {new Date(tournament.startDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Sport Navigation */}
        {tournamentSports.length > 1 && (
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {tournamentSports.map((sport, idx) => (
                <Button
                  key={sport.id}
                  variant={selectedSportIndex === idx ? "default" : "outline"}
                  onClick={() => handleSportChange(sport, idx)}
                  className="whitespace-nowrap"
                  style={
                    selectedSportIndex === idx
                      ? { backgroundColor: sportColors[sport.sport] || "#3b82f6", borderColor: sportColors[sport.sport] || "#3b82f6" }
                      : {}
                  }
                >
                  {sportNames[sport.sport]}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Sport Info */}
        {currentSport && (
          <div className="mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                      style={{ backgroundColor: sportColors[currentSport.sport] || "#3b82f6" }}
                    >
                      {sportNames[currentSport.sport]?.[0]}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{sportNames[currentSport.sport]}</h2>
                      <p className="text-sm text-muted-foreground">{groups.length} Groups</p>
                    </div>
                  </div>
                  {groups.length > 0 && (
                    <Badge variant="secondary" className="text-lg px-4 py-1">
                      {groups.reduce((sum, g) => sum + (allGroupTeams[g.id]?.length || 0), 0)} Total Teams
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="groups">Groups & Points</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="bracket">Bracket</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Sports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{tournamentSports.length}</div>
                  <p className="text-xs text-muted-foreground">Sports in this tournament</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Groups</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{groups.length}</div>
                  <p className="text-xs text-muted-foreground">Groups in {sportNames[currentSport?.sport] || 'tournament'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Teams</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Object.values(allGroupTeams).reduce((sum, teams) => sum + teams.length, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total participants</p>
                </CardContent>
              </Card>
            </div>

            {tournamentSports.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Participating Sports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {tournamentSports.map((sport) => (
                      <Badge
                        key={sport.id}
                        className="px-4 py-2 text-base"
                        style={{
                          backgroundColor: `${sportColors[sport.sport] || "#3b82f6"}20`,
                          color: sportColors[sport.sport] || "#3b82f6",
                        }}
                      >
                        {sportNames[sport.sport]}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="groups">
            {groups.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No groups created yet for this sport</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Group Selector */}
                <div>
                  <Select value={selectedGroupId || ""} onValueChange={handleGroupChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.groupName} ({(allGroupTeams[group.id] || []).length} teams)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Points Table */}
                {selectedGroupId && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Points Table - {groups.find(g => g.id === selectedGroupId)?.groupName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PointsTable
                        teams={allGroupTeams[selectedGroupId] || []}
                        matches={currentMatches.map((match: any) => {
                          // Parse scores if they're JSON strings
                          let team1Score = match.team1Score
                          let team2Score = match.team2Score
                          
                          if (typeof team1Score === 'string') {
                            try {
                              team1Score = JSON.parse(team1Score)
                            } catch (e) {
                              team1Score = null
                            }
                          }
                          
                          if (typeof team2Score === 'string') {
                            try {
                              team2Score = JSON.parse(team2Score)
                            } catch (e) {
                              team2Score = null
                            }
                          }
                          
                          // Build score object based on sport
                          let score: any = undefined
                          if (team1Score !== null && team2Score !== null) {
                            if (currentSport?.sport === "cricket") {
                              score = {
                                team1: team1Score,
                                team2: team2Score,
                                team1Overs: team1Score.overs || 0,
                                team2Overs: team2Score.overs || 0
                              }
                            } else {
                              // For other sports, extract numeric scores
                              const team1Value = typeof team1Score === 'object' ? team1Score.total || team1Score.score || 0 : team1Score
                              const team2Value = typeof team2Score === 'object' ? team2Score.total || team2Score.score || 0 : team2Score
                              score = {
                                team1: team1Value,
                                team2: team2Value
                              }
                            }
                          }
                          
                          return {
                            id: match.id,
                            team1Id: match.team1Id,
                            team2Id: match.team2Id,
                            winnerId: match.winnerId,
                            score: score,
                            nodeData: {
                              team1Id: match.team1Id,
                              team2Id: match.team2Id
                            }
                          }
                        })}
                        sport={currentSport?.sport || ""}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* All Groups Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groups.map((group) => {
                    const groupTeams = allGroupTeams[group.id] || []
                    return (
                      <Card key={group.id} className={`transition-all ${selectedGroupId === group.id ? 'border-primary border-2' : ''}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{group.groupName}</CardTitle>
                            <Badge variant="secondary">{groupTeams.length} Teams</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {groupTeams.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No teams added yet</p>
                          ) : (
                            <div className="space-y-2">
                              {groupTeams.slice(0, 5).map((gt) => (
                                <div key={gt.id} className="flex items-center gap-2 text-sm">
                                  {gt.team?.logo && (
                                    <div className="w-6 h-6 relative">
                                      <Image
                                        src={gt.team.logo}
                                        alt={gt.team.name}
                                        fill
                                        className="object-contain rounded"
                                        sizes="24px"
                                      />
                                    </div>
                                  )}
                                  <span className="font-medium">{gt.team?.name}</span>
                                </div>
                              ))}
                              {groupTeams.length > 5 && (
                                <p className="text-xs text-muted-foreground">+{groupTeams.length - 5} more teams</p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="bracket">
            {selectedGroupId && currentTeams.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Tournament Bracket
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transformedMatches.length > 0 ? (
                    <TournamentBracket
                      matches={transformedMatches}
                      teams={currentTeams.map(gt => gt.team!).filter(Boolean)}
                      sport={currentSport?.sport || ""}
                      name={tournament.name}
                      onUpdateMatch={undefined}
                      editable={false}
                      bracketType="single"
                    />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No bracket generated yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No groups or teams available to display bracket</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="matches">
            {groups.length > 0 ? (
              <div className="space-y-6">
                {groups.map((group) => {
                  const groupMatchesList = groupMatches[group.id] || []
                  const groupTeamsList = allGroupTeams[group.id] || []
                  
                  if (groupMatchesList.length === 0) {
                    return (
                      <Card key={group.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-green-500" />
                            {group.groupName} - Tournament Matches
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No matches created for this group yet</p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  }
                  
                  return (
                    <Card key={group.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-green-500" />
                            {group.groupName} - Tournament Matches
                          </span>
                          <Badge variant="secondary">{groupMatchesList.length} matches</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {groupMatchesList.map((match: any, index: number) => {
                            const team1 = groupTeamsList.find(gt => gt.teamId === match.team1Id)?.team
                            const team2 = groupTeamsList.find(gt => gt.teamId === match.team2Id)?.team
                            const winner = groupTeamsList.find(gt => gt.teamId === match.winnerId)?.team

                            return (
                              <div key={match.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center mb-4">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="font-mono">#{index + 1}</Badge>
                                    <div className="font-medium text-sm text-muted-foreground">
                                      {match.matchDate && new Date(match.matchDate).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={
                                      match.status === 'completed' ? 'default' : 
                                      match.status === 'live' ? 'destructive' :
                                      match.status === 'started' ? 'destructive' : 
                                      'secondary'
                                    }>
                                      {match.status || 'scheduled'}
                                    </Badge>
                                    {match.matchId && match.status !== 'completed' && (
                                      <Link href={`/matches/${match.matchId}`}>
                                        <Button size="sm" variant="default">
                                          {match.status === 'scheduled' ? 'Start Match' : 'Continue Match'}
                                        </Button>
                                      </Link>
                                    )}
                                    {match.matchId && match.status === 'completed' && (
                                      <Link href={`/matches/${match.matchId}`}>
                                        <Button size="sm" variant="outline">
                                          View Details
                                        </Button>
                                      </Link>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center flex-1 justify-end mr-4">
                                    <div className="text-right mr-3">
                                      <div className="font-semibold text-lg">{team1?.name || 'TBD'}</div>
                                      {match.status === 'completed' && match.team1Score && (
                                        <div className="text-2xl font-bold mt-1">
                                          {formatScore(match.team1Score, currentSport?.sport || '')}
                                        </div>
                                      )}
                                    </div>
                                    {team1?.logo && (
                                      <div className="w-12 h-12 bg-gray-100 rounded-full relative">
                                        <Image
                                          src={team1.logo}
                                          alt={team1.name}
                                          fill
                                          className="object-contain p-2"
                                          sizes="48px"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  <div className="mx-4 text-gray-500 font-bold">VS</div>

                                  <div className="flex items-center flex-1">
                                    {team2?.logo && (
                                      <div className="w-12 h-12 bg-gray-100 rounded-full relative">
                                        <Image
                                          src={team2.logo}
                                          alt={team2.name}
                                          fill
                                          className="object-contain p-2"
                                          sizes="48px"
                                        />
                                      </div>
                                    )}
                                    <div className="ml-3">
                                      <div className="font-semibold text-lg">{team2?.name || 'TBD'}</div>
                                      {match.status === 'completed' && match.team2Score && (
                                        <div className="text-2xl font-bold mt-1">
                                          {formatScore(match.team2Score, currentSport?.sport || '')}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {match.winnerId && winner && match.status === 'completed' && (
                                  <div className="mt-4 text-center">
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                      <Award className="h-3 w-3 mr-1" />
                                      {winner.name} won
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No matches scheduled yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  )
}
