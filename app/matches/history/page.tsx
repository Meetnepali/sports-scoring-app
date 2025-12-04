import { getMatchesByStatus } from "@/lib/static-data"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin, Trophy, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MatchHistoryPage() {
  const completedMatches = getMatchesByStatus("completed")

  // Group matches by sport
  const matchesBySport = completedMatches.reduce(
    (acc, match) => {
      if (!acc[match.sport]) {
        acc[match.sport] = []
      }
      acc[match.sport].push(match)
      return acc
    },
    {} as Record<string, typeof completedMatches>,
  )

  const sportNames: Record<string, string> = {
    cricket: "Cricket",
    volleyball: "Volleyball",
    chess: "Chess",
    futsal: "Futsal",
    "table-tennis": "Table Tennis",
    badminton: "Badminton",
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const getMatchResult = (match: any) => {
    switch (match.sport) {
      case "cricket":
        if (!match.score) return "No result"
        const homeRuns = match.score.innings[0].runs
        const awayRuns = match.score.innings[1].runs
        const homeWickets = match.score.innings[0].wickets
        const awayWickets = match.score.innings[1].wickets

        if (homeRuns > awayRuns) {
          return `${match.homeTeam.name} won by ${homeRuns - awayRuns} runs`
        } else if (awayRuns > homeRuns) {
          return `${match.awayTeam.name} won by ${10 - awayWickets} wickets`
        } else {
          return "Match tied"
        }

      case "volleyball":
        if (!match.score) return "No result"
        const homeSets = match.score.sets.filter((set: any) => set.home > set.away).length
        const awaySets = match.score.sets.filter((set: any) => set.away > set.home).length

        if (homeSets > awaySets) {
          return `${match.homeTeam.name} won ${homeSets}-${awaySets}`
        } else {
          return `${match.awayTeam.name} won ${awaySets}-${homeSets}`
        }

      case "chess":
        if (!match.score) return "No result"
        const homePoints = match.score.teamScore.home
        const awayPoints = match.score.teamScore.away

        if (homePoints > awayPoints) {
          return `${match.homeTeam.name} won ${homePoints}-${awayPoints}`
        } else if (awayPoints > homePoints) {
          return `${match.awayTeam.name} won ${awayPoints}-${homePoints}`
        } else {
          return `Match drawn ${homePoints}-${awayPoints}`
        }

      case "futsal":
        if (!match.score) return "No result"
        const homeGoals = match.score.home
        const awayGoals = match.score.away

        if (homeGoals > awayGoals) {
          return `${match.homeTeam.name} won ${homeGoals}-${awayGoals}`
        } else if (awayGoals > homeGoals) {
          return `${match.awayTeam.name} won ${awayGoals}-${homeGoals}`
        } else {
          return `Match drawn ${homeGoals}-${awayGoals}`
        }

      case "table-tennis":
        if (!match.score) return "No result"
        const homeWins = match.score.sets.filter(
          (set: any) => set.home >= match.score.pointsToWin && set.home - set.away >= 2,
        ).length
        const awayWins = match.score.sets.filter(
          (set: any) => set.away >= match.score.pointsToWin && set.away - set.home >= 2,
        ).length

        if (homeWins > awayWins) {
          return `${match.homeTeam.name} won ${homeWins}-${awayWins}`
        } else {
          return `${match.awayTeam.name} won ${awayWins}-${homeWins}`
        }

      case "badminton":
        if (!match.score) return "No result"
        const homeGames = match.score.games.filter(
          (game: any) => game.home >= match.score.pointsToWin && game.home - game.away >= 2,
        ).length
        const awayGames = match.score.games.filter(
          (game: any) => game.away >= match.score.pointsToWin && game.away - game.home >= 2,
        ).length

        if (homeGames > awayGames) {
          return `${match.homeTeam.name} won ${homeGames}-${awayGames}`
        } else {
          return `${match.awayTeam.name} won ${awayGames}-${homeGames}`
        }

      default:
        return "No result"
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link href="/matches">
          <Button variant="outline" size="icon" className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Match History</h1>
      </div>

      {Object.keys(matchesBySport).length > 0 ? (
        Object.entries(matchesBySport).map(([sport, matches]) => (
          <div key={sport} className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
              {sportNames[sport] || sport} Matches
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          COMPLETED
                        </Badge>
                        <div className="text-sm text-gray-500 flex items-center">
                          <CalendarDays className="h-3 w-3 mr-1" />
                          {formatDate(match.date)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-4">
                        <h3 className="font-semibold text-lg mb-2">
                          {match.homeTeam.name} vs {match.awayTeam.name}
                        </h3>
                        <p className="text-sm text-gray-600">{getMatchResult(match)}</p>
                      </div>

                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{match.venue}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border">
          <p className="text-gray-500 mb-2">No completed matches yet.</p>
          <p className="text-sm text-gray-400">Completed matches will appear here.</p>
        </div>
      )}
    </div>
  )
}
