import Link from "next/link"
import { getTeamsBySport } from "@/lib/client-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Users } from "lucide-react"

export default async function TeamsPage({ params }: { params: { sport: string } }) {
  const { sport } = params
  const teams = await getTeamsBySport(sport)

  const sportNames: Record<string, string> = {
    cricket: "Cricket",
    volleyball: "Volleyball",
    chess: "Chess",
    futsal: "Futsal",
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{sportNames[sport] || sport} Teams</h1>
        <Link href={`/sports/${sport}/teams/create`}>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Team
          </Button>
        </Link>
      </div>

      {teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Link key={team.id} href={`/sports/${sport}/teams/${team.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                  <CardTitle>{team.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Users className="h-4 w-4 mr-2" />
                    {team.players.length} Players
                  </div>

                  <div className="space-y-1">
                    {team.players.slice(0, 3).map((player: any) => (
                      <div key={player.id} className="text-sm">
                        {player.name}
                        {player.number && <span className="text-gray-500 ml-2">#{player.number}</span>}
                      </div>
                    ))}
                    {team.players.length > 3 && (
                      <div className="text-sm text-gray-500">+{team.players.length - 3} more players</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No teams found for {sportNames[sport]}.</p>
          <Link href={`/sports/${sport}/teams/create`}>
            <Button>Create First Team</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
