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
import { Trophy, Calendar, Trash2, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { getAllTournaments, deleteTournament } from "@/lib/client-api"
import { LoadingSpinner } from "@/components/loading-spinner"
import type { Tournament } from "@/lib/static-data"

const sportIcons: Record<string, React.ReactNode> = {
  cricket: <Trophy className="h-10 w-10 text-primary" />,
  volleyball: <Trophy className="h-10 w-10 text-primary" />,
  chess: <Trophy className="h-10 w-10 text-primary" />,
  futsal: <Trophy className="h-10 w-10 text-primary" />,
  "table-tennis": <Trophy className="h-10 w-10 text-primary" />,
  badminton: <Trophy className="h-10 w-10 text-primary" />,
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
  upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  ongoing: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Tournaments</h1>
        </div>

        {tournaments.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tournaments yet</h3>
            <p className="text-muted-foreground">Create your first tournament to get started</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament, index) => (
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="relative group"
                >
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Badge className={statusColors[tournament.status || 'upcoming']}>
                          {(tournament.status || 'upcoming').charAt(0).toUpperCase() + (tournament.status || 'upcoming').slice(1)}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl mt-2">{tournament.name || 'Unnamed Tournament'}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setConfirmDelete(tournament.id)
                        }}
                        disabled={deletingTournament === tournament.id}
                      >
                        {deletingTournament === tournament.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <Link href={`/tournaments/${tournament.id}`} className="block">
                        <div className="space-y-4">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Trophy className="h-4 w-4 mr-2" />
                            <span>{tournament.sport ? (sportNames[tournament.sport] || tournament.sport) : 'Multi-Sport Tournament'}</span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>
                              {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'Date TBD'} • {tournament.format ? (formatNames[tournament.format] || tournament.format) : 'Format TBD'}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
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
