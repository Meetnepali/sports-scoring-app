"use client"

import type React from "react"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { getTeamsBySport } from "@/lib/client-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import type { Team } from "@/lib/static-data"

export default function CreateMatchPage({ params }: { params: Promise<{ sport: string }> }) {
  const { sport } = use(params)
  const router = useRouter()
  
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [homeTeam, setHomeTeam] = useState("")
  const [awayTeam, setAwayTeam] = useState("")
  const [venue, setVenue] = useState("")
  const [matchDateTime, setMatchDateTime] = useState("")

  useEffect(() => {
    async function fetchTeams() {
      try {
        const data = await getTeamsBySport(sport)
        setTeams(data)
      } catch (error) {
        console.error("Error fetching teams:", error)
        setTeams([])
      } finally {
        setLoading(false)
      }
    }
    fetchTeams()
  }, [sport])

  const sportNames: Record<string, string> = {
    cricket: "Cricket",
    volleyball: "Volleyball",
    chess: "Chess",
    futsal: "Futsal",
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // In a real app, this would create a new match in the database
    // For now, we'll just navigate back to the sport page
    router.push(`/sports/${sport}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create {sportNames[sport] || sport} Match</h1>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Match Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="homeTeam">Home Team</Label>
                <Select value={homeTeam} onValueChange={setHomeTeam} required>
                  <SelectTrigger id="homeTeam">
                    <SelectValue placeholder="Select home team" />
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
                <Label htmlFor="awayTeam">Away Team</Label>
                <Select value={awayTeam} onValueChange={setAwayTeam} required>
                  <SelectTrigger id="awayTeam">
                    <SelectValue placeholder="Select away team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id} disabled={team.id === homeTeam}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Enter match venue"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="matchDateTime" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Match Date & Time
              </Label>
              <Input
                id="matchDateTime"
                type="datetime-local"
                value={matchDateTime}
                onChange={(e) => setMatchDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={!homeTeam || !awayTeam || !venue || !matchDateTime}>
                Create Match
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
