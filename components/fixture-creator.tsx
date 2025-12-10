"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Calendar, MapPin, Trash2, Plus, Zap, AlertCircle, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"

interface Team {
  id: string
  name: string
  logo?: string
}

interface Fixture {
  id: string
  team1Id: string
  team2Id: string
  matchDate: string
  matchNumber: number
  team1: { name: string; logo?: string }
  team2: { name: string; logo?: string }
}

interface FixtureCreatorProps {
  groupId: string
  tournamentId: string
  sport: string
  teams: Team[]
  existingFixtures?: Fixture[]
  onFixtureCreated?: () => void
}

export function FixtureCreator({ 
  groupId,
  tournamentId,
  sport, 
  teams, 
  existingFixtures = [],
  onFixtureCreated 
}: FixtureCreatorProps) {
  const { toast } = useToast()
  const [team1Id, setTeam1Id] = useState<string>("")
  const [team2Id, setTeam2Id] = useState<string>("")
  const [matchDate, setMatchDate] = useState<string>("")
  const [venue, setVenue] = useState<string>("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [isGeneratingRoundRobin, setIsGeneratingRoundRobin] = useState(false)
  
  // Cricket-specific configuration
  const [cricketTotalOvers, setCricketTotalOvers] = useState("20")
  const [cricketMaxOversPerBowler, setCricketMaxOversPerBowler] = useState("4")
  
  // Volleyball-specific configuration
  const [volleyballNumberOfSets, setVolleyballNumberOfSets] = useState<"3" | "5">("5")
  
  // Badminton-specific configuration
  const [badmintonNumberOfMatches, setBadmintonNumberOfMatches] = useState<"3" | "5" | "7">("3")
  const [badmintonSetsPerMatch, setBadmintonSetsPerMatch] = useState<"2" | "3">("2")
  const [badmintonPointsToWin, setBadmintonPointsToWin] = useState<"11" | "15" | "21">("21")
  
  // Table Tennis-specific configuration
  const [tableTennisNumberOfMatches, setTableTennisNumberOfMatches] = useState<"3" | "5" | "7">("3")
  const [tableTennisSetsPerMatch, setTableTennisSetsPerMatch] = useState<"2" | "3" | "4">("2")
  const [tableTennisPointsToWin, setTableTennisPointsToWin] = useState<"11" | "21">("11")

  useEffect(() => {
    // Load fixtures on mount or when groupId changes
    const loadFixtures = async () => {
      try {
        // For now, just use empty array - fixtures will be loaded from API
        setFixtures([])
      } catch (err) {
        console.error("Error loading fixtures:", err)
      }
    }
    loadFixtures()
  }, [groupId])

  const handleCreateFixture = async () => {
    setError(null)
    
    if (!team1Id || !team2Id || !matchDate || !venue) {
      setError("Please fill in all fields")
      return
    }
    
    if (team1Id === team2Id) {
      setError("Teams must be different")
      return
    }
    
    // Validate cricket configuration
    if (sport === "cricket") {
      if (!cricketTotalOvers || !cricketMaxOversPerBowler) {
        setError("Please configure cricket match settings")
        return
      }
      const totalOvers = parseInt(cricketTotalOvers)
      const maxOvers = parseInt(cricketMaxOversPerBowler)
      if (maxOvers > totalOvers) {
        setError("Max overs per bowler cannot exceed total overs")
        return
      }
    }
    
    // Validate volleyball configuration
    if (sport === "volleyball") {
      if (!volleyballNumberOfSets) {
        setError("Please select number of sets")
        return
      }
    }
    
    // Validate badminton configuration
    if (sport === "badminton") {
      if (!badmintonNumberOfMatches || !badmintonSetsPerMatch || !badmintonPointsToWin) {
        setError("Please configure badminton match settings")
        return
      }
    }
    
    // Validate table tennis configuration
    if (sport === "table-tennis") {
      if (!tableTennisNumberOfMatches || !tableTennisSetsPerMatch || !tableTennisPointsToWin) {
        setError("Please configure table tennis match settings")
        return
      }
    }
    
    setIsCreating(true)
    
    try {
      const requestBody: any = {
        groupId,
        team1Id,
        team2Id,
        matchDate,
        venue,
        sport
      }
      
      // Add cricket configuration
      if (sport === "cricket") {
        requestBody.cricketConfig = {
          totalOvers: parseInt(cricketTotalOvers),
          maxOversPerBowler: parseInt(cricketMaxOversPerBowler)
        }
      }
      
      // Add volleyball configuration
      if (sport === "volleyball") {
        requestBody.volleyballConfig = {
          numberOfSets: parseInt(volleyballNumberOfSets)
        }
      }
      
      // Add badminton configuration
      if (sport === "badminton") {
        requestBody.badmintonConfig = {
          numberOfMatches: parseInt(badmintonNumberOfMatches),
          setsPerMatch: parseInt(badmintonSetsPerMatch),
          pointsToWinPerSet: parseInt(badmintonPointsToWin)
        }
      }
      
      // Add table tennis configuration
      if (sport === "table-tennis") {
        requestBody.tableTennisConfig = {
          numberOfMatches: parseInt(tableTennisNumberOfMatches),
          setsPerMatch: parseInt(tableTennisSetsPerMatch),
          pointsToWinPerSet: parseInt(tableTennisPointsToWin)
        }
      }
      
      const response = await fetch(`/api/tournaments/${tournamentId}/fixtures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create fixture")
      }
      
      const result = await response.json()
      
      // Get team names for notification
      const team1 = teams.find(t => t.id === team1Id)
      const team2 = teams.find(t => t.id === team2Id)
      
      // Show success toast
      toast({
        title: "Fixture Created!",
        description: `${team1?.name || "Team 1"} vs ${team2?.name || "Team 2"} fixture has been created successfully.`,
        variant: "default",
      })
      
      // Reset form
      setTeam1Id("")
      setTeam2Id("")
      setMatchDate("")
      setVenue("")
      // Reset sport-specific configs
      if (sport === "cricket") {
        setCricketTotalOvers("20")
        setCricketMaxOversPerBowler("4")
      } else if (sport === "volleyball") {
        setVolleyballNumberOfSets("5")
      } else if (sport === "badminton") {
        setBadmintonGamesToWin("2")
        setBadmintonPointsToWin("21")
      } else if (sport === "table-tennis") {
        setTableTennisSetsToWin("2")
        setTableTennisPointsToWin("11")
      }
      
      // Refresh fixtures
      if (onFixtureCreated) {
        onFixtureCreated()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create fixture")
    } finally {
      setIsCreating(false)
    }
  }

  const handleGenerateRoundRobin = async () => {
    if (teams.length < 2) {
      setError("Need at least 2 teams for round robin")
      return
    }
    
    if (!venue || !matchDate) {
      setError("Please set venue and start date first")
      return
    }
    
    // Validate cricket configuration
    if (sport === "cricket") {
      if (!cricketTotalOvers || !cricketMaxOversPerBowler) {
        setError("Please configure cricket match settings")
        return
      }
      const totalOvers = parseInt(cricketTotalOvers)
      const maxOvers = parseInt(cricketMaxOversPerBowler)
      if (maxOvers > totalOvers) {
        setError("Max overs per bowler cannot exceed total overs")
        return
      }
    }
    
    // Validate volleyball configuration
    if (sport === "volleyball") {
      if (!volleyballNumberOfSets) {
        setError("Please select number of sets")
        return
      }
    }
    
    // Validate badminton configuration
    if (sport === "badminton") {
      if (!badmintonGamesToWin || !badmintonPointsToWin) {
        setError("Please configure badminton match settings")
        return
      }
    }
    
    // Validate table tennis configuration
    if (sport === "table-tennis") {
      if (!tableTennisSetsToWin || !tableTennisPointsToWin) {
        setError("Please configure table tennis match settings")
        return
      }
    }
    
    setIsGeneratingRoundRobin(true)
    setError(null)
    
    try {
      const requestBody: any = {
        groupId,
        sport,
        venue,
        startDate: matchDate
      }
      
      // Add cricket configuration
      if (sport === "cricket") {
        requestBody.cricketConfig = {
          totalOvers: parseInt(cricketTotalOvers),
          maxOversPerBowler: parseInt(cricketMaxOversPerBowler)
        }
      }
      
      // Add volleyball configuration
      if (sport === "volleyball") {
        requestBody.volleyballConfig = {
          numberOfSets: parseInt(volleyballNumberOfSets)
        }
      }
      
      // Add badminton configuration
      if (sport === "badminton") {
        requestBody.badmintonConfig = {
          numberOfMatches: parseInt(badmintonNumberOfMatches),
          setsPerMatch: parseInt(badmintonSetsPerMatch),
          pointsToWinPerSet: parseInt(badmintonPointsToWin)
        }
      }
      
      // Add table tennis configuration
      if (sport === "table-tennis") {
        requestBody.tableTennisConfig = {
          numberOfMatches: parseInt(tableTennisNumberOfMatches),
          setsPerMatch: parseInt(tableTennisSetsPerMatch),
          pointsToWinPerSet: parseInt(tableTennisPointsToWin)
        }
      }
      
      const response = await fetch(`/api/tournaments/${tournamentId}/round-robin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate round robin")
      }
      
      const result = await response.json()
      
      // Show success toast with count
      toast({
        title: "Fixtures Generated!",
        description: `Successfully created ${result.count || result.fixtures?.length || 0} round robin fixtures.`,
        variant: "default",
      })
      
      // Refresh fixtures
      if (onFixtureCreated) {
        onFixtureCreated()
      }
      
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate round robin")
    } finally {
      setIsGeneratingRoundRobin(false)
    }
  }

  const handleDeleteFixture = async (fixtureId: string) => {
    if (!confirm("Delete this fixture?")) return
    
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/fixtures/${fixtureId}`, {
        method: "DELETE"
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete fixture")
      }
      
      setFixtures(fixtures.filter(f => f.id !== fixtureId))
      
      if (onFixtureCreated) {
        onFixtureCreated()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete fixture")
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Available Teams */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Available Teams ({teams.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted transition-colors"
              >
                {team.logo && (
                  <Image
                    src={team.logo}
                    alt={team.name}
                    width={32}
                    height={32}
                    className="rounded"
                  />
                )}
                <span className="text-sm font-medium truncate">{team.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Fixture Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Create Fixture</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateRoundRobin}
              disabled={isGeneratingRoundRobin || teams.length < 2}
            >
              <Zap className="h-4 w-4 mr-2" />
              {isGeneratingRoundRobin ? "Generating..." : "Generate Round Robin"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Team 1</Label>
              <Select value={team1Id} onValueChange={setTeam1Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team 1" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Team 2</Label>
              <Select value={team2Id} onValueChange={setTeam2Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team 2" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id} disabled={team.id === team1Id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Match Date & Time
              </Label>
              <Input
                type="datetime-local"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Venue
              </Label>
              <Input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Enter venue name"
              />
            </div>
          </div>

          {/* Cricket-specific configuration */}
          {sport === "cricket" && (
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200 space-y-4">
              <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                🏏 Cricket Match Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalOvers" className="text-base font-semibold">Total Overs *</Label>
                  <Select value={cricketTotalOvers} onValueChange={setCricketTotalOvers} required>
                    <SelectTrigger id="totalOvers" className="h-12 bg-white">
                      <SelectValue placeholder="Select total overs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Overs</SelectItem>
                      <SelectItem value="10">10 Overs</SelectItem>
                      <SelectItem value="20">20 Overs</SelectItem>
                      <SelectItem value="50">50 Overs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxOversPerBowler" className="text-base font-semibold">Max Overs per Bowler *</Label>
                  <Select value={cricketMaxOversPerBowler} onValueChange={setCricketMaxOversPerBowler} required>
                    <SelectTrigger id="maxOversPerBowler" className="h-12 bg-white">
                      <SelectValue placeholder="Select max overs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Over</SelectItem>
                      <SelectItem value="2">2 Overs</SelectItem>
                      <SelectItem value="3">3 Overs</SelectItem>
                      <SelectItem value="4">4 Overs</SelectItem>
                      <SelectItem value="5">5 Overs</SelectItem>
                      <SelectItem value="10">10 Overs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-blue-700">
                Note: Toss and batting order will be configured when the match starts for the first time.
              </p>
            </div>
          )}

          {/* Volleyball-specific configuration */}
          {sport === "volleyball" && (
            <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200 space-y-4">
              <h3 className="font-semibold text-orange-900 flex items-center gap-2">
                🏐 Volleyball Match Configuration
              </h3>
              <div className="space-y-2">
                <Label htmlFor="numberOfSets" className="text-base font-semibold">Number of Sets *</Label>
                <Select value={volleyballNumberOfSets} onValueChange={(val) => setVolleyballNumberOfSets(val as "3" | "5")} required>
                  <SelectTrigger id="numberOfSets" className="h-12 bg-white">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Best of 3 Sets (First to 2 wins)</SelectItem>
                    <SelectItem value="5">Best of 5 Sets (First to 3 wins)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-orange-700">
                  Sets 1-4: First to 25 points (win by 2) | Set 5: First to 15 points (win by 2)
                </p>
              </div>
              <p className="text-xs text-orange-600">
                Note: Toss for court side/serve will be conducted when the match starts for the first time.
              </p>
            </div>
          )}

          {/* Badminton-specific configuration */}
          {sport === "badminton" && (
            <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200 space-y-4">
              <h3 className="font-semibold text-yellow-900 flex items-center gap-2">
                🏸 Badminton Match Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numberOfMatches" className="text-base font-semibold">Number of Matches *</Label>
                  <Select value={badmintonNumberOfMatches} onValueChange={(val) => setBadmintonNumberOfMatches(val as "3" | "5" | "7")} required>
                    <SelectTrigger id="numberOfMatches" className="h-12 bg-white">
                      <SelectValue placeholder="Select number" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Matches</SelectItem>
                      <SelectItem value="5">5 Matches</SelectItem>
                      <SelectItem value="7">7 Matches</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setsPerMatch" className="text-base font-semibold">Sets per Match *</Label>
                  <Select value={badmintonSetsPerMatch} onValueChange={(val) => setBadmintonSetsPerMatch(val as "2" | "3")} required>
                    <SelectTrigger id="setsPerMatch" className="h-12 bg-white">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">Best of 3 Sets (First to 2 wins)</SelectItem>
                      <SelectItem value="3">Best of 5 Sets (First to 3 wins)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointsToWin" className="text-base font-semibold">Points per Set *</Label>
                  <Select value={badmintonPointsToWin} onValueChange={(val) => setBadmintonPointsToWin(val as "11" | "15" | "21")} required>
                    <SelectTrigger id="pointsToWin" className="h-12 bg-white">
                      <SelectValue placeholder="Select points" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="11">11 Points (Win by 2, max 15)</SelectItem>
                      <SelectItem value="15">15 Points (Win by 2, max 19)</SelectItem>
                      <SelectItem value="21">21 Points (Win by 2, max 30)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-yellow-700">
                All {badmintonNumberOfMatches} matches will be played. Each match: {badmintonSetsPerMatch === "2" ? "3" : "5"} sets (first to {badmintonSetsPerMatch} wins). Each set: first to {badmintonPointsToWin} points, win by 2.
              </p>
              <p className="text-xs text-yellow-600">
                Note: Toss for serve/court side will be conducted when the match starts for the first time.
              </p>
            </div>
          )}

          {/* Table Tennis-specific configuration */}
          {sport === "table-tennis" && (
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200 space-y-4">
              <h3 className="font-semibold text-green-900 flex items-center gap-2">
                🏓 Table Tennis Match Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numberOfMatches" className="text-base font-semibold">Number of Matches *</Label>
                  <Select value={tableTennisNumberOfMatches} onValueChange={(val) => setTableTennisNumberOfMatches(val as "3" | "5" | "7")} required>
                    <SelectTrigger id="numberOfMatches" className="h-12 bg-white">
                      <SelectValue placeholder="Select number" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Matches</SelectItem>
                      <SelectItem value="5">5 Matches</SelectItem>
                      <SelectItem value="7">7 Matches</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setsPerMatch" className="text-base font-semibold">Sets per Match *</Label>
                  <Select value={tableTennisSetsPerMatch} onValueChange={(val) => setTableTennisSetsPerMatch(val as "2" | "3" | "4")} required>
                    <SelectTrigger id="setsPerMatch" className="h-12 bg-white">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">Best of 3 Sets (First to 2 wins)</SelectItem>
                      <SelectItem value="3">Best of 5 Sets (First to 3 wins)</SelectItem>
                      <SelectItem value="4">Best of 7 Sets (First to 4 wins)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointsToWin" className="text-base font-semibold">Points per Set *</Label>
                  <Select value={tableTennisPointsToWin} onValueChange={(val) => setTableTennisPointsToWin(val as "11" | "21")} required>
                    <SelectTrigger id="pointsToWin" className="h-12 bg-white">
                      <SelectValue placeholder="Select points" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="11">11 Points (Win by 2)</SelectItem>
                      <SelectItem value="21">21 Points (Win by 2)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-green-700">
                All {tableTennisNumberOfMatches} matches will be played. Each match: {tableTennisSetsPerMatch === "2" ? "3" : tableTennisSetsPerMatch === "3" ? "5" : "7"} sets (first to {tableTennisSetsPerMatch} wins). Each set: first to {tableTennisPointsToWin} points, win by 2.
              </p>
              <p className="text-xs text-green-600">
                Note: Toss for serve/table side will be conducted when the match starts for the first time.
              </p>
            </div>
          )}

          <Button
            onClick={handleCreateFixture}
            disabled={isCreating || !team1Id || !team2Id || !matchDate || !venue || 
              (sport === "cricket" && (!cricketTotalOvers || !cricketMaxOversPerBowler)) ||
              (sport === "volleyball" && !volleyballNumberOfSets) ||
              (sport === "badminton" && (!badmintonNumberOfMatches || !badmintonSetsPerMatch || !badmintonPointsToWin)) ||
              (sport === "table-tennis" && (!tableTennisNumberOfMatches || !tableTennisSetsPerMatch || !tableTennisPointsToWin))}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isCreating ? "Creating..." : "Add Fixture"}
          </Button>
        </CardContent>
      </Card>

      {/* Created Fixtures */}
      {fixtures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Created Fixtures ({fixtures.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fixtures.map((fixture, index) => (
                <motion.div
                  key={fixture.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Badge variant="outline" className="font-mono">
                      #{fixture.matchNumber}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {fixture.team1.logo && (
                        <Image
                          src={fixture.team1.logo}
                          alt={fixture.team1.name}
                          width={24}
                          height={24}
                          className="rounded"
                        />
                      )}
                      <span className="font-medium">{fixture.team1.name}</span>
                    </div>
                    <span className="text-muted-foreground">vs</span>
                    <div className="flex items-center gap-2">
                      {fixture.team2.logo && (
                        <Image
                          src={fixture.team2.logo}
                          alt={fixture.team2.name}
                          width={24}
                          height={24}
                          className="rounded"
                        />
                      )}
                      <span className="font-medium">{fixture.team2.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {new Date(fixture.matchDate).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteFixture(fixture.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

