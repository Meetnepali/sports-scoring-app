"use client"

import type React from "react"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { PageTransition } from "@/components/page-transition"
import { Trophy, Calendar, Trash2, Loader2, Target, Volleyball, Swords, CircleDot, Activity, Dumbbell } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"
import { getAllTournaments, deleteTournament } from "@/lib/client-api"
import { LoadingSpinner } from "@/components/loading-spinner"
import type { Tournament } from "@/lib/static-data"

const sportIcons: Record<string, LucideIcon> = {
  cricket: Target,
  volleyball: Volleyball,
  chess: Swords,
  futsal: CircleDot,
  "table-tennis": Activity,
  badminton: Dumbbell,
}

const sportNames: Record<string, string> = {
  cricket: "Cricket",
  volleyball: "Volleyball",
  chess: "Chess",
  futsal: "Futsal",
  "table-tennis": "Table Tennis",
  badminton: "Badminton",
}

const formatNames: Record<string, string> = {
  "single-elimination": "Single Elimination",
  "double-elimination": "Double Elimination",
  "round-robin": "Round Robin",
  consolation: "Consolation Bracket",
}

const statusColors: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-700 border-0",
  ongoing: "bg-green-100 text-green-700 border-0",
  completed: "bg-slate-100 text-slate-600 border-0",
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingTournament, setDeletingTournament] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true)
        const data = await getAllTournaments()
        setTournaments(data)
      } catch (error) {
        console.error('Error fetching tournaments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTournaments()
  }, [])

  const handleDelete = async (tournamentId: string) => {
    try {
      setDeletingTournament(tournamentId)
      await deleteTournament(tournamentId)
      setTournaments(tournaments.filter(t => t.id !== tournamentId))
      setConfirmDelete(null)
    } catch (error) {
      console.error('Error deleting tournament:', error)
      alert('Failed to delete tournament')
    } finally {
      setDeletingTournament(null)
    }
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Tournaments</h1>
          </div>
          <LoadingSpinner />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">Tournaments</h1>
            <p className="text-slate-500 mt-1">Manage brackets, fixtures, and champions</p>
          </div>
        </div>

        {tournaments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900">No tournaments yet</h3>
            <p className="text-sm text-slate-500 mb-6">Create your first tournament to get started</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tournaments.map((tournament, index) => {
                const SportIcon = sportIcons[tournament.sport || ''] || Trophy
                return (
                  <motion.div
                    key={tournament.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.08 }}
                    className="relative group"
                  >
                    <Card className="h-full border border-slate-200 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1 overflow-hidden rounded-2xl">
                      <CardHeader className="pb-2 pt-5">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                              <SportIcon className="h-4 w-4 text-emerald-600" />
                            </div>
                            <Badge className={statusColors[tournament.status || 'upcoming']}>
                              {(tournament.status || 'upcoming').charAt(0).toUpperCase() + (tournament.status || 'upcoming').slice(1)}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setConfirmDelete(tournament.id)
                            }}
                            disabled={deletingTournament === tournament.id}
                          >
                            {deletingTournament === tournament.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-red-400" />
                            )}
                          </Button>
                        </div>
                        <CardTitle className="text-lg mt-2 text-slate-900">{tournament.name || 'Unnamed Tournament'}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Link href={`/tournaments/${tournament.id}`} className="block">
                          <div className="space-y-3">
                            <div className="flex items-center text-sm text-slate-500">
                              <Trophy className="h-4 w-4 mr-2 text-slate-400" />
                              <span>{tournament.sport ? (sportNames[tournament.sport] || tournament.sport) : 'Multi-Sport'}</span>
                              {tournament.format && (
                                <Badge variant="outline" className="ml-2 text-[10px] rounded-md">{formatNames[tournament.format] || tournament.format}</Badge>
                              )}
                            </div>
                            <div className="flex items-center text-sm text-slate-500">
                              <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                              <span>
                                {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : 'Date TBD'}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
            
            <AlertDialog open={confirmDelete !== null} onOpenChange={() => setConfirmDelete(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Tournament</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this tournament? This action cannot be undone and will delete all associated sports, groups, teams, and bracket data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => confirmDelete && handleDelete(confirmDelete)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </PageTransition>
  )
}
