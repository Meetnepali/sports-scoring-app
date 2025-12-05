"use client"

import { useEffect, useState, useRef } from "react"
import { use } from "react"
import { getMatchById } from "@/lib/client-api"
import { notFound } from "next/navigation"
import CricketScoreboard from "@/components/scoreboards/cricket-scoreboard-enhanced"
import VolleyballScoreboard from "@/components/scoreboards/volleyball-scoreboard"
import ChessScoreboard from "@/components/scoreboards/chess-scoreboard"
import FutsalScoreboard from "@/components/scoreboards/futsal-scoreboard"
import TableTennisScoreboard from "@/components/scoreboards/table-tennis-scoreboard"
import BadmintonScoreboard from "@/components/scoreboards/badminton-scoreboard"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { motion } from "framer-motion"
import type { Match } from "@/lib/static-data"
import { LoadingSpinner } from "@/components/loading-spinner"
import { MatchWinnerDialog } from "@/components/match-winner-dialog"

export default function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [showWinnerDialog, setShowWinnerDialog] = useState(false)
  const [hasSeenWinnerDialog, setHasSeenWinnerDialog] = useState(false)
  const [currentVersion, setCurrentVersion] = useState<number>(0)
  const hasSeenWinnerDialogRef = useRef(false)

  const fetchMatch = async () => {
    try {
      const data = await getMatchById(id)
      setMatch(data)
      // Track version from initial fetch
      if (data && (data as any).version !== undefined) {
        setCurrentVersion((data as any).version)
      }
      
      // Show winner dialog if match is completed and user hasn't seen it yet
      if (data && data.status === "completed" && !hasSeenWinnerDialogRef.current) {
        // Check if there's a stored flag in sessionStorage
        const seenKey = `match_winner_seen_${id}`
        const hasSeen = sessionStorage.getItem(seenKey)
        if (!hasSeen) {
          setShowWinnerDialog(true)
        } else {
          hasSeenWinnerDialogRef.current = true
        }
      }
    } catch (error) {
      console.error("Error fetching match:", error)
      setMatch(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatch()
  }, [id])

  // Set up EventSource for real-time score updates
  useEffect(() => {
    if (!match || loading) return

    const eventSource = new EventSource(`/api/stream/match/${id}`)

    eventSource.onmessage = (event) => {
      try {
        const updateData = JSON.parse(event.data)
        const { matchId, score, status, version, updatedAt } = updateData

        // Only update if version is newer
        setCurrentVersion((prevVersion) => {
          if (version > prevVersion) {
            // Update match state with new data
            setMatch((prevMatch) => {
              if (!prevMatch) return prevMatch
              
              const wasCompleted = prevMatch.status === "completed"
              
              return {
                ...prevMatch,
                score: score,
                status: status as "scheduled" | "started" | "live" | "completed",
              }
            })

            // Show winner dialog if match just completed
            if (status === "completed" && !hasSeenWinnerDialogRef.current) {
              const seenKey = `match_winner_seen_${id}`
              const hasSeen = sessionStorage.getItem(seenKey)
              if (!hasSeen) {
                setShowWinnerDialog(true)
              }
            }

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
      // EventSource will automatically attempt to reconnect
    }

    // Cleanup on unmount
    return () => {
      eventSource.close()
    }
  }, [id, match?.id, loading])

  // Handle closing winner dialog
  const handleCloseWinnerDialog = () => {
    setShowWinnerDialog(false)
    setHasSeenWinnerDialog(true)
    hasSeenWinnerDialogRef.current = true
    // Store in sessionStorage so it doesn't show again during this session
    sessionStorage.setItem(`match_winner_seen_${id}`, "true")
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!match) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderScoreboard = () => {
    switch (match.sport) {
      case "cricket":
        return <CricketScoreboard match={match} />
      case "volleyball":
        return <VolleyballScoreboard match={match} />
      case "chess":
        return <ChessScoreboard match={match} />
      case "futsal":
        return <FutsalScoreboard match={match} />
      case "table-tennis":
        return <TableTennisScoreboard match={match} />
      case "badminton":
        return <BadmintonScoreboard match={match} />
      default:
        return <div>Scoreboard not available</div>
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
      case "table-tennis":
        return "🏓"
      case "badminton":
        return "🏸"
      default:
        return "🏆"
    }
  }

  const getStatusBadgeVariant = () => {
    switch (match.status) {
      case "live":
        return "destructive"
      case "completed":
        return "default"
      default:
        return "outline"
    }
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-card text-card-foreground rounded-lg shadow-md p-6 mb-8 animate-fade-in"
        >
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3">{getSportIcon()}</span>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {match.homeTeam.name} vs {match.awayTeam.name}
                <Badge variant={getStatusBadgeVariant()} className="text-sm ml-2">
                  {match.status === "live" ? "LIVE" : match.status.toUpperCase()}
                </Badge>
              </h1>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center">
              <CalendarDays className="h-4 w-4 mr-2" />
              {formatDate(match.date)}
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              {match.venue}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="animate-slide-in"
        >
          {renderScoreboard()}
        </motion.div>
      </div>

      {/* Winner announcement dialog for completed matches */}
      {match.status === "completed" && (
        <MatchWinnerDialog
          match={match}
          open={showWinnerDialog}
          onClose={handleCloseWinnerDialog}
        />
      )}
    </PageTransition>
  )
}
