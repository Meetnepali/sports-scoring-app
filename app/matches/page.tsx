"use client"

import { useState, useEffect } from "react"
import { getMatchesByStatus, updateMatchStatus } from "@/lib/client-api"
import { MatchListItem } from "@/components/match-list-item"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Zap, CalendarClock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Match } from "@/lib/static-data"
import { useAuth } from "@/lib/auth-context"

export default function MatchesPage() {
  const { isAdmin } = useAuth()
  const [liveMatches, setLiveMatches] = useState<Match[]>([])
  const [scheduledMatches, setScheduledMatches] = useState<Match[]>([])
  const [completedMatches, setCompletedMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [startingMatchId, setStartingMatchId] = useState<string | null>(null)
  const [matchFilter, setMatchFilter] = useState<"all" | "standalone" | "tournament">("all")
  const { toast } = useToast()

  const loadMatches = async () => {
    try {
      setLoading(true)
      const [started, live, scheduled, completed] = await Promise.all([
        getMatchesByStatus("started"),
        getMatchesByStatus("live"),
        getMatchesByStatus("scheduled"),
        getMatchesByStatus("completed")
      ])
      
      // Started matches are shown in "Live" tab (they need configuration/toss)
      // Live matches are actual matches being scored
      setLiveMatches([...started, ...live])
      setScheduledMatches(scheduled)
      setCompletedMatches(completed.slice(0, 3)) // Show only 3 most recent
    } catch (error) {
      console.error('Error loading matches:', error)
      toast({
        title: "Error",
        description: "Failed to load matches",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filterMatches = (matches: Match[]) => {
    if (matchFilter === "standalone") {
      return matches.filter((match) => !match.tournamentId)
    }
    if (matchFilter === "tournament") {
      return matches.filter((match) => match.tournamentId)
    }
    return matches
  }

  useEffect(() => {
    loadMatches()
  }, [])

  const handleStartMatch = async (matchId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      setStartingMatchId(matchId)
      await updateMatchStatus(matchId, 'started')
      
      toast({
        title: "Match Started!",
        description: "Complete the toss/configuration to begin scoring.",
      })
      
      // Reload matches to update the UI
      await loadMatches()
    } catch (error) {
      console.error('Error starting match:', error)
      toast({
        title: "Error",
        description: "Failed to start match. Please try again.",
        variant: "destructive"
      })
    } finally {
      setStartingMatchId(null)
    }
  }

  const renderMatchList = (matches: Match[], status: "live" | "scheduled" | "completed") => {
    if (loading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-28 rounded-[1.8rem] border border-slate-200/80 bg-white shadow-sm"
            >
              <div className="h-full w-full animate-pulse rounded-[1.8rem] bg-slate-100/60" />
            </div>
          ))}
        </div>
      )
    }

    if (matches.length === 0) {
      return (
        <div className="rounded-[1.8rem] border border-dashed border-slate-300/70 bg-white px-8 py-14 text-center shadow-sm">
          <div className="mb-4 flex justify-center">
            {status === "live" ? (
              <Zap className="h-10 w-10 text-slate-400" />
            ) : status === "scheduled" ? (
              <CalendarClock className="h-10 w-10 text-slate-400" />
            ) : (
              <CheckCircle className="h-10 w-10 text-slate-400" />
            )}
          </div>
          <p className="text-base font-semibold text-slate-700">
            {status === "live"
              ? "No live matches right now."
              : status === "scheduled"
                ? "No scheduled matches yet."
                : "No completed matches available."}
          </p>
          {status === "scheduled" && isAdmin && (
            <div className="mt-6 flex justify-center">
              <Link
                href="/matches/create"
                className="rounded-full bg-black px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                Create Match
              </Link>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {matches.map((match) => (
          <MatchListItem
            key={match.id}
            match={match}
            status={status}
            onStartMatch={status === "scheduled" ? handleStartMatch : undefined}
            starting={startingMatchId === match.id}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Results</h1>
      </div>

      {/* Match Filter */}
      <div className="mb-6 flex items-center gap-2 bg-white rounded-full p-1 border border-slate-200 w-fit">
        <button
          onClick={() => setMatchFilter("all")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            matchFilter === "all"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          All Matches
        </button>
        <button
          onClick={() => setMatchFilter("standalone")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            matchFilter === "standalone"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Standalone
        </button>
        <button
          onClick={() => setMatchFilter("tournament")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            matchFilter === "tournament"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Tournament
        </button>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="mb-10 grid w-full grid-cols-3 rounded-full bg-slate-100/70 p-1">
          <TabsTrigger
            value="live"
            className="flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-500 transition data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900"
          >
            <Zap className="h-4 w-4 text-red-500" />
            Live
          </TabsTrigger>
          <TabsTrigger
            value="scheduled"
            className="flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-500 transition data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900"
          >
            <CalendarClock className="h-4 w-4 text-blue-500" />
            Scheduled
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-500 transition data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900"
          >
            <CheckCircle className="h-4 w-4 text-green-500" />
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live">{renderMatchList(filterMatches(liveMatches), "live")}</TabsContent>

        <TabsContent value="scheduled">{renderMatchList(filterMatches(scheduledMatches), "scheduled")}</TabsContent>

        <TabsContent value="completed">{renderMatchList(filterMatches(completedMatches), "completed")}</TabsContent>
      </Tabs>
    </div>
  )
}
