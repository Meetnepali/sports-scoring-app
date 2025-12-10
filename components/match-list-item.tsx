"use client"

import Image from "next/image"
import Link from "next/link"
import { Match } from "@/lib/static-data"
import { cn } from "@/lib/utils"
import { useMemo, useState, type MouseEvent } from "react"
import { useAuth } from "@/lib/auth-context"
import { Trash2 } from "lucide-react"
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

type ExtendedMatch = Match & {
  tournamentLogo?: string | null
  tournamentName?: string | null
  tournament?: {
    logo?: string | null
    name?: string | null
  } | null
}

interface MatchListItemProps {
  match: ExtendedMatch
  status: "scheduled" | "live" | "completed"
  starting?: boolean
  onStartMatch?: (matchId: string, event: MouseEvent<HTMLButtonElement>) => void
  onDelete?: (matchId: string) => Promise<void>
}

const placeholderLogo = "/placeholder-logo.png"

const sportBadges: Record<string, string> = {
  cricket: "/leagues/cricket-badge.svg",
  volleyball: "/leagues/volleyball-badge.svg",
  futsal: "/leagues/futsal-badge.svg",
  chess: "/leagues/chess-badge.svg",
  "table-tennis": "/leagues/table-tennis-badge.svg",
  badminton: "/leagues/badminton-badge.svg",
}

const statusCopy: Record<MatchListItemProps["status"], string> = {
  scheduled: "Scheduled",
  live: "Live",
  completed: "Completed",
}

function formatMatchDate(dateString: string) {
  const date = new Date(dateString)

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
  })
}

