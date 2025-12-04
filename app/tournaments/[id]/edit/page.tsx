"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getTeamsBySport } from "@/lib/client-api"
import TournamentBracket from "@/components/tournament-bracket"
import { Trophy, ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

// In a real app, this would come from a database
const tournaments = [
  {
    id: "t1",
    name: "Summer Cricket Championship",
    sport: "cricket",
    format: "single-elimination",
    bracketType: "single",
    teams: ["cri-team-1", "cri-team-2"],
    status: "ongoing",
    startDate: "2025-06-15",
    matches: [
      {
        id: "match-1",
        round: 1,
        position: 1,
        team1: "cri-team-1",
        team2: "cri-team-2",
        winner: undefined,
        nextMatchId: undefined,
        score1: 186,
        score2: 142,
      },
    ],
    teamLogos: {
      "cri-team-1": "/placeholder.svg?height=100&width=100",
      "cri-team-2": "/placeholder.svg?height=100&width=100",
    },
  },
  {
    id: "t2",
    name: "Volleyball League",
    sport: "volleyball",
    format: "round-robin",
    bracketType: "single",
    teams: ["vol-team-1", "vol-team-2"],
    status: "upcoming",
    startDate: "2025-07-10",
    matches: [
      {
        id: "match-1",
        round: 1,
        position: 1,
        team1: "vol-team-1",
        team2: "vol-team-2",
        winner: undefined,
        nextMatchId: undefined,
      },
    ],
    teamLogos: {},
  },
  {
    id: "t3",
    name: "Chess Masters Tournament",
    sport: "chess",
    format: "single-elimination",
    bracketType: "single",
    teams: ["chess-team-1", "chess-team-2"],
    status: "completed",
    startDate: "2025-05-01",
    matches: [
      {
        id: "match-1",
        round: 1,
        position: 1,
        team1: "chess-team-1",
        team2: "chess-team-2",
        winner: "chess-team-1",
        nextMatchId: undefined,
        score1: 2,
        score2: 1,
      },
    ],
    teamLogos: {},
  },
]

export default function EditTournamentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [tournament, setTournament] = useState<any>(null)
  const [name, setName] = useState("")
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app, this would fetch from an API
    const foundTournament = tournaments.find((t) => t.id === params.id)
    if (foundTournament) {
      setTournament(foundTournament)
      setName(foundTournament.name)
      setMatches(foundTournament.matches || [])
    }
    setLoading(false)
  }, [params.id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading tournament...</p>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">Tournament not found.</p>
          <Link href="/tournaments">
            <Button>Back to Tournaments</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Get teams with logos
  const getTeamsWithLogos = () => {
    const teams = getTeamsBySport(tournament.sport)
    return teams.map((team) => ({
      ...team,
      logo: tournament.teamLogos?.[team.id],
    }))
  }

  // Update a match
  const updateMatch = (updatedMatch: any) => {
    setMatches(
      matches.map((match) => {
        if (match.id === updatedMatch.id) {
          // Update this match
          return updatedMatch
        }

        // If this match feeds into another match, update the next match's team
        if (match.id === updatedMatch.nextMatchId) {
          const isTeam1 = updatedMatch.position % 2 === 1
          return {
            ...match,
            [isTeam1 ? "team1" : "team2"]: updatedMatch.winner,
          }
        }

        return match
      }),
    )
  }

  // Save tournament changes
  const saveTournament = () => {
    // In a real app, this would save to a database
    alert("Tournament updated successfully!")
    router.push(`/tournaments/${tournament.id}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href={`/tournaments/${tournament.id}`}>
          <Button variant="outline" size="icon" className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Tournament</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Tournament Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Tournament Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="flex justify-end">
              <Button onClick={saveTournament} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
            Tournament Bracket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TournamentBracket
            matches={matches}
            teams={getTeamsWithLogos()}
            sport={tournament.sport}
            name={name}
            onUpdateMatch={updateMatch}
            editable={true}
            bracketType={tournament.bracketType as "single" | "double" | "consolation"}
          />
        </CardContent>
      </Card>
    </div>
  )
}
