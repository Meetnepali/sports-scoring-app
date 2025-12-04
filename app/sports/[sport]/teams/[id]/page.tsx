"use client"
import { use, useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getTeamById } from "@/lib/client-api"
import { ArrowLeft, Users, Edit, User } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import Image from "next/image"
import { motion } from "framer-motion"
import { LoadingSpinner } from "@/components/loading-spinner"
import type { Team } from "@/lib/static-data"

export default function TeamDetailPage({ params }: { params: Promise<{ sport: string; id: string }> }) {
  const { sport, id } = use(params)
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTeam() {
      try {
        const data = await getTeamById(id)
        setTeam(data)
      } catch (error) {
        console.error("Error fetching team:", error)
        setTeam(null)
      } finally {
        setLoading(false)
      }
    }
    fetchTeam()
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 bg-muted rounded-lg">
          <p className="text-muted-foreground mb-4">Team not found.</p>
          <Link href="/teams">
            <Button>Back to Teams</Button>
          </Link>
        </div>
      </div>
    )
  }

  const sportNames: Record<string, string> = {
    cricket: "Cricket",
    volleyball: "Volleyball",
    chess: "Chess",
    futsal: "Futsal",
    "table-tennis": "Table Tennis",
    badminton: "Badminton",
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/teams">
              <Button variant="outline" size="icon" className="mr-4">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{team.name}</h1>
              <div className="text-muted-foreground">{sportNames[team.sport] || team.sport}</div>
            </div>
          </div>
          <Link href={`/teams/${team.id}/edit`}>
            <Button variant="outline" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Team
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 text-primary mr-2" />
                Team Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-4 relative">
                  {team.logo ? (
                    <Image
                      src={team.logo || "/placeholder.svg"}
                      alt={team.name}
                      fill
                      className="object-contain rounded-full"
                      sizes="128px"
                    />
                  ) : (
                    <Users className="h-16 w-16 text-primary" />
                  )}
                </div>
                <h2 className="text-xl font-bold">{team.name}</h2>
                <Badge className="mt-2">{sportNames[team.sport] || team.sport}</Badge>
                <div className="mt-4 text-center">
                  <div className="text-sm text-muted-foreground">
                    {team.players.length} {team.players.length === 1 ? "Player" : "Players"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 text-primary mr-2" />
                Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {team.players.map((player: any, index: number) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{player.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {player.number && <span>#{player.number} </span>}
                          {player.position && <span>{player.position}</span>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}
