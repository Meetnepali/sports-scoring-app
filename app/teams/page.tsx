"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Users, ArrowLeft, ArrowRight, Edit, Search, PlusCircle } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { motion } from "framer-motion"
import Image from "next/image"

const sportConfig: Record<string, { label: string; color: string; gradient: string }> = {
  cricket: { label: "Cricket", color: "bg-orange-500", gradient: "from-orange-500 to-red-600" },
  volleyball: { label: "Volleyball", color: "bg-teal-500", gradient: "from-teal-500 to-cyan-600" },
  chess: { label: "Chess", color: "bg-amber-500", gradient: "from-amber-500 to-yellow-600" },
  futsal: { label: "Futsal", color: "bg-green-500", gradient: "from-green-500 to-emerald-600" },
  "table-tennis": { label: "Table Tennis", color: "bg-blue-500", gradient: "from-blue-500 to-indigo-600" },
  badminton: { label: "Badminton", color: "bg-purple-500", gradient: "from-purple-500 to-violet-600" },
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sportFilter, setSportFilter] = useState("all")

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async (pageReset = false) => {
    try {
      const response = await fetch("/api/teams")
      if (response.ok) {
        const data = await response.json()
        setTeams(data)
        if (pageReset) {
          setCurrentPage(0)
        } else {
          setCurrentPage((prevPage) => {
            const totalPages = Math.max(Math.ceil(data.length / 8) - 1, 0)
            return Math.min(prevPage, totalPages)
          })
        }
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (teamId: string, teamName: string) => {
    const confirmed = window.confirm(`Delete ${teamName}? This action cannot be undone.`)
    if (!confirmed) return

    try {
      setIsDeleting(teamId)
      const response = await fetch(`/api/teams/${teamId}`, { method: "DELETE" })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete team")
      }

      setTeams((prevTeams) => {
        const updatedTeams = prevTeams.filter((team) => team.id !== teamId)
        setCurrentPage((prevPage) => {
          const maxPage = Math.max(Math.ceil(updatedTeams.length / 8) - 1, 0)
          return Math.min(prevPage, maxPage)
        })
        return updatedTeams
      })
    } catch (error) {
      console.error("Error deleting team:", error)
      alert(error instanceof Error ? error.message : "Failed to delete team")
    } finally {
      setIsDeleting(null)
    }
  }

  const filteredTeams = useMemo(() => {
    let result = teams
    if (sportFilter !== "all") {
      result = result.filter((t) => t.sport === sportFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || t.sport.toLowerCase().includes(q)
      )
    }
    return result
  }, [teams, sportFilter, searchQuery])

  const { visibleTeams, totalPages } = useMemo(() => {
    const teamsPerPage = 8
    const totalPagesCount = Math.max(Math.ceil(filteredTeams.length / teamsPerPage), 1)
    const start = currentPage * teamsPerPage
    const end = start + teamsPerPage
    return {
      visibleTeams: filteredTeams.slice(start, end),
      totalPages: totalPagesCount,
    }
  }, [filteredTeams, currentPage])

  const canGoPrevious = currentPage > 0
  const canGoNext = currentPage < totalPages - 1

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full mx-auto mb-4"
            />
            <p className="text-muted-foreground">Loading teams...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">Teams</h1>
              <p className="text-slate-500 mt-1">{teams.length} teams across all sports</p>
            </div>
            <Link href="/teams/create">
              <Button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all duration-300 hover:-translate-y-0.5">
                <PlusCircle className="h-4 w-4" />
                Create Team
              </Button>
            </Link>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0) }}
                className="pl-10 h-10 rounded-xl border-slate-200 bg-white focus:border-emerald-400 focus:ring-emerald-400/20"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { value: "all", label: "All" },
                ...Object.entries(sportConfig).map(([key, val]) => ({ value: key, label: val.label, color: val.color })),
              ].map((sport) => (
                <button
                  key={sport.value}
                  onClick={() => { setSportFilter(sport.value); setCurrentPage(0) }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                    sportFilter === sport.value
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-white text-slate-400 border-slate-200 hover:text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {sport.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {filteredTeams.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {visibleTeams.map((team, index) => {
                const sport = sportConfig[team.sport] || { label: team.sport, color: "bg-slate-500", gradient: "from-slate-500 to-slate-600" }
                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group relative"
                  >
                    <div className={`relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg sport-accent-${team.sport}`}>
                      {/* Edit/Delete buttons */}
                      <div className="absolute top-3 right-3 z-30 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Link
                          href={`/teams/${team.id}/edit`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 backdrop-blur-sm text-slate-500 shadow-sm border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 backdrop-blur-sm text-slate-500 shadow-sm border border-slate-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                          onClick={() => handleDelete(team.id, team.name)}
                          disabled={isDeleting === team.id}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <Link href={`/sports/${team.sport}/teams/${team.id}`} className="block p-5">
                        <div className="flex items-start gap-4">
                          {/* Team Logo */}
                          <div className={`relative h-14 w-14 rounded-xl bg-gradient-to-br ${sport.gradient} flex items-center justify-center shrink-0 shadow-md overflow-hidden`}>
                            {team.logo ? (
                              <Image
                                src={team.logo}
                                alt={team.name}
                                fill
                                className="object-cover"
                                sizes="56px"
                              />
                            ) : (
                              <span className="text-xl font-bold text-white">{team.name.charAt(0)}</span>
                            )}
                          </div>

                          {/* Team Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-slate-900 truncate">{team.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`h-2 w-2 rounded-full ${sport.color}`} />
                              <span className="text-xs text-slate-500">{sport.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                              <Users className="h-3.5 w-3.5" />
                              <span>{team.players.length} Players</span>
                            </div>
                          </div>
                        </div>

                        {/* Players preview */}
                        {team.players.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-50">
                            <div className="flex items-center gap-1">
                              {team.players.slice(0, 4).map((player: any, i: number) => (
                                <div
                                  key={player.id}
                                  className={`h-7 w-7 rounded-full bg-gradient-to-br ${sport.gradient} flex items-center justify-center text-[10px] font-semibold text-white ring-2 ring-white -ml-1 first:ml-0`}
                                  title={player.name}
                                >
                                  {player.name?.charAt(0)}
                                </div>
                              ))}
                              {team.players.length > 4 && (
                                <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-500 ring-2 ring-white -ml-1">
                                  +{team.players.length - 4}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Link>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <button
                  type="button"
                  className="flex items-center gap-2 transition hover:text-foreground disabled:opacity-40"
                  onClick={() => setCurrentPage((page) => Math.max(page - 1, 0))}
                  disabled={!canGoPrevious}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </button>
                <span className="text-xs">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  className="flex items-center gap-2 transition hover:text-foreground disabled:opacity-40"
                  onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages - 1))}
                  disabled={!canGoNext}
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Users className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900">
              {searchQuery || sportFilter !== "all" ? "No teams found" : "No teams yet"}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {searchQuery || sportFilter !== "all"
                ? "Try adjusting your search or filter"
                : "Create your first team to get started"}
            </p>
            {!searchQuery && sportFilter === "all" && (
              <Button asChild className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600">
                <Link href="/teams/create">Create your first team</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
