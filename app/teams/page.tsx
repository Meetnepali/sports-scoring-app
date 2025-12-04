"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Trash2, Users, ArrowLeft, ArrowRight, Edit } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { motion } from "framer-motion"
import Image from "next/image"

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const sportNames: Record<string, string> = {
    cricket: "Cricket",
    volleyball: "Volleyball",
    chess: "Chess",
    futsal: "Futsal",
    "table-tennis": "Table Tennis",
    badminton: "Badminton",
  }

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
            const totalPages = Math.max(Math.ceil(data.length / 4) - 1, 0)
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
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete team")
      }

      setTeams((prevTeams) => {
        const updatedTeams = prevTeams.filter((team) => team.id !== teamId)
        setCurrentPage((prevPage) => {
          const maxPage = Math.max(Math.ceil(updatedTeams.length / 4) - 1, 0)
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

  const { visibleTeams, totalPages } = useMemo(() => {
    const teamsPerPage = 4
    const totalPagesCount = Math.max(Math.ceil(teams.length / teamsPerPage), 1)
    const start = currentPage * teamsPerPage
    const end = start + teamsPerPage
    return {
      visibleTeams: teams.slice(start, end),
      totalPages: totalPagesCount,
    }
  }, [teams, currentPage])

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
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"
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
      <div className="text-center mb-12 space-y-3">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Discover your top <span className="text-primary">Teams</span>
        </h1>
      </div>

      {teams.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
            {visibleTeams.map((team, index) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group relative"
              >
                <div className="relative overflow-hidden rounded-2xl border-2 border-black bg-background/70 p-6 backdrop-blur shadow-sm transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl min-h-[480px]">

                  {/* Subtle gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Edit and Delete buttons (kept above overlay) */}
                  <div className="absolute top-4 right-4 z-30 flex gap-2 opacity-0 group-hover:opacity-100 group-hover:delay-100">
                    <Link
                      href={`/teams/${team.id}/edit`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-background/80 text-muted-foreground transition hover:bg-primary hover:text-primary-foreground"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-background/80 text-muted-foreground transition hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDelete(team.id, team.name)}
                      disabled={isDeleting === team.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Main visible content */}
                  <Link href={`/sports/${team.sport}/teams/${team.id}`} className="block relative z-10">
                    <div className="flex flex-col items-center text-center gap-6">
                      {/* Team logo */}
                      <div className="relative h-32 w-32 rounded-2xl bg-white shadow-inner flex items-center justify-center ring-2 ring-black transition-transform duration-300 group-hover:scale-105 overflow-hidden">
                        <Image
                          src={team.logo || "/placeholder-logo.png"}
                          alt={team.name}
                          fill
                          className="object-cover"
                          sizes="128px"
                        />
                      </div>

                      {/* Team info */}
                      <div className="space-y-3">
                        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
                          {sportNames[team.sport] || team.sport}
                        </p>
                        <h3 className="text-xl font-semibold transition-colors duration-300 group-hover:text-black">
                          {team.name}
                        </h3>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {team.players.length} Players
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Hover overlay (completely covers content) */}
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-black opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white backdrop-blur-md rounded-2xl">
                    <div className="text-center space-y-3">
                      <p className="text-xs uppercase tracking-[0.4em] text-black/70">Squad</p>
                      <h4 className="text-2xl font-bold">{team.name}</h4>
                      <div className="max-h-44 overflow-y-auto pr-1 space-y-1">
                        {team.players.length ? (
                          team.players.map((player: any) => (
                            <p key={player.id} className="text-sm leading-tight text-black">
                              {player.name}
                              {player.number ? ` • #${player.number}` : ""}
                              {player.position ? ` • ${player.position}` : ""}
                            </p>
                          ))
                        ) : (
                          <p className="text-sm text-black/70">No players yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <button
              type="button"
              className="flex items-center gap-2 transition hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 0))}
              disabled={!canGoPrevious}
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>
            <span>
              {String(currentPage + 1).padStart(2, "0")}/{String(totalPages).padStart(2, "0")}
            </span>
            <button
              type="button"
              className="flex items-center gap-2 transition hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
              onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages - 1))}
              disabled={!canGoNext}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-muted rounded-lg">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
          <p className="text-muted-foreground mb-4">
            Start building your roster to see teams showcased here.
          </p>
          <Button asChild>
            <Link href="/teams/create">Create your first team</Link>
          </Button>
        </div>
      )}
    </div>
  </PageTransition>
);


}
