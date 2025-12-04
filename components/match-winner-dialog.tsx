"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trophy, X, Star, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import type { Match } from "@/lib/static-data"
import confetti from "canvas-confetti"

interface MatchWinnerDialogProps {
  match: Match
  open: boolean
  onClose: () => void
}

export function MatchWinnerDialog({ match, open, onClose }: MatchWinnerDialogProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  // Determine winner
  const getWinnerInfo = () => {
    if (!match.score) return null

    const sport = match.sport
    let winnerId: string | null = null
    let winnerName: string = ""
    let winnerLogo: string | undefined
    let scoreDisplay: string = ""
    let winMargin: string = ""

    // Determine winner based on sport
    switch (sport) {
      case "volleyball": {
        const sets = match.score.sets || []
        let homeWins = 0
        let awayWins = 0
        sets.forEach((set: any, index: number) => {
          const pointsToWin = index === 4 ? 15 : 25
          if (set.home >= pointsToWin && set.home - set.away >= 2) homeWins++
          else if (set.away >= pointsToWin && set.away - set.home >= 2) awayWins++
        })
        winnerId = homeWins > awayWins ? match.homeTeam.id : match.awayTeam.id
        winnerName = homeWins > awayWins ? match.homeTeam.name : match.awayTeam.name
        winnerLogo = homeWins > awayWins ? match.homeTeam.logo : match.awayTeam.logo
        scoreDisplay = `${homeWins} - ${awayWins}`
        winMargin = `by ${Math.abs(homeWins - awayWins)} set${Math.abs(homeWins - awayWins) > 1 ? "s" : ""}`
        break
      }
      case "cricket": {
        const innings = match.score.innings || []
        if (innings.length >= 2) {
          const firstInnings = innings[0]
          const secondInnings = innings[1]
          const firstTeamRuns = firstInnings.runs || 0
          const secondTeamRuns = secondInnings.runs || 0
          const secondTeamWickets = secondInnings.wickets || 0
          
          if (secondTeamRuns > firstTeamRuns) {
            // Second team won
            winnerId = secondInnings.team
            winnerName = winnerId === match.homeTeam.id ? match.homeTeam.name : match.awayTeam.name
            winnerLogo = winnerId === match.homeTeam.id ? match.homeTeam.logo : match.awayTeam.logo
            winMargin = `by ${10 - secondTeamWickets} wicket${10 - secondTeamWickets > 1 ? "s" : ""}`
          } else {
            // First team won
            winnerId = firstInnings.team
            winnerName = winnerId === match.homeTeam.id ? match.homeTeam.name : match.awayTeam.name
            winnerLogo = winnerId === match.homeTeam.id ? match.homeTeam.logo : match.awayTeam.logo
            winMargin = `by ${firstTeamRuns - secondTeamRuns} run${firstTeamRuns - secondTeamRuns > 1 ? "s" : ""}`
          }
          scoreDisplay = `${firstInnings.runs}/${firstInnings.wickets} vs ${secondInnings.runs}/${secondInnings.wickets}`
        }
        break
      }
      case "futsal": {
        const homeGoals = match.score.home || match.score.homeGoals || 0
        const awayGoals = match.score.away || match.score.awayGoals || 0
        if (homeGoals !== awayGoals) {
          winnerId = homeGoals > awayGoals ? match.homeTeam.id : match.awayTeam.id
          winnerName = homeGoals > awayGoals ? match.homeTeam.name : match.awayTeam.name
          winnerLogo = homeGoals > awayGoals ? match.homeTeam.logo : match.awayTeam.logo
          scoreDisplay = `${homeGoals} - ${awayGoals}`
          winMargin = `by ${Math.abs(homeGoals - awayGoals)} goal${Math.abs(homeGoals - awayGoals) > 1 ? "s" : ""}`
        } else {
          winnerName = "Draw"
          scoreDisplay = `${homeGoals} - ${awayGoals}`
        }
        break
      }
      case "chess": {
        const homeScore = match.score.home || 0
        const awayScore = match.score.away || 0
        if (homeScore !== awayScore) {
          winnerId = homeScore > awayScore ? match.homeTeam.id : match.awayTeam.id
          winnerName = homeScore > awayScore ? match.homeTeam.name : match.awayTeam.name
          winnerLogo = homeScore > awayScore ? match.homeTeam.logo : match.awayTeam.logo
          scoreDisplay = `${homeScore} - ${awayScore}`
          winMargin = homeScore === 1 ? "by Checkmate" : `${homeScore} - ${awayScore}`
        } else {
          winnerName = "Draw"
          scoreDisplay = `${homeScore} - ${awayScore}`
        }
        break
      }
      case "table-tennis":
      case "badminton": {
        const games = match.score.games || match.score.sets || []
        let homeWins = 0
        let awayWins = 0
        games.forEach((game: any) => {
          if (game.home > game.away) homeWins++
          else if (game.away > game.home) awayWins++
        })
        winnerId = homeWins > awayWins ? match.homeTeam.id : match.awayTeam.id
        winnerName = homeWins > awayWins ? match.homeTeam.name : match.awayTeam.name
        winnerLogo = homeWins > awayWins ? match.homeTeam.logo : match.awayTeam.logo
        scoreDisplay = `${homeWins} - ${awayWins}`
        winMargin = `by ${Math.abs(homeWins - awayWins)} game${Math.abs(homeWins - awayWins) > 1 ? "s" : ""}`
        break
      }
      default: {
        // Generic score handling
        const homeScore = match.score.home || match.score.team1 || 0
        const awayScore = match.score.away || match.score.team2 || 0
        if (homeScore !== awayScore) {
          winnerId = homeScore > awayScore ? match.homeTeam.id : match.awayTeam.id
          winnerName = homeScore > awayScore ? match.homeTeam.name : match.awayTeam.name
          winnerLogo = homeScore > awayScore ? match.homeTeam.logo : match.awayTeam.logo
          scoreDisplay = `${homeScore} - ${awayScore}`
        }
      }
    }

    return { winnerId, winnerName, winnerLogo, scoreDisplay, winMargin }
  }

  const winnerInfo = getWinnerInfo()

  // Trigger confetti when dialog opens
  useEffect(() => {
    if (open && winnerInfo?.winnerId) {
      setShowConfetti(true)
      // Fire confetti
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#FFD700", "#FFA500", "#FF6347", "#32CD32", "#4169E1"],
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#FFD700", "#FFA500", "#FF6347", "#32CD32", "#4169E1"],
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()
    }
  }, [open, winnerInfo?.winnerId])

  const getSportIcon = () => {
    switch (match.sport) {
      case "cricket": return "🏏"
      case "volleyball": return "🏐"
      case "chess": return "♟️"
      case "futsal": return "⚽"
      case "table-tennis": return "🏓"
      case "badminton": return "🏸"
      default: return "🏆"
    }
  }

  const getSportName = () => {
    switch (match.sport) {
      case "cricket": return "Cricket"
      case "volleyball": return "Volleyball"
      case "chess": return "Chess"
      case "futsal": return "Futsal"
      case "table-tennis": return "Table Tennis"
      case "badminton": return "Badminton"
      default: return "Match"
    }
  }

  if (!winnerInfo) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 bg-transparent shadow-none">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-1"
            >
              <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Header with gradient */}
                <div className="relative bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 px-6 py-8 text-center">
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-center mb-4"
                  >
                    <div className="relative">
                      <Trophy className="w-16 h-16 text-yellow-200" />
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-2 -right-2"
                      >
                        <Sparkles className="w-6 h-6 text-white" />
                      </motion.div>
                    </div>
                  </motion.div>
                  
                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-white mb-2"
                  >
                    Match Complete!
                  </motion.h2>
                  
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center justify-center gap-2 text-white/90"
                  >
                    <span className="text-2xl">{getSportIcon()}</span>
                    <span className="text-lg">{getSportName()}</span>
                  </motion.div>
                </div>

                {/* Winner announcement */}
                <div className="px-6 py-8 text-center">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    {winnerInfo.winnerLogo && (
                      <div className="w-24 h-24 mx-auto mb-4 relative">
                        <Image
                          src={winnerInfo.winnerLogo}
                          alt={winnerInfo.winnerName}
                          fill
                          className="object-contain rounded-full border-4 border-yellow-400 shadow-lg"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1"
                        >
                          <Star className="w-5 h-5 text-yellow-800 fill-yellow-800" />
                        </motion.div>
                      </div>
                    )}

                    <div className="mb-2 text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">
                      {winnerInfo.winnerId ? "Winner" : "Result"}
                    </div>

                    <motion.h3
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
                    >
                      {winnerInfo.winnerName}
                    </motion.h3>

                    {winnerInfo.winMargin && winnerInfo.winnerId && (
                      <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="text-lg text-orange-600 dark:text-orange-400 font-semibold"
                      >
                        {winnerInfo.winMargin}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Score display */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {match.homeTeam.logo && (
                          <div className="w-10 h-10 relative">
                            <Image
                              src={match.homeTeam.logo}
                              alt={match.homeTeam.name}
                              fill
                              className="object-contain rounded-full"
                            />
                          </div>
                        )}
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {match.homeTeam.name}
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {winnerInfo.scoreDisplay}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {match.awayTeam.name}
                        </span>
                        {match.awayTeam.logo && (
                          <div className="w-10 h-10 relative">
                            <Image
                              src={match.awayTeam.logo}
                              alt={match.awayTeam.name}
                              fill
                              className="object-contain rounded-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* View details button */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="mt-6"
                  >
                    <Button
                      onClick={onClose}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-6 text-lg"
                    >
                      View Match Details
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

