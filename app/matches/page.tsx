"use client"

import { useState, useEffect } from "react"
import { getMatchesByStatus, updateMatchStatus, deleteMatch } from "@/lib/client-api"
import { MatchListItem } from "@/components/match-list-item"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, PlusCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Match } from "@/lib/static-data"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"

const sportFilters = [
  { value: "all", label: "All" },
  { value: "cricket", label: "Cricket" },
  { value: "volleyball", label: "Volleyball" },
  { value: "chess", label: "Chess" },
  { value: "futsal", label: "Futsal" },
  { value: "table-tennis", label: "Table Tennis" },
  { value: "badminton", label: "Badminton" },
]

export default function MatchesPage() {
  const { isAdmin } = useAuth()
  const [liveMatches, setLiveMatches] = useState<Match[]>([])
  const [scheduledMatches, setScheduledMatches] = useState<Match[]>([])
  const [completedMatches, setCompletedMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [startingMatchId, setStartingMatchId] = useState<string | null>(null)
  const [matchFilter, setMatchFilter] = useState<"all" | "standalone" | "tournament">("all")
  const [sportFilter, setSportFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
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
      setLiveMatches([...started, ...live])
      setScheduledMatches(scheduled)
      setCompletedMatches(completed.slice(0, 3))
    } catch (error) {
      console.error('Error loading matches:', error)
      toast({ title: "Error", description: "Failed to load matches", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const filterMatches = (matches: Match[]) => {
    let filtered = matches
    if (matchFilter === "standalone") filtered = filtered.filter((m) => !m.tournamentId)
    else if (matchFilter === "tournament") filtered = filtered.filter((m) => m.tournamentId)
    if (sportFilter !== "all") filtered = filtered.filter((m) => m.sport === sportFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (m) =>
          m.homeTeam.name.toLowerCase().includes(q) ||
          m.awayTeam.name.toLowerCase().includes(q) ||
          m.sport.toLowerCase().includes(q) ||
          m.venue?.toLowerCase().includes(q)
      )
    }
    return filtered
  }

  useEffect(() => { loadMatches() }, [])

  const handleStartMatch = async (matchId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      setStartingMatchId(matchId)
      await updateMatchStatus(matchId, 'started')
      toast({ title: "Match Started!", description: "Complete the toss/configuration to begin scoring." })
      await loadMatches()
    } catch (error) {
      console.error('Error starting match:', error)
      toast({ title: "Error", description: "Failed to start match.", variant: "destructive" })
    } finally {
      setStartingMatchId(null)
    }
  }

  const handleDeleteMatch = async (matchId: string) => {
    try {
      await deleteMatch(matchId)
      toast({ title: "Match Deleted", description: "The match has been permanently deleted." })
      await loadMatches()
    } catch (error) {
      console.error('Error deleting match:', error)
      const msg = error instanceof Error ? error.message : "Failed to delete match"
      toast({ title: "Error", description: msg, variant: "destructive" })
      throw error
    }
  }

  const getTabCount = (matches: Match[]) => filterMatches(matches).length

  const renderMatchList = (matches: Match[], status: "live" | "scheduled" | "completed") => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="h-3 w-20 bg-slate-100 rounded-full animate-pulse mb-4" />
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-50 animate-pulse" />
                  <div className="h-4 w-28 bg-slate-100 rounded-full animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-50 animate-pulse" />
                  <div className="h-4 w-24 bg-slate-100 rounded-full animate-pulse" />
                </div>
              </div>
              <div className="h-3 w-32 bg-slate-50 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      )
    }

    const filtered = filterMatches(matches)

    if (filtered.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <p className="text-sm font-semibold text-slate-600 mb-1">
            {status === "live" ? "No live matches right now" : status === "scheduled" ? "No scheduled matches" : "No completed matches"}
          </p>
          <p className="text-xs text-slate-400">
            {searchQuery ? "Try adjusting your search or filters" : "Check back later for updates"}
          </p>
          {status === "scheduled" && isAdmin && !searchQuery && (
            <Link
              href="/matches/create"
              className="inline-flex items-center gap-2 mt-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              Create Match
            </Link>
          )}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((match) => (
          <MatchListItem
            key={match.id}
            match={match}
            status={status}
            onStartMatch={status === "scheduled" ? handleStartMatch : undefined}
            starting={startingMatchId === match.id}
            onDelete={isAdmin ? handleDeleteMatch : undefined}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] relative">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(15,23,42,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.02) 1px, transparent 1px)`,
        backgroundSize: '64px 64px'
      }} />

      <div className="container mx-auto px-4 py-8 lg:py-10 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">Matches</span>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">All Matches</h1>
            </div>
            {isAdmin && (
              <Link
                href="/matches/create"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition-all duration-200 w-fit"
              >
                <PlusCircle className="h-4 w-4" />
                New Match
              </Link>
            )}
          </div>

          {/* Filters Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search matches, teams, venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl border-slate-200 bg-slate-50 text-sm focus:border-emerald-400 focus:ring-emerald-400/20 focus:bg-white"
              />
            </div>

            {/* Filter row: type + sport */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Type filter */}
              <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5 shrink-0">
                {[
                  { value: "all", label: "All" },
                  { value: "standalone", label: "Standalone" },
                  { value: "tournament", label: "Tournament" },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setMatchFilter(f.value as "all" | "standalone" | "tournament")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                      matchFilter === f.value
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="hidden sm:block h-5 w-px bg-slate-200 shrink-0" />

              {/* Sport filter — horizontal scroll on mobile */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
                {sportFilters.map((sport) => (
                  <button
                    key={sport.value}
                    onClick={() => setSportFilter(sport.value)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                      sportFilter === sport.value
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {sport.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="live" className="w-full">
            <TabsList className="mb-5 inline-flex gap-0.5 rounded-lg bg-slate-100 p-0.5 h-auto w-auto">
              <TabsTrigger
                value="live"
                className="rounded-md px-3.5 py-1.5 text-xs font-semibold text-slate-400 transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                Live
                {!loading && liveMatches.length > 0 && (
                  <span className="ml-1.5 h-4 min-w-[16px] inline-flex items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {getTabCount(liveMatches)}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="scheduled"
                className="rounded-md px-3.5 py-1.5 text-xs font-semibold text-slate-400 transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                Scheduled
                {!loading && scheduledMatches.length > 0 && (
                  <span className="ml-1.5 h-4 min-w-[16px] inline-flex items-center justify-center rounded-full bg-slate-300 px-1 text-[9px] font-bold text-white">
                    {getTabCount(scheduledMatches)}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="rounded-md px-3.5 py-1.5 text-xs font-semibold text-slate-400 transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                Completed
                {!loading && completedMatches.length > 0 && (
                  <span className="ml-1.5 h-4 min-w-[16px] inline-flex items-center justify-center rounded-full bg-slate-300 px-1 text-[9px] font-bold text-white">
                    {getTabCount(completedMatches)}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live">{renderMatchList(liveMatches, "live")}</TabsContent>
            <TabsContent value="scheduled">{renderMatchList(scheduledMatches, "scheduled")}</TabsContent>
            <TabsContent value="completed">{renderMatchList(completedMatches, "completed")}</TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
