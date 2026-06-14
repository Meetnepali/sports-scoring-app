"use client"

import { useRouter } from "next/navigation"
import { Match } from "@/lib/static-data"
import { cn } from "@/lib/utils"
import { useMemo, useState, type MouseEvent } from "react"
import { useAuth } from "@/lib/auth-context"
import { Trash2, ArrowRight } from "lucide-react"
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

function formatMatchDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    weekday: "short",
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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

const sportLabels: Record<string, string> = {
  cricket: "Cricket",
  volleyball: "Volleyball",
  chess: "Chess",
  futsal: "Futsal",
  "table-tennis": "Table Tennis",
  badminton: "Badminton",
}

export function MatchListItem({
  match,
  status,
  starting,
  onStartMatch,
  onDelete,
}: MatchListItemProps) {
  const router = useRouter()
  const { isAdmin } = useAuth()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const formattedDate = useMemo(() => formatMatchDate(match.date), [match.date])
  const formattedTime = useMemo(() => formatMatchTime(match.date), [match.date])

  const sportLabel = sportLabels[match.sport] || match.sport
  const homeInitials = getInitials(match.homeTeam.name)
  const awayInitials = getInitials(match.awayTeam.name)

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
        "group rounded-2xl border bg-white p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer",
        status === "live"
          ? "border-red-200 shadow-sm"
          : "border-slate-200 shadow-sm hover:border-emerald-200"
      )}
      onClick={() => router.push(`/matches/${match.id}`)}
    >
      {/* Header: sport + status */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-slate-500 capitalize">
          {sportLabel}
        </span>
        {(status === "live" || match.status === "live") && (
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-500">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>
        )}
        {match.status === "started" && status !== "live" && (
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Started
          </span>
        )}
        {status === "completed" && (
          <span className="text-[11px] font-semibold text-slate-400">
            Completed
          </span>
        )}
        {status === "scheduled" && match.status !== "started" && (
          <span className="text-[11px] font-semibold text-emerald-500">
            Upcoming
          </span>
        )}
      </div>

      {/* Teams — stacked vertically */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-slate-600">
              {homeInitials}
            </span>
          </div>
          <span className="text-sm font-semibold text-slate-900 truncate">
            {match.homeTeam.name}
          </span>
        </div>
        <div className="pl-12">
          <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">
            vs
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-slate-600">
              {awayInitials}
            </span>
          </div>
          <span className="text-sm font-semibold text-slate-900 truncate">
            {match.awayTeam.name}
          </span>
        </div>
      </div>

      {/* Footer: date + actions */}
      <div
        className="flex items-center justify-between pt-3 border-t border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs text-slate-400">
          {formattedDate} · {formattedTime}
        </span>
        <div className="flex items-center gap-2">
          {status === "scheduled" && onStartMatch && isAdmin && (
            <button
              type="button"
              onClick={(event) => onStartMatch(match.id, event)}
              className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400"
              disabled={starting}
            >
              {starting ? "Starting…" : "Start"}
            </button>
          )}

          {isAdmin && onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="rounded-lg p-1.5 text-slate-300 transition hover:text-red-500 disabled:opacity-40"
              disabled={
                deleting ||
                match.status === "live" ||
                match.status === "started"
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          <span className="text-[11px] font-semibold text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1 cursor-pointer" onClick={() => router.push(`/matches/${match.id}`)}>
            View
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Match?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this match between{" "}
              <strong>{match.homeTeam.name}</strong> and{" "}
              <strong>{match.awayTeam.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 rounded-xl"
            >
              {deleting ? "Deleting..." : "Delete Match"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  )
}