function formatMatchTime(dateString: string) {
  const date = new Date(dateString)

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getTeamLogo(logo?: string | null) {
  if (!logo || logo.trim() === "") {
    return placeholderLogo
  }

  return logo
}

function getTournamentBadge(match: ExtendedMatch) {
  if (match.tournamentLogo) return match.tournamentLogo
  if (match.tournament?.logo) return match.tournament.logo

  const badgeFromSport = sportBadges[match.sport]
  if (badgeFromSport) return badgeFromSport

  return placeholderLogo
}

function getLiveScore(match: Match): { home: string | number; away: string | number } | null {
  if (!match.score || match.status === "scheduled") return null

  try {
    switch (match.sport) {
      case "cricket": {
        const innings = match.score?.innings
        if (!innings || !Array.isArray(innings)) return null
        
        const currentInnings = match.score?.currentInnings || 0
        if (currentInnings === 0 && innings[0]) {
          return { home: `${innings[0].runs}/${innings[0].wickets}`, away: "-" }
        } else if (currentInnings === 1 && innings[1]) {
          return { 
            home: `${innings[0]?.runs}/${innings[0]?.wickets}`, 
            away: `${innings[1].runs}/${innings[1].wickets}` 
          }
        }
        return null
      }

      case "volleyball": {
        const sets = match.score?.sets
        if (!sets || !Array.isArray(sets)) return null
        
        let homeSets = 0
        let awaySets = 0
        sets.forEach((set: any) => {
          if (set.home > set.away) homeSets++
          else if (set.away > set.home) awaySets++
        })
        
        return { home: homeSets, away: awaySets }
      }

      case "futsal": {
        return { 
          home: match.score?.home || 0, 
          away: match.score?.away || 0 
        }
      }

      case "table-tennis":
      case "badminton": {
        // Check for new team match structure
        if (match.score?.matches && Array.isArray(match.score.matches)) {
          const matchWins = match.score.matchWins || { home: 0, away: 0 }
          return { home: matchWins.home, away: matchWins.away }
        }
        
        // Fallback to old structure
        const items = match.score?.sets || match.score?.games
        if (!items || !Array.isArray(items)) return null
        
        let homeWins = 0
        let awayWins = 0
        items.forEach((item: any) => {
          if (item.home > item.away) homeWins++
          else if (item.away > item.home) awayWins++
        })
        
        return { home: homeWins, away: awayWins }
      }

      case "chess": {
        const teamScore = match.score?.teamScore
        if (!teamScore) return null
        return { home: teamScore.home || 0, away: teamScore.away || 0 }
      }

      default:
        return null
    }
  } catch (error) {
    console.error("Error getting live score:", error)
    return null
  }
}

export function MatchListItem({ match, status, starting, onStartMatch, onDelete }: MatchListItemProps) {
  const { isAdmin } = useAuth()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const formattedDate = useMemo(() => formatMatchDate(match.date), [match.date])
  const formattedTime = useMemo(() => formatMatchTime(match.date), [match.date])

  const homeLogo = getTeamLogo(match.homeTeam.logo)
  const awayLogo = getTeamLogo(match.awayTeam.logo)
  const tournamentBadge = getTournamentBadge(match)
  const tournamentName = match.tournamentName || match.tournament?.name || match.sport

  const statusLabel = statusCopy[status]

  const handleDeleteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!onDelete) return
    
    try {
      setDeleting(true)
      await onDelete(match.id)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error("Error deleting match:", error)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <article
      className={cn(
        "group rounded-[1.8rem] border border-slate-200/80 bg-white/95 px-6 py-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-slate-300/80 min-h-[120px]",
        status === "live" && "ring-1 ring-red-200/60",
        status === "completed" && "opacity-95",
      )}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
        <div className="flex items-center gap-4 md:min-w-[180px]">
          <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50">
            <Image
              src={tournamentBadge}
              alt={`${tournamentName} badge`}
              fill
              className="object-cover"
              sizes="56px"
              priority={status === "live"}
            />
          </div>
          <div className="h-10 w-px bg-slate-200 mx-2" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">{formattedDate}</span>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{formattedTime}</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 text-slate-900 lg:flex-row lg:items-center lg:gap-6">
          <TeamDisplay teamName={match.homeTeam.name} logo={homeLogo} />
          <div className="flex items-center justify-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 lg:w-16">
            vs
          </div>
          <TeamDisplay teamName={match.awayTeam.name} logo={awayLogo} position="end" />
        </div>

        <div className="flex items-center justify-between gap-3 md:w-auto md:justify-end">
          {(status === "live" || match.status === "live") && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-red-600">
                <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_0_4px_rgba(248,113,113,0.25)]" />
                Live
              </span>
              {(() => {
                const liveScore = getLiveScore(match)
                if (liveScore) {
                  return (
                    <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                      <span>{liveScore.home}</span>
                      <span className="text-slate-400">-</span>
                      <span>{liveScore.away}</span>
                    </span>
                  )
                }
                return null
              })()}
            </div>
          )}
          {match.status === "started" && (
            <span className="flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-yellow-600">
              <span className="h-2 w-2 rounded-full bg-yellow-500 shadow-[0_0_0_4px_rgba(251,191,36,0.25)]" />
              Started
            </span>
          )}
          {status === "completed" && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Final
            </span>
          )}
          {status === "scheduled" && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Upcoming
            </span>
          )}

          <div className="flex items-center gap-3">
            {status === "scheduled" && onStartMatch && isAdmin && (
              <button
                type="button"
                onClick={(event) => onStartMatch(match.id, event)}
                className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={starting}
              >
                {starting ? "Starting…" : "Start Match"}
              </button>
            )}

            {isAdmin && onDelete && (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="rounded-full border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100 hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={deleting || match.status === "live" || match.status === "started"}
                title={match.status === "live" || match.status === "started" ? "Cannot delete live or started matches" : "Delete match"}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            <Link
              href={`/matches/${match.id}`}
              className="rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-800 transition group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white"
            >
              {status === "completed" ? "View Score" : status === "live" ? "Open Score" : "View Score"}
            </Link>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Match?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this match between <strong>{match.homeTeam.name}</strong> and <strong>{match.awayTeam.name}</strong>?
              <br /><br />
              This action cannot be undone. All match data including scores, statistics, and related records will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete Match"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  )
}

interface TeamDisplayProps {
  teamName: string
  logo: string
  position?: "start" | "end"
}

function TeamDisplay({ teamName, logo, position = "start" }: TeamDisplayProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        position === "end" && "lg:flex-row-reverse lg:text-right",
      )}
    >
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
        <Image src={logo} alt={`${teamName} logo`} fill className="object-cover" sizes="48px" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-900">{teamName}</span>
      </div>
    </div>
  )
}

