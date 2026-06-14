"use client"

import { useEffect, useState, useRef } from "react"
import { use } from "react"
import { getMatchById, deleteMatch } from "@/lib/client-api"
import { notFound, useRouter } from "next/navigation"
import CricketScoreboard from "@/components/scoreboards/cricket-scoreboard-enhanced"
import VolleyballScoreboard from "@/components/scoreboards/volleyball-scoreboard"
import ChessScoreboard from "@/components/scoreboards/chess-scoreboard"
import FutsalScoreboard from "@/components/scoreboards/futsal-scoreboard"
import TableTennisScoreboard from "@/components/scoreboards/table-tennis-scoreboard"
import BadmintonScoreboard from "@/components/scoreboards/badminton-scoreboard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, MapPin, Trash2, ChevronRight, ArrowLeft, Target, Volleyball, Swords, CircleDot, Activity, Dumbbell, Trophy } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { motion } from "framer-motion"
import type { Match } from "@/lib/static-data"
import { LoadingSpinner } from "@/components/loading-spinner"
import { MatchWinnerDialog } from "@/components/match-winner-dialog"
import { ScoreboardWrapper } from "@/components/scoreboard-wrapper"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import type { LucideIcon } from "lucide-react"

const sportConfig: Record<string, { Icon: LucideIcon; gradient: string; label: string }> = {
  cricket: { Icon: Target, gradient: "from-slate-800 to-slate-900", label: "Cricket" },
  volleyball: { Icon: Volleyball, gradient: "from-slate-800 to-slate-900", label: "Volleyball" },
  chess: { Icon: Swords, gradient: "from-slate-800 to-slate-900", label: "Chess" },
  futsal: { Icon: CircleDot, gradient: "from-slate-800 to-slate-900", label: "Futsal" },
  "table-tennis": { Icon: Activity, gradient: "from-slate-800 to-slate-900", label: "Table Tennis" },
  badminton: { Icon: Dumbbell, gradient: "from-slate-800 to-slate-900", label: "Badminton" },
}

export default function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [showWinnerDialog, setShowWinnerDialog] = useState(false)
  const [hasSeenWinnerDialog, setHasSeenWinnerDialog] = useState(false)
  const [currentVersion, setCurrentVersion] = useState<number>(0)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const hasSeenWinnerDialogRef = useRef(false)

  const fetchMatch = async () => {
    try {
      const data = await getMatchById(id)
      setMatch(data)
      if (data && (data as any).version !== undefined) {
        setCurrentVersion((data as any).version)
      }

      if (data && data.status === "completed" && !hasSeenWinnerDialogRef.current) {
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

  // SSE for real-time score updates
  useEffect(() => {
    if (!match?.id || loading) return

    let eventSource: EventSource | null = null
    let reconnectAttempts = 0
    const maxReconnectAttempts = 3

    const setupEventSource = () => {
      try {
        eventSource = new EventSource(`/api/stream/match/${match.id}`)

        eventSource.onmessage = (event) => {
          try {
            const updateData = JSON.parse(event.data)
            const { matchId, score, status, version, updatedAt } = updateData

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
          console.warn("EventSource connection error, will retry if needed")
          if (eventSource) {
            eventSource.close()
          }

          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++
            setTimeout(() => {
              if (!loading) setupEventSource()
            }, 1000 * reconnectAttempts)
          }
        }

        eventSource.onopen = () => {
          reconnectAttempts = 0
        }
      } catch (error) {
        console.error("Error setting up EventSource:", error)
      }
    }

    setupEventSource()

    return () => {
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
    }
  }, [id, match?.id])

  const handleCloseWinnerDialog = () => {
    setShowWinnerDialog(false)
    setHasSeenWinnerDialog(true)
    hasSeenWinnerDialogRef.current = true
    sessionStorage.setItem(`match_winner_seen_${id}`, "true")
  }

  const handleDeleteMatch = async () => {
    try {
      setDeleting(true)
      await deleteMatch(id)

      toast({
        title: "Match Deleted",
        description: "The match has been permanently deleted.",
      })

      router.push("/matches")
    } catch (error) {
      console.error('Error deleting match:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to delete match"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      setDeleting(false)
    }
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

  const sport = sportConfig[match.sport] || { Icon: Trophy, gradient: "from-slate-800 to-slate-900", label: match.sport }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm text-slate-500 mb-6"
        >
          <Link href="/matches" className="hover:text-slate-700 transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Matches
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-400">{sport.label}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-900 font-medium">{match.homeTeam.name} vs {match.awayTeam.name}</span>
        </motion.div>

        {/* Match Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`relative overflow-hidden rounded-2xl shadow-lg mb-8`}
        >
          {/* Gradient background */}
          <div className={`absolute inset-0 bg-gradient-to-r ${sport.gradient} opacity-[0.07]`} />
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm" />

          <div className="relative p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Teams */}
              <div className="flex items-center gap-6 lg:gap-10">
                {/* Home Team */}
                <div className="text-center flex-1 lg:flex-initial">
                  <div className={`h-16 w-16 lg:h-20 lg:w-20 rounded-2xl bg-gradient-to-br ${sport.gradient} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                    <span className="text-2xl lg:text-3xl font-bold text-white">
                      {match.homeTeam.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm lg:text-base">{match.homeTeam.name}</h3>
                </div>

                {/* VS / Score */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center">
                      <sport.Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  {/* Status Badge */}
                  {match.status === "live" ? (
                    <Badge className="bg-red-500 text-white border-0 animate-pulse">
                      <span className="mr-1 h-1.5 w-1.5 rounded-full bg-white inline-block" />
                      LIVE
                    </Badge>
                  ) : match.status === "completed" ? (
                    <Badge className="bg-green-100 text-green-700 border-0">
                      COMPLETED
                    </Badge>
                  ) : match.status === "started" ? (
                    <Badge className="bg-amber-100 text-amber-700 border-0">
                      STARTED
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      {match.status.toUpperCase()}
                    </Badge>
                  )}
                </div>

                {/* Away Team */}
                <div className="text-center flex-1 lg:flex-initial">
                  <div className={`h-16 w-16 lg:h-20 lg:w-20 rounded-2xl bg-gradient-to-br ${sport.gradient} flex items-center justify-center mx-auto mb-3 shadow-lg opacity-80`}>
                    <span className="text-2xl lg:text-3xl font-bold text-white">
                      {match.awayTeam.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm lg:text-base">{match.awayTeam.name}</h3>
                </div>
              </div>

              {/* Match Info */}
              <div className="flex flex-col gap-2 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>{formatDate(match.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{match.venue}</span>
                </div>

                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={deleting || match.status === "live" || match.status === "started"}
                    className="mt-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 rounded-xl"
                    title={match.status === "live" || match.status === "started" ? "Cannot delete live or started matches" : "Delete match"}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Match
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Scoreboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ScoreboardWrapper match={match}>
            {renderScoreboard()}
          </ScoreboardWrapper>
        </motion.div>
      </div>

      {/* Winner Dialog */}
      {match.status === "completed" && (
        <MatchWinnerDialog
          match={match}
          open={showWinnerDialog}
          onClose={handleCloseWinnerDialog}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Match?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this match between <strong>{match.homeTeam.name}</strong> and <strong>{match.awayTeam.name}</strong>?
              <br /><br />
              This action cannot be undone. All match data including scores, statistics, and related records will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMatch}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 rounded-xl"
            >
              {deleting ? "Deleting..." : "Delete Match"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  )
}
