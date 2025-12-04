"use client"

import Link from "next/link"
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FixtureCreator } from "@/components/fixture-creator"
import { 
  createTournamentBasic, 
  addTournamentSport, 
  getTournamentSports,
  createTournamentGroup,
  getTournamentGroups,
  getTeamsBySport,
  addTeamToGroup,
  removeTeamFromGroup,
  getGroupTeams,
  createBracketNode,
  getTournamentBracketNodes,
  updateTournament
} from "@/lib/client-api"
import TournamentBracket from "@/components/tournament-bracket"
import { Trophy, Users, Calendar, X, Plus, ChevronRight, ChevronLeft, Trash2, Info } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Image from "next/image"
import { PageTransition } from "@/components/page-transition"
import { motion } from "framer-motion"
import type { TournamentSport, TournamentGroup, GroupTeam, Team } from "@/lib/static-data"

export default function CreateTournamentPage() {
  const router = useRouter()
  const { isAdmin, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/?error=access_denied&message=You do not have permission to access this page. Admin access required.")
    }
  }, [isAdmin, authLoading, router])

  const [step, setStep] = useState(1)
  const [tournamentId, setTournamentId] = useState<string | null>(null)
  
  // Step 1: Tournament Name
  const [tournamentName, setTournamentName] = useState("")
  const [sportsCount, setSportsCount] = useState(1)
  
  // Step 2: Sports Selection
  const [selectedSports, setSelectedSports] = useState<string[]>([])
  const [tournamentSports, setTournamentSports] = useState<TournamentSport[]>([])
  
  // Step 3: Groups and Teams
  const [currentSportIndex, setCurrentSportIndex] = useState(0)
  const [groups, setGroups] = useState<Record<string, TournamentGroup[]>>({}) // sport -> groups
  const [groupTeams, setGroupTeams] = useState<Record<string, GroupTeam[]>>({}) // groupId -> teams
  const [availableTeams, setAvailableTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [selectedGroupForAdd, setSelectedGroupForAdd] = useState<string>("") // Track selected group for adding teams
  const [bracketFormat, setBracketFormat] = useState<string>("single-elimination") // Bracket format selection
  
  // Step 4: Bracket
  const [bracketNodes, setBracketNodes] = useState<any[]>([])
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null)

  const sportOptions = [
    { id: "cricket", name: "Cricket", color: "#3b82f6" },
    { id: "volleyball", name: "Volleyball", color: "#ef4444" },
    { id: "chess", name: "Chess", color: "#10b981" },
    { id: "futsal", name: "Futsal", color: "#f59e0b" },
    { id: "table-tennis", name: "Table Tennis", color: "#8b5cf6" },
    { id: "badminton", name: "Badminton", color: "#ec4899" },
  ]

  // Step 1: Create Tournament Basic
  const handleCreateTournament = async () => {
    if (!tournamentName.trim()) {
      alert("Please enter a tournament name")
      return
    }

    try {
      const tournament = await createTournamentBasic(tournamentName, sportsCount)
      setTournamentId(tournament.id)
      setStep(2)
    } catch (error) {
      console.error("Error creating tournament:", error)
      alert("Failed to create tournament. Please try again.")
    }
  }

  // Step 2: Add Sports
  const handleAddSport = async (sport: string) => {
    if (!tournamentId || selectedSports.includes(sport)) return

    try {
      const tournamentSport = await addTournamentSport(
        tournamentId,
        sport,
        selectedSports.length
      )
      setSelectedSports([...selectedSports, sport])
      setTournamentSports([...tournamentSports, tournamentSport])
    } catch (error) {
      console.error("Error adding sport:", error)
      alert("Failed to add sport")
    }
  }

  const handleRemoveSport = (sport: string) => {
    setSelectedSports(selectedSports.filter((s) => s !== sport))
    setTournamentSports(tournamentSports.filter((ts) => ts.sport !== sport))
    // Remove groups for this sport
    const newGroups = { ...groups }
    delete newGroups[sport]
    setGroups(newGroups)
  }

  const handleNextToGroups = () => {
    if (selectedSports.length === 0) {
      alert("Please select at least one sport")
      return
    }
    setStep(3)
    setCurrentSportIndex(0)
    loadTeamsForCurrentSport()
  }

  // Step 3: Groups and Teams
  const loadTeamsForCurrentSport = async () => {
    if (selectedSports.length === 0) return
    
    const currentSport = selectedSports[currentSportIndex]
    try {
      setLoadingTeams(true)
      const teams = await getTeamsBySport(currentSport)
      setAvailableTeams(teams)
      
      // Load groups for this sport
      if (tournamentId) {
        const sportGroups = await getTournamentGroups(tournamentId, currentSport)
        setGroups((prev) => ({ ...prev, [currentSport]: sportGroups }))
        
        // Auto-select first group if available
        if (sportGroups.length > 0) {
          setSelectedGroupForAdd(sportGroups[0].id)
        } else {
          setSelectedGroupForAdd("")
        }
        
        // Load teams for each group
        for (const group of sportGroups) {
          const teams = await getGroupTeams(group.id)
          setGroupTeams((prev) => ({ ...prev, [group.id]: teams }))
        }
      }
    } catch (error) {
      console.error("Error loading teams:", error)
    } finally {
      setLoadingTeams(false)
    }
  }

  // Load existing tournament sports when entering step 2
  useEffect(() => {
    const loadExistingSports = async () => {
      if (step === 2 && tournamentId && selectedSports.length === 0) {
        try {
          const existingSports = await getTournamentSports(tournamentId)
          if (existingSports.length > 0) {
            setTournamentSports(existingSports)
            setSelectedSports(existingSports.map((ts) => ts.sport))
          }
        } catch (error) {
          console.error("Error loading existing sports:", error)
        }
      }
    }
    loadExistingSports()
  }, [step, tournamentId])

  useEffect(() => {
    if (step === 3 && selectedSports.length > 0) {
      loadTeamsForCurrentSport()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, currentSportIndex, selectedSports.length])

  const handleCreateGroup = async () => {
    if (!tournamentId || !newGroupName.trim()) return
    
    const currentSport = selectedSports[currentSportIndex]
    const tournamentSport = tournamentSports.find((ts) => ts.sport === currentSport)
    
    if (!tournamentSport) return

    try {
      const group = await createTournamentGroup(
        tournamentId,
        tournamentSport.id,
        newGroupName.trim(),
        currentSport,
        (groups[currentSport]?.length || 0)
      )
      setGroups((prev) => ({
        ...prev,
        [currentSport]: [...(prev[currentSport] || []), group],
      }))
      // Auto-select the newly created group for adding teams
      setSelectedGroupForAdd(group.id)
      setNewGroupName("")
    } catch (error) {
      console.error("Error creating group:", error)
      alert("Failed to create group")
    }
  }

  const handleAddTeamToGroup = async (groupId: string, teamId: string) => {
    try {
      const groupTeamsList = groupTeams[groupId] || []
      await addTeamToGroup(groupId, teamId, groupTeamsList.length)
      
      const teams = await getGroupTeams(groupId)
      setGroupTeams((prev) => ({ ...prev, [groupId]: teams }))
    } catch (error) {
      console.error("Error adding team to group:", error)
      alert("Failed to add team to group")
    }
  }

  const handleRemoveTeamFromGroup = async (groupId: string, teamId: string) => {
    try {
      await removeTeamFromGroup(groupId, teamId)
      const teams = await getGroupTeams(groupId)
      setGroupTeams((prev) => ({ ...prev, [groupId]: teams }))
    } catch (error) {
      console.error("Error removing team from group:", error)
      alert("Failed to remove team from group")
    }
  }

  const handleNextToFixtures = async () => {
    // Check if all sports have groups with teams
    let hasGroups = true
    for (const sport of selectedSports) {
      const sportGroups = groups[sport] || []
      if (sportGroups.length === 0) {
        hasGroups = false
        break
      }
      for (const group of sportGroups) {
        const teams = groupTeams[group.id] || []
        if (teams.length === 0) {
          hasGroups = false
          break
        }
      }
      if (!hasGroups) break
    }

    if (!hasGroups) {
      alert("Please create groups and add teams for all sports")
      return
    }

    // Move to Step 4: Manual Fixtures
    setStep(4)
    setCurrentSportIndex(0) // Start with first sport for fixtures
  }

  // Step 4: Generate Bracket
  const generateBracket = async (groupId: string) => {
    if (!tournamentId) return

    const teams = groupTeams[groupId] || []
    if (teams.length < 2) {
      alert("Group must have at least 2 teams")
      return
    }

    try {
      // Delete existing bracket nodes for this group
      // (We'll regenerate them)
      
      const numRounds = Math.ceil(Math.log2(teams.length))
      const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]
      
      const nodes: any[] = []
      let matchId = 1

      // Generate final match
      const finalMatch = await createBracketNode(tournamentId, {
        groupId,
        nodeType: "match",
        roundNumber: numRounds,
        matchNumber: 1,
        position: 1,
        nodeData: {
          color: colors[0],
          backgroundColor: `${colors[0]}20`,
        },
      })
      nodes.push(finalMatch)

      // Generate rounds from bottom up
      for (let round = numRounds - 1; round >= 1; round--) {
        const numMatchesInRound = Math.pow(2, numRounds - round)

        for (let position = 1; position <= numMatchesInRound; position++) {
          const nextMatchNumber = Math.ceil(position / 2)
          const nextMatch = nodes.find(
            (n) => n.roundNumber === round + 1 && n.matchNumber === nextMatchNumber
          )

          const teamIndex = (position - 1) * 2
          const team1Id = round === 1 && teamIndex < teams.length ? teams[teamIndex].teamId : undefined
          const team2Id = round === 1 && teamIndex + 1 < teams.length ? teams[teamIndex + 1].teamId : undefined

          const node = await createBracketNode(tournamentId, {
            groupId,
            nodeType: "match",
            roundNumber: round,
            matchNumber: position,
            position,
            nextMatchId: nextMatch?.id,
            nodeData: {
              color: colors[round % colors.length],
              backgroundColor: `${colors[round % colors.length]}20`,
              x: round * 300,
              y: position * 150,
              team1Id: team1Id, // Store team IDs in nodeData for bracket component
              team2Id: team2Id,
            },
          })
          nodes.push(node)
        }
      }

      // Reload bracket nodes and transform for bracket component
      const allNodes = await getTournamentBracketNodes(tournamentId, groupId)
      const matchNodes = allNodes.filter((n) => n.nodeType === "match").map((node) => ({
        id: node.id,
        round: node.roundNumber || 1,
        roundNumber: node.roundNumber,
        position: node.position || 1,
        team1: node.nodeData?.team1Id,
        team2: node.nodeData?.team2Id,
        winner: node.winnerId,
        winnerId: node.winnerId,
        nextMatchId: node.nextMatchId,
        date: node.matchDate,
        matchDate: node.matchDate,
        score: node.score,
        score1: node.score?.team1,
        score2: node.score?.team2,
        nodeData: node.nodeData,
      }))
      setBracketNodes(matchNodes)
    } catch (error) {
      console.error("Error generating bracket:", error)
      alert("Failed to generate bracket")
    }
  }

  const handleFinalizeTournament = async () => {
    if (!tournamentId) return

    try {
      alert(`Tournament "${tournamentName}" created successfully!`)
      router.push("/tournaments")
    } catch (error) {
      console.error("Error finalizing tournament:", error)
      alert("Failed to finalize tournament")
    }
  }

  const currentSport = selectedSports[currentSportIndex] || ""
  const currentGroups = groups[currentSport] || []
  const currentSportColor = sportOptions.find((s) => s.id === currentSport)?.color || "#3b82f6"

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Trophy className="h-6 w-6 text-primary mr-2" />
              Create Tournament
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      step >= s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > s ? "✓" : s}
                  </div>
                  {s < 4 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        step > s ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mb-8 text-sm text-muted-foreground">
              <span>Tournament Name</span>
              <span>Select Sports</span>
              <span>Groups & Teams</span>
              <span>Bracket</span>
            </div>

            {/* Step 1: Tournament Name */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Tournament Name</Label>
                  <Input
                    id="name"
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    placeholder="Enter tournament name"
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sportsCount">Number of Sports</Label>
                  <Select
                    value={sportsCount.toString()}
                    onValueChange={(value) => setSportsCount(Number.parseInt(value))}
                  >
                    <SelectTrigger id="sportsCount">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? "Sport" : "Sports"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleCreateTournament}
                    disabled={!tournamentName.trim()}
                    size="lg"
                  >
                    Next: Select Sports <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Sports Selection */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    Select Sports ({selectedSports.length}/{sportsCount})
                  </h3>
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {sportOptions.map((sport) => (
                    <motion.div
                      key={sport.id}
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedSports.includes(sport.id)
                          ? "border-primary bg-primary/10"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => handleAddSport(sport.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{sport.name}</span>
                        {selectedSports.includes(sport.id) && (
                          <Badge className="bg-primary">Selected</Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {selectedSports.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Selected Sports:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSports.map((sport) => {
                        const sportInfo = sportOptions.find((s) => s.id === sport)
                        return (
                          <Badge
                            key={sport}
                            className="p-2 cursor-pointer"
                            style={{ backgroundColor: `${sportInfo?.color}20`, color: sportInfo?.color }}
                            onClick={() => handleRemoveSport(sport)}
                          >
                            {sportInfo?.name}
                            <X className="ml-2 h-3 w-3" />
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleNextToGroups}
                    disabled={selectedSports.length === 0}
                    size="lg"
                  >
                    Next: Groups & Teams <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Groups and Teams */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Groups & Teams</h3>
                    <p className="text-sm text-muted-foreground">
                      Sport {currentSportIndex + 1} of {selectedSports.length}:{" "}
                      {sportOptions.find((s) => s.id === currentSport)?.name}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                </div>

                {/* Sport Navigation */}
                {selectedSports.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedSports.map((sport, idx) => {
                      const sportInfo = sportOptions.find((s) => s.id === sport)
                      return (
                        <Button
                          key={sport}
                          variant={currentSportIndex === idx ? "default" : "outline"}
                          onClick={() => setCurrentSportIndex(idx)}
                          className="whitespace-nowrap"
                          style={
                            currentSportIndex === idx
                              ? { backgroundColor: sportInfo?.color, borderColor: sportInfo?.color }
                              : {}
                          }
                        >
                          {sportInfo?.name}
                        </Button>
                      )
                    })}
                  </div>
                )}

                {/* Group Selector */}
                {currentGroups.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border-2 border-primary/20">
                    <Users className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <Label className="text-sm font-medium">Select Group to Add Teams</Label>
                      <Select value={selectedGroupForAdd} onValueChange={setSelectedGroupForAdd}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose a group" />
                        </SelectTrigger>
                        <SelectContent>
                          {currentGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.groupName} ({groupTeams[group.id]?.length || 0} teams)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Groups */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Tournament Groups
                      </h4>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Group name (e.g., Group A)"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          className="w-40"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") handleCreateGroup()
                          }}
                        />
                        <Button onClick={handleCreateGroup} size="sm" className="gap-1">
                          <Plus className="h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    </div>

                    {currentGroups.length === 0 ? (
                      <Card className="p-8 border-dashed border-2">
                        <div className="text-center space-y-2">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                          <p className="text-sm text-muted-foreground">
                            No groups created yet. Create your first group above!
                          </p>
                        </div>
                      </Card>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {currentGroups.map((group) => {
                          const teams = groupTeams[group.id] || []
                          const isSelected = selectedGroupForAdd === group.id
                          return (
                            <Card 
                              key={group.id} 
                              className={`p-4 transition-all border-2 ${
                                isSelected ? "border-primary bg-primary/5" : "border-transparent"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-semibold">{group.groupName}</h5>
                                  {isSelected && (
                                    <Badge variant="default" className="text-xs">Selected</Badge>
                                  )}
                                </div>
                                <Badge variant="secondary">{teams.length} teams</Badge>
                              </div>
                              {teams.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">No teams added yet</p>
                              ) : (
                                <div className="space-y-1">
                                  {teams.map((gt) => (
                                    <motion.div
                                      key={gt.id}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      className="flex items-center justify-between p-2 bg-muted rounded text-sm hover:bg-muted/80 transition-colors"
                                    >
                                      <div className="flex items-center gap-2 flex-1">
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
                                        <span className="font-medium">{gt.team?.name || "Unknown Team"}</span>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveTeamFromGroup(group.id, gt.teamId)}
                                        className="h-7 w-7 p-0"
                                      >
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                      </Button>
                                    </motion.div>
                                  ))}
                                </div>
                              )}
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right: Available Teams */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Plus className="h-5 w-5 text-primary" />
                      Available Teams
                    </h4>
                    {loadingTeams ? (
                      <Card className="p-8">
                        <div className="text-center py-8 text-muted-foreground">Loading teams...</div>
                      </Card>
                    ) : availableTeams.length === 0 ? (
                      <Card className="p-8 border-dashed border-2">
                        <div className="text-center space-y-2">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                          <p className="text-sm text-muted-foreground">
                            No teams available for this sport yet.
                          </p>
                        </div>
                      </Card>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {availableTeams.map((team) => {
                          const isInAnyGroup = currentGroups.some(
                            (g) => (groupTeams[g.id] || []).some((gt) => gt.teamId === team.id)
                          )
                          const teamGroup = currentGroups.find((g) => 
                            (groupTeams[g.id] || []).some((gt) => gt.teamId === team.id)
                          )
                          return (
                            <motion.div
                              key={team.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Card
                                className={`p-3 cursor-pointer transition-all ${
                                  isInAnyGroup 
                                    ? "opacity-50 border-muted" 
                                    : selectedGroupForAdd 
                                      ? "hover:border-primary hover:bg-primary/5" 
                                      : "hover:border-primary/50"
                                } ${!selectedGroupForAdd ? "cursor-not-allowed" : ""}`}
                                onClick={() => {
                                  if (!selectedGroupForAdd) {
                                    alert("Please select a group first from the dropdown above")
                                    return
                                  }
                                  if (!isInAnyGroup && selectedGroupForAdd) {
                                    handleAddTeamToGroup(selectedGroupForAdd, team.id)
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    {team.logo && (
                                      <div className="w-10 h-10 relative border rounded-full overflow-hidden bg-white">
                                        <Image
                                          src={team.logo}
                                          alt={team.name}
                                          fill
                                          className="object-contain p-1"
                                          sizes="40px"
                                        />
                                      </div>
                                    )}
                                    <span className="font-medium">{team.name}</span>
                                  </div>
                                  {isInAnyGroup ? (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-xs">
                                        In {teamGroup?.groupName}
                                      </Badge>
                                    </div>
                                  ) : (
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </Card>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bracket Format Selection */}
                {currentSportIndex === selectedSports.length - 1 && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <Info className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <Label className="text-sm font-medium mb-2 block">Select Bracket Format</Label>
                          <Select value={bracketFormat} onValueChange={setBracketFormat}>
                            <SelectTrigger className="w-full max-w-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single-elimination">Single Elimination</SelectItem>
                              <SelectItem value="double-elimination">Double Elimination</SelectItem>
                              <SelectItem value="round-robin">Round Robin</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-2">
                            Single Elimination: Teams play knockout matches until one winner
                            <br />
                            Double Elimination: Teams need to lose twice to be eliminated
                            <br />
                            Round Robin: All teams play each other once
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentSportIndex > 0) {
                        setCurrentSportIndex(currentSportIndex - 1)
                      }
                    }}
                    disabled={currentSportIndex === 0}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous Sport
                  </Button>
                  <Button
                    onClick={() => {
                      if (currentSportIndex < selectedSports.length - 1) {
                        setCurrentSportIndex(currentSportIndex + 1)
                      } else {
                        handleNextToFixtures()
                      }
                    }}
                    size="lg"
                  >
                    {currentSportIndex < selectedSports.length - 1 ? (
                      <>
                        Next Sport <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Next: Create Fixtures <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Create Fixtures */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold">Create Fixtures</h3>
                    <p className="text-sm text-muted-foreground">
                      Manually create fixtures or generate round robin for {tournamentName}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setStep(3)}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Groups
                  </Button>
                </div>

                {/* Sport-wise fixture creation */}
                <Tabs 
                  value={selectedSports[currentSportIndex]}
                  onValueChange={(sport) => {
                    const index = selectedSports.indexOf(sport)
                    if (index >= 0) {
                      setCurrentSportIndex(index)
                      // loadTeamsForCurrentSport is called by useEffect when currentSportIndex changes
                    }
                  }}
                >
                  <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${selectedSports.length}, 1fr)` }}>
                    {selectedSports.map((sport) => {
                      const sportOption = sportOptions.find((opt) => opt.id === sport)
                      return (
                        <TabsTrigger key={sport} value={sport}>
                          {sportOption?.name || sport}
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>

                  {selectedSports.map((sport) => {
                    const sportGroups = groups[sport] || []
                    return (
                      <TabsContent key={sport} value={sport} className="space-y-6 mt-6">
                        {sportGroups.length === 0 ? (
                          <Card className="p-12 text-center">
                            <p className="text-muted-foreground">No groups created for this sport yet.</p>
                          </Card>
                        ) : (
                          <>
                            {sportGroups.map((group) => {
                              const teams = groupTeams[group.id] || []
                              const teamsList = teams.map((gt) => ({
                                id: gt.teamId,
                                name: gt.team?.name || "Unknown",
                                logo: gt.team?.logo
                              }))

                              return (
                                <Card key={group.id}>
                                  <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                      <Trophy className="h-5 w-5 text-primary" />
                                      {group.groupName}
                                      <Badge variant="secondary" className="ml-auto">
                                        {teams.length} teams
                                      </Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    {teams.length < 2 ? (
                                      <div className="text-center py-8 text-muted-foreground">
                                        <p>Need at least 2 teams to create fixtures</p>
                                      </div>
                                    ) : (
                                      <FixtureCreator
                                        groupId={group.id}
                                        tournamentId={tournamentId!}
                                        sport={sport}
                                        teams={teamsList}
                                        onFixtureCreated={() => {
                                          // Fixtures created successfully
                                          console.log("Fixture created for group", group.id)
                                        }}
                                      />
                                    )}
                                  </CardContent>
                                </Card>
                              )
                            })}
                          </>
                        )}
                      </TabsContent>
                    )
                  })}
                </Tabs>

                {/* Navigation */}
                <div className="flex justify-between items-center pt-6 border-t">
                  <div className="text-sm text-muted-foreground">
                    <p>💡 Tip: You can create fixtures now or add them later from the tournament page</p>
                  </div>
                  <Button onClick={handleFinalizeTournament} size="lg">
                    Finalize Tournament <Trophy className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
