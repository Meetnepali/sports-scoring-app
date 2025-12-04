"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageTransition } from "@/components/page-transition"
import { getTeamById } from "@/lib/client-api"
import { CalendarIcon, Clock, MapPin, Trophy, Users } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import Image from "next/image"

export default function CreateTournamentMatchPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState("14:00")
  const [venue, setVenue] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [team1, setTeam1] = useState<any>(null)
  const [team2, setTeam2] = useState<any>(null)
  const [tournamentName, setTournamentName] = useState("")

  // In a real app, we would fetch the tournament data from the API
  useEffect(() => {
    // Simulate fetching tournament data
    const searchParams = new URLSearchParams(window.location.search)
    const team1Id = searchParams.get("team1")
    const team2Id = searchParams.get("team2")
    const tournamentNameParam = searchParams.get("tournament")

    if (team1Id) {
      const team = getTeamById(team1Id)
      setTeam1(team)
    }

    if (team2Id) {
      const team = getTeamById(team2Id)
      setTeam2(team)
    }

    if (tournamentNameParam) {
      setTournamentName(tournamentNameParam)
    }
  }, [])

  const createMatch = () => {
    if (!team1 || !team2 || !date || !venue) {
      alert("Please fill in all required fields")
      return
    }

    setIsCreating(true)

    // Combine date and time
    const matchDateTime = new Date(date)
    const [hours, minutes] = time.split(":").map(Number)
    matchDateTime.setHours(hours, minutes)

    // In a real app, this would save the match to a database
    const newMatch = {
      id: `match-${Date.now()}`,
      sport: team1.sport,
      homeTeam: team1,
      awayTeam: team2,
      date: matchDateTime.toISOString(),
      venue,
      status: "scheduled",
      tournamentId: params.id,
    }

    // Simulate API call
    setTimeout(() => {
      setIsCreating(false)
      router.push(`/tournaments/${params.id}`)
    }, 1500)
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Trophy className="h-5 w-5 text-primary mr-2" />
              Create Tournament Match
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tournamentName && (
              <div className="mb-6 p-3 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium">
                  Creating match for tournament: <span className="font-bold">{tournamentName}</span>
                </p>
              </div>
            )}

            <div className="space-y-6">
              {/* Teams */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Home Team</Label>
                  {team1 ? (
                    <div className="p-3 border rounded-md flex items-center">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                        {team1.logo ? (
                          <Image
                            src={team1.logo || "/placeholder.svg"}
                            alt={team1.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <Users className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <span className="font-medium">{team1.name}</span>
                    </div>
                  ) : (
                    <div className="p-3 border rounded-md bg-muted/50 text-muted-foreground">No team selected</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Away Team</Label>
                  {team2 ? (
                    <div className="p-3 border rounded-md flex items-center">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                        {team2.logo ? (
                          <Image
                            src={team2.logo || "/placeholder.svg"}
                            alt={team2.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <Users className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <span className="font-medium">{team2.name}</span>
                    </div>
                  ) : (
                    <div className="p-3 border rounded-md bg-muted/50 text-muted-foreground">No team selected</div>
                  )}
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Venue */}
              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Input
                    id="venue"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Enter match venue"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button
                  onClick={createMatch}
                  disabled={!team1 || !team2 || !date || !venue || isCreating}
                  className="relative"
                >
                  {isCreating ? (
                    <>
                      <span className="opacity-0">Create Match</span>
                      <span className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        >
                          <Trophy className="h-4 w-4" />
                        </motion.div>
                      </span>
                    </>
                  ) : (
                    "Create Match"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
