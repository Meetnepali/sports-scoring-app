"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Clock, Check } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getAllTeams, createMatch } from "@/lib/client-api"
import Image from "next/image"
import { PageTransition } from "@/components/page-transition"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Team } from "@/lib/static-data"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

export default function CreateMatchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { isAdmin, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/?error=access_denied&message=You do not have permission to access this page. Admin access required.")
    }
  }, [isAdmin, authLoading, router])

  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!isAdmin) {
    return null
  }

  // Get query parameters
  const sportParam = searchParams.get("sport") || ""
  const team1Id = searchParams.get("team1") || ""
  const team2Id = searchParams.get("team2") || ""
  const tournamentName = searchParams.get("tournament") || ""

  // State for form fields
  const [selectedSport, setSelectedSport] = useState(sportParam)
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  const [homeTeam, setHomeTeam] = useState(team1Id)
  const [awayTeam, setAwayTeam] = useState(team2Id)
  const [venue, setVenue] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [hour, setHour] = useState("14")
  const [minute, setMinute] = useState("00")
  const [period, setPeriod] = useState<"AM" | "PM">("PM")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Cricket-specific configuration
  const [cricketTotalOvers, setCricketTotalOvers] = useState("20")
  const [cricketMaxOversPerBowler, setCricketMaxOversPerBowler] = useState("4")

  // Volleyball-specific configuration
  const [volleyballNumberOfSets, setVolleyballNumberOfSets] = useState<"3" | "5">("5")

  // Table Tennis-specific configuration
  const [tableTennisSetsToWin, setTableTennisSetsToWin] = useState<"2" | "3" | "4">("2")
  const [tableTennisPointsToWin, setTableTennisPointsToWin] = useState<"11" | "21">("11")
  const [tableTennisSetTypes, setTableTennisSetTypes] = useState<Array<"singles" | "doubles">>([])

  // Badminton-specific configuration
  const [badmintonGamesToWin, setBadmintonGamesToWin] = useState<"2" | "3">("2")
  const [badmintonPointsToWin, setBadmintonPointsToWin] = useState<"11" | "15" | "21">("21")
  const [badmintonGameTypes, setBadmintonGameTypes] = useState<Array<"singles" | "doubles">>([])

  // Fetch all teams from database
  useEffect(() => {
    async function fetchTeams() {
      try {
        setLoading(true)
        const teams = await getAllTeams()
        setAllTeams(teams)
        
        // Filter teams by sport if sport is selected
        if (selectedSport) {
          setFilteredTeams(teams.filter(team => team.sport === selectedSport))
        } else {
          setFilteredTeams(teams)
        }
      } catch (error) {
        console.error("Error fetching teams:", error)
        toast({
          title: "Error",
          description: "Failed to load teams from database",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    fetchTeams()
  }, [selectedSport, toast])

  // Update filtered teams when sport changes
  useEffect(() => {
    if (selectedSport && allTeams.length > 0) {
      setFilteredTeams(allTeams.filter(team => team.sport === selectedSport))
    } else {
      setFilteredTeams(allTeams)
    }
  }, [selectedSport, allTeams])

  // Calculate and initialize set types when Table Tennis format changes
  useEffect(() => {
    if (selectedSport === "table-tennis") {
      const totalSets = tableTennisSetsToWin === "2" ? 3 : tableTennisSetsToWin === "3" ? 5 : 7
      if (tableTennisSetTypes.length !== totalSets) {
        setTableTennisSetTypes(Array(totalSets).fill("singles" as "singles" | "doubles"))
      }
    }
  }, [selectedSport, tableTennisSetsToWin])

  // Calculate and initialize game types when Badminton format changes
  useEffect(() => {
    if (selectedSport === "badminton") {
      const totalGames = badmintonGamesToWin === "2" ? 3 : 5
      if (badmintonGameTypes.length !== totalGames) {
        setBadmintonGameTypes(Array(totalGames).fill("singles" as "singles" | "doubles"))
      }
    }
  }, [selectedSport, badmintonGamesToWin])

  const sportNames: Record<string, string> = {
    cricket: "Cricket",
    volleyball: "Volleyball",
    chess: "Chess",
    futsal: "Futsal",
    "table-tennis": "Table Tennis",
    badminton: "Badminton",
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSport || !homeTeam || !awayTeam || !venue || !date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    if (homeTeam === awayTeam) {
      toast({
        title: "Error",
        description: "Home team and away team must be different",
        variant: "destructive"
      })
      return
    }

    // Get sport from selected teams
    const selectedHomeTeam = getSelectedTeam(homeTeam)
    const selectedAwayTeam = getSelectedTeam(awayTeam)
    
    if (!selectedHomeTeam || !selectedAwayTeam) {
      toast({
        title: "Error",
        description: "Please select valid teams",
        variant: "destructive"
      })
      return
    }

    // Ensure both teams are from the same sport
    if (selectedHomeTeam.sport !== selectedAwayTeam.sport) {
      toast({
        title: "Error",
        description: "Both teams must be from the same sport",
        variant: "destructive"
      })
      return
    }

    // Ensure teams match the selected sport
    if (selectedHomeTeam.sport !== selectedSport) {
      toast({
        title: "Error",
        description: "Selected teams must match the chosen sport",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)
      
      // Convert time to 24-hour format
      let hour24 = Number.parseInt(hour)
      if (period === "PM" && hour24 !== 12) {
        hour24 += 12
      } else if (period === "AM" && hour24 === 12) {
        hour24 = 0
      }
      
      // Create ISO date string with time
      const matchDateTime = new Date(date)
      matchDateTime.setHours(hour24, Number.parseInt(minute), 0, 0)
      
      const matchData = {
        sport: selectedSport, // Use selected sport
        homeTeamId: homeTeam,
        awayTeamId: awayTeam,
        date: matchDateTime.toISOString(),
        venue: venue,
        status: "scheduled"
      }

      console.log("Creating match with data:", matchData)
      const createdMatch = await createMatch(matchData)

      // If cricket, save cricket-specific configuration
      if (selectedSport === "cricket" && createdMatch?.id) {
        try {
          await fetch(`/api/matches/${createdMatch.id}/cricket/config`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              totalOvers: parseInt(cricketTotalOvers),
              maxOversPerBowler: parseInt(cricketMaxOversPerBowler),
              configCompleted: false, // Explicitly set to false - will be true only after toss is completed
            }),
          })
        } catch (error) {
          console.error("Error saving cricket config:", error)
          // Don't fail the match creation if config save fails
        }
      }

      // If volleyball, save volleyball-specific configuration
      if (selectedSport === "volleyball" && createdMatch?.id) {
        try {
          await fetch(`/api/matches/${createdMatch.id}/volleyball/config`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              numberOfSets: parseInt(volleyballNumberOfSets),
              configCompleted: false, // Will be completed when toss is done
            }),
          })
        } catch (error) {
          console.error("Error saving volleyball config:", error)
          // Don't fail the match creation if config save fails
        }
      }

      // If badminton, save badminton-specific configuration
      if (selectedSport === "badminton" && createdMatch?.id) {
        try {
          await fetch(`/api/matches/${createdMatch.id}/badminton/config`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              gamesToWin: parseInt(badmintonGamesToWin),
              pointsToWinPerGame: parseInt(badmintonPointsToWin),
              gameTypes: badmintonGameTypes, // Pre-configured game types
              configCompleted: false, // Will be completed when toss is done
            }),
          })
        } catch (error) {
          console.error("Error saving badminton config:", error)
          // Don't fail the match creation if config save fails
        }
      }

      // If table-tennis, save table-tennis-specific configuration
      if (selectedSport === "table-tennis" && createdMatch?.id) {
        try {
          await fetch(`/api/matches/${createdMatch.id}/table-tennis/config`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              setsToWin: parseInt(tableTennisSetsToWin),
              pointsToWinPerSet: parseInt(tableTennisPointsToWin),
              setTypes: tableTennisSetTypes, // Pre-configured set types
              configCompleted: false, // Will be completed when toss is done
            }),
          })
        } catch (error) {
          console.error("Error saving table-tennis config:", error)
          // Don't fail the match creation if config save fails
        }
      }
      
      toast({
        title: "Success",
        description: "Match created successfully!",
      })
      
      // Redirect to home page or sport page
      setTimeout(() => {
        router.push("/")
      }, 1000)
    } catch (error) {
      console.error("Error creating match:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to create match. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getSelectedTeam = (teamId: string) => {
    return allTeams.find(team => team.id === teamId)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    )
  }

  const selectedHomeTeam = getSelectedTeam(homeTeam)
  const selectedAwayTeam = getSelectedTeam(awayTeam)

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 animate-fade-in">
          Create {selectedSport ? sportNames[selectedSport] : ""} Match
          {tournamentName && (
            <span className="text-lg font-normal text-muted-foreground ml-2">for {tournamentName}</span>
          )}
        </h1>

        <Card className="max-w-3xl mx-auto animate-slide-in shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Match Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sport Selection */}
              <div className="space-y-2">
                <Label htmlFor="sport" className="text-base font-semibold">Sport *</Label>
                <Select value={selectedSport} onValueChange={setSelectedSport} required>
                  <SelectTrigger id="sport" className="h-12">
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(sportNames).map(([key, name]) => (
                      <SelectItem key={key} value={key}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSport && (
                  <p className="text-xs text-muted-foreground">
                    Only {sportNames[selectedSport]} teams will be shown below
                  </p>
                )}
              </div>

              {/* Cricket-specific configuration */}
              {selectedSport === "cricket" && (
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200 space-y-4">
                  <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                    🏏 Cricket Match Configuration
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="totalOvers" className="text-base font-semibold">Total Overs *</Label>
                      <Select value={cricketTotalOvers} onValueChange={setCricketTotalOvers} required>
                        <SelectTrigger id="totalOvers" className="h-12 bg-white">
                          <SelectValue placeholder="Select overs" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 Overs (Quick Match)</SelectItem>
                          <SelectItem value="10">10 Overs</SelectItem>
                          <SelectItem value="20">20 Overs (T20)</SelectItem>
                          <SelectItem value="50">50 Overs (ODI)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxOversPerBowler" className="text-base font-semibold">
                        Max Overs per Bowler *
                      </Label>
                      <Input
                        id="maxOversPerBowler"
                        type="number"
                        min="1"
                        max={Math.floor(parseInt(cricketTotalOvers) / 5)}
                        value={cricketMaxOversPerBowler}
                        onChange={(e) => setCricketMaxOversPerBowler(e.target.value)}
                        className="h-12 bg-white"
                        required
                      />
                      <p className="text-xs text-blue-700">
                        Recommended: {Math.floor(parseInt(cricketTotalOvers) * 0.2)} overs (20% of total)
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600">
                    Note: Toss will be conducted when the match starts for the first time.
                  </p>
                </div>
              )}

              {/* Volleyball-specific configuration */}
              {selectedSport === "volleyball" && (
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
              {selectedSport === "badminton" && (
                <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200 space-y-4">
                  <h3 className="font-semibold text-yellow-900 flex items-center gap-2">
                    🏸 Badminton Match Configuration
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gamesToWin" className="text-base font-semibold">Games Format *</Label>
                      <Select value={badmintonGamesToWin} onValueChange={(val) => setBadmintonGamesToWin(val as "2" | "3")} required>
                        <SelectTrigger id="gamesToWin" className="h-12 bg-white">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">Best of 3 Games (First to 2 wins)</SelectItem>
                          <SelectItem value="3">Best of 5 Games (First to 3 wins)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pointsToWin" className="text-base font-semibold">Points to Win per Game *</Label>
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
                    Standard: First to {badmintonPointsToWin} points, win by 2, maximum {badmintonPointsToWin === "11" ? "15" : badmintonPointsToWin === "15" ? "19" : "30"} points
                  </p>
                  <p className="text-xs text-yellow-600">
                    Note: Toss for serve/court side will be conducted when the match starts for the first time.
                  </p>
                  
                  {/* Game Type Selection for each game */}
                  {badmintonGameTypes.length > 0 && (
                    <div className="space-y-3 mt-4">
                      <Label className="text-base font-semibold">Game Types Configuration *</Label>
                      <div className="grid grid-cols-1 gap-3">
                        {badmintonGameTypes.map((gameType, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                            <span className="font-medium min-w-[70px]">Game {index + 1}:</span>
                            <Select
                              value={gameType}
                              onValueChange={(val) => {
                                const newTypes = [...badmintonGameTypes]
                                newTypes[index] = val as "singles" | "doubles"
                                setBadmintonGameTypes(newTypes)
                              }}
                            >
                              <SelectTrigger className="h-10 flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="singles">Singles</SelectItem>
                                <SelectItem value="doubles">Doubles</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-yellow-700">
                        Configure whether each game will be played as singles or doubles
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Table Tennis-specific configuration */}
              {selectedSport === "table-tennis" && (
                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200 space-y-4">
                  <h3 className="font-semibold text-green-900 flex items-center gap-2">
                    🏓 Table Tennis Match Configuration
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="setsToWin" className="text-base font-semibold">Sets Format *</Label>
                      <Select value={tableTennisSetsToWin} onValueChange={(val) => setTableTennisSetsToWin(val as "2" | "3" | "4")} required>
                        <SelectTrigger id="setsToWin" className="h-12 bg-white">
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
                      <Label htmlFor="pointsToWin" className="text-base font-semibold">Points to Win per Set *</Label>
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
                    Standard: First to {tableTennisPointsToWin} points per set, win by 2 points
                  </p>
                  <p className="text-xs text-green-600">
                    Note: Toss for serve/table side will be conducted when the match starts for the first time.
                  </p>
                  
                  {/* Set Type Selection for each set */}
                  {tableTennisSetTypes.length > 0 && (
                    <div className="space-y-3 mt-4">
                      <Label className="text-base font-semibold">Set Types Configuration *</Label>
                      <div className="grid grid-cols-1 gap-3">
                        {tableTennisSetTypes.map((setType, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                            <span className="font-medium min-w-[60px]">Set {index + 1}:</span>
                            <Select
                              value={setType}
                              onValueChange={(val) => {
                                const newTypes = [...tableTennisSetTypes]
                                newTypes[index] = val as "singles" | "doubles"
                                setTableTennisSetTypes(newTypes)
                              }}
                            >
                              <SelectTrigger className="h-10 flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="singles">Singles</SelectItem>
                                <SelectItem value="doubles">Doubles</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-green-700">
                        Configure whether each set will be played as singles or doubles
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="homeTeam" className="text-base font-semibold">Home Team *</Label>
                  <Select value={homeTeam} onValueChange={setHomeTeam} required>
                    <SelectTrigger id="homeTeam" className="h-12">
                      <SelectValue placeholder="Select home team">
                        {selectedHomeTeam && (
                          <div className="flex items-center gap-2">
                            {selectedHomeTeam.logo ? (
                              <div className="w-6 h-6 relative">
                                <Image
                                  src={selectedHomeTeam.logo}
                                  alt={selectedHomeTeam.name}
                                  fill
                                  className="object-contain"
                                  sizes="24px"
                                />
                              </div>
                            ) : (
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-600">
                                  {selectedHomeTeam.name.charAt(0)}
                                </span>
                              </div>
                            )}
                            <span>{selectedHomeTeam.name}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTeams.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          No teams available. Please create teams first.
                        </div>
                      ) : (
                        filteredTeams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              {team.logo ? (
                                <div className="w-6 h-6 relative">
                                  <Image
                                    src={team.logo}
                                    alt={team.name}
                                    fill
                                    className="object-contain"
                                    sizes="24px"
                                  />
                                </div>
                              ) : (
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-bold text-blue-600">
                                    {team.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <span>{team.name}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="awayTeam" className="text-base font-semibold">Away Team *</Label>
                  <Select value={awayTeam} onValueChange={setAwayTeam} required>
                    <SelectTrigger id="awayTeam" className="h-12">
                      <SelectValue placeholder="Select away team">
                        {selectedAwayTeam && (
                          <div className="flex items-center gap-2">
                            {selectedAwayTeam.logo ? (
                              <div className="w-6 h-6 relative">
                                <Image
                                  src={selectedAwayTeam.logo}
                                  alt={selectedAwayTeam.name}
                                  fill
                                  className="object-contain"
                                  sizes="24px"
                                />
                              </div>
                            ) : (
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-600">
                                  {selectedAwayTeam.name.charAt(0)}
                                </span>
                              </div>
                            )}
                            <span>{selectedAwayTeam.name}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTeams.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          No teams available. Please create teams first.
                        </div>
                      ) : (
                        filteredTeams
                          .filter(team => team.id !== homeTeam)
                          .map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              <div className="flex items-center gap-2">
                                {team.logo ? (
                                  <div className="w-6 h-6 relative">
                                    <Image
                                      src={team.logo}
                                      alt={team.name}
                                      fill
                                      className="object-contain"
                                      sizes="24px"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-blue-600">
                                      {team.name.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <span>{team.name}</span>
                              </div>
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue" className="text-base font-semibold">Venue *</Label>
                <Input
                  id="venue"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Enter match venue (e.g., National Stadium)"
                  required
                  className="h-12"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Match Date *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-14 hover:bg-accent hover:border-primary transition-all",
                          !date && "text-muted-foreground",
                        )}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <CalendarIcon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex flex-col items-start flex-1">
                            {date ? (
                              <>
                                <span className="text-xs text-muted-foreground font-normal">Selected Date</span>
                                <span className="font-semibold text-base">{format(date, "MMMM d, yyyy")}</span>
                              </>
                            ) : (
                              <span className="text-base">Pick a date</span>
                            )}
                          </div>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        className="rounded-lg border shadow-lg"
                      />
                    </PopoverContent>
                  </Popover>
                  {date && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2 p-2 bg-muted/50 rounded-md">
                      <Check className="h-4 w-4 text-green-600" />
                      {format(date, "EEEE, MMMM d, yyyy")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Match Time *
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="hour" className="text-xs text-muted-foreground">
                        Hour
                      </Label>
                      <Select value={hour} onValueChange={setHour}>
                        <SelectTrigger id="hour" className="h-14">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => {
                            const h = i + 1
                            return (
                              <SelectItem key={h} value={h.toString().padStart(2, "0")}>
                                {h.toString().padStart(2, "0")}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minute" className="text-xs text-muted-foreground">
                        Minute
                      </Label>
                      <Select value={minute} onValueChange={setMinute}>
                        <SelectTrigger id="minute" className="h-14">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["00", "15", "30", "45"].map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="period" className="text-xs text-muted-foreground">
                        Period
                      </Label>
                      <Select value={period} onValueChange={(val) => setPeriod(val as "AM" | "PM")}>
                        <SelectTrigger id="period" className="h-14">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <Clock className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Selected Time</p>
                      <p className="text-lg font-bold text-primary">
                        {hour}:{minute} {period}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {tournamentName && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-700">
                    This match is part of the <strong>{tournamentName}</strong> tournament. The result will be updated
                    in the tournament bracket.
                  </p>
                </div>
              )}

              {filteredTeams.length < 2 && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-700">
                    <strong>Note:</strong> You need at least 2 teams to create a match. Please create teams first.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                  disabled={submitting}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={!selectedSport || !venue || !date || !homeTeam || !awayTeam || submitting || filteredTeams.length < 2}
                  className="px-8"
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">Creating...</span>
                    </>
                  ) : (
                    "Create Match"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
