"use client"

import Image from "next/image"
import Link from "next/link"
import { Match } from "@/lib/static-data"
import { cn } from "@/lib/utils"
import { useMemo, type MouseEvent } from "react"
import { useAuth } from "@/lib/auth-context"

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

export function MatchListItem({ match, status, starting, onStartMatch }: MatchListItemProps) {
  const { isAdmin } = useAuth()
  const formattedDate = useMemo(() => formatMatchDate(match.date), [match.date])
  const formattedTime = useMemo(() => formatMatchTime(match.date), [match.date])

  const homeLogo = getTeamLogo(match.homeTeam.logo)
  const awayLogo = getTeamLogo(match.awayTeam.logo)
  const tournamentBadge = getTournamentBadge(match)
  const tournamentName = match.tournamentName || match.tournament?.name || match.sport

  const statusLabel = statusCopy[status]

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
            <span className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-red-600">
              <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_0_4px_rgba(248,113,113,0.25)]" />
              Live
            </span>
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

            <Link
              href={`/matches/${match.id}`}
              className="rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-800 transition group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white"
            >
              {status === "completed" ? "View Score" : status === "live" ? "Open Score" : "View Score"}
            </Link>
          </div>
        </div>
      </div>
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

