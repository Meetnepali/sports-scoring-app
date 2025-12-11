"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { Match } from "@/lib/static-data"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin, Clock } from "lucide-react"

interface MatchCardProps {
  match: Match
}

export default function MatchCard({ match: initialMatch }: MatchCardProps) {
  const [match, setMatch] = useState<Match>(initialMatch)
  const [currentVersion, setCurrentVersion] = useState<number>(0)

  // Set up EventSource for real-time score updates (only for live matches)
  useEffect(() => {
    if (!match || match.status !== "live") return

    const eventSource = new EventSource(`/api/stream/match/${match.id}`)

    eventSource.onmessage = (event) => {
      try {
        const updateData = JSON.parse(event.data)
        const { matchId, score, status, version } = updateData

        // Only update if version is newer
        setCurrentVersion((prevVersion) => {
          if (version > prevVersion) {
            setMatch((prevMatch) => {
              if (!prevMatch) return prevMatch
              return {
                ...prevMatch,
                score: score,
                status: status as "scheduled" | "started" | "live" | "completed",
              }
            })
            return version
          }
          return prevVersion
        })
      } catch (error) {
        console.error("Error parsing SSE message:", error)
      }
    }

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error)
    }

    return () => {
      eventSource.close()
    }
  }, [match?.id, match?.status])

  // Update match if initialMatch changes
  useEffect(() => {
    setMatch(initialMatch)
  }, [initialMatch.id, initialMatch.status])
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

  const getScoreDisplay = (match: Match) => {
    if (!match.score) return "vs"
    
    switch (match.sport) {
      case "cricket":
        if (!match.score.innings?.[0] || !match.score.innings?.[1]) return "vs"
        return `${match.score.innings[0].runs}/${match.score.innings[0].wickets} vs ${match.score.innings[1].runs}/${match.score.innings[1].wickets}`

      case "volleyball":
        if (!match.score.sets) return "vs"
        const homeSets = match.score.sets.filter((set: any) => set.home > set.away).length
        const awaySets = match.score.sets.filter((set: any) => set.away > set.home).length
        return `${homeSets} - ${awaySets}`

      case "chess":
        if (!match.score.teamScore) return "vs"
        return `${match.score.teamScore.home} - ${match.score.teamScore.away}`

      case "futsal":
        if (match.score.home === undefined || match.score.away === undefined) return "vs"
        return `${match.score.home} - ${match.score.away}`

      default:
        return "vs"
    }
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
    <Link href={`/matches/${initialMatch.id || match.id}`}>
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
              <span>{getScoreDisplay(match)}</span>
            </div>

            <div className="text-center flex-1">
              <p className="font-semibold truncate">{match.awayTeam.name}</p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t pt-4 bg-muted/50">
          <div className="flex items-center text-sm text-muted-foreground w-full">
            <MapPin className="h-3 w-3 mr-1" />
            <span className="truncate">{match.venue}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
