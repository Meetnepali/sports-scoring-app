"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Match } from "@/lib/static-data"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, MapPin, Clock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface MatchCardProps {
  match: Match
}

export default function MatchCard({ match }: MatchCardProps) {
  const router = useRouter()
  const { isAdmin } = useAuth()
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }



  const getSportIcon = () => {
    switch (match.sport) {
      case "cricket":
        return "🏏"
      case "volleyball":
        return "🏐"
      case "chess":
        return "♟️"
      case "futsal":
        return "⚽"
      default:
        return "🏆"
    }
  }

  return (
    <Link href={`/matches/${match.id}`}>
      <Card className="h-full card-hover overflow-hidden animate-scale-in">
        <div className={`h-2 w-full ${match.status === "live" ? "bg-destructive" : "bg-primary"}`}></div>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-4">
            <Badge variant={match.status === "live" ? "destructive" : "outline"} className="uppercase">
              {match.status === "live" ? "LIVE" : "Scheduled"}
            </Badge>
            <div className="flex flex-col items-end">
              <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                <CalendarDays className="h-3 w-3" />
                {formatDate(match.date)}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(match.date)}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="text-center flex-1">
              <p className="font-semibold truncate">{match.homeTeam.name}</p>
            </div>

            <div className="px-4 py-2 font-bold flex items-center">
              <span className="mr-2">{getSportIcon()}</span>
              <span>vs</span>
            </div>

            <div className="text-center flex-1">
              <p className="font-semibold truncate">{match.awayTeam.name}</p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t pt-4 bg-muted/50">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="truncate">{match.venue}</span>
            </div>
            {isAdmin && (match.status === "live" || match.status === "started" || match.status === "completed") && (
              <Button
                size="sm"
                variant="default"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  router.push(`/matches/${match.id}`)
                }}
                className="ml-2"
              >
                {match.status === "live" ? "Open Score" : "View Score"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
