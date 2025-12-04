import Link from "next/link"
import { getMatchesBySport, getTeamsBySport } from "@/lib/client-api"
import { Button } from "@/components/ui/button"
import { CalendarClock, Zap, Plus } from "lucide-react"
import MatchCard from "@/components/match-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function SportPage({ params }: { params: { sport: string } }) {
  const { sport } = params
  const matches = await getMatchesBySport(sport)
  const teams = await getTeamsBySport(sport)

  const liveMatches = matches.filter((match: any) => match.status === "live")
  const scheduledMatches = matches.filter((match: any) => match.status === "scheduled")

  const sportNames: Record<string, string> = {
    cricket: "Cricket",
    volleyball: "Volleyball",
    chess: "Chess",
    futsal: "Futsal",
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{sportNames[sport] || sport}</h1>
        <div className="flex space-x-4">
          <Link href={`/sports/${sport}/teams`}>
            <Button variant="outline" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Manage Teams
            </Button>
          </Link>
          <Link href={`/sports/${sport}/create-match`}>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Match
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Live Matches
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Scheduled Matches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          {liveMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveMatches.map((match: any) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No live matches at the moment.</p>
              <Link href={`/sports/${sport}/create-match`} className="mt-4 inline-block">
                <Button>Create Match</Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="scheduled">
          {scheduledMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scheduledMatches.map((match: any) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No scheduled matches.</p>
              <Link href={`/sports/${sport}/create-match`} className="mt-4 inline-block">
                <Button>Create Match</Button>
              </Link>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
