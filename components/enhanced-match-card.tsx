"use client"

import { Match } from "@/lib/static-data"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Clock, MapPin, Trophy, Zap } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface EnhancedMatchCardProps {
  match: Match
  index?: number
}

const sportColors: Record<string, string> = {
  cricket: "from-orange-500 to-red-500",
  volleyball: "from-teal-500 to-cyan-500",
  chess: "from-emerald-500 to-green-500",
  futsal: "from-pink-500 to-rose-500",
  tabletennis: "from-purple-500 to-violet-500",
  badminton: "from-pink-400 to-purple-400",
}

const sportGlows: Record<string, string> = {
  cricket: "shadow-orange-500/20",
  volleyball: "shadow-teal-500/20",
  chess: "shadow-emerald-500/20",
  futsal: "shadow-pink-500/20",
  tabletennis: "shadow-purple-500/20",
  badminton: "shadow-pink-400/20",
}

export function EnhancedMatchCard({ match, index = 0 }: EnhancedMatchCardProps) {
  const isLive = match.status === "live"
  const isCompleted = match.status === "completed"
  const sportColor = sportColors[match.sport] || "from-blue-500 to-indigo-500"
  const sportGlow = sportGlows[match.sport] || "shadow-blue-500/20"

  const getScore = (team: "home" | "away") => {
    if (!match.score) return "-"
    
    // Handle different sport score structures
    if (match.sport === "cricket") {
      return team === "home" 
        ? `${match.score.homeRuns}/${match.score.homeWickets}`
        : `${match.score.awayRuns}/${match.score.awayWickets}`
    } else if (match.sport === "volleyball") {
      return team === "home" ? match.score.homeSets || 0 : match.score.awaySets || 0
    } else {
      return team === "home" ? match.score.homeScore || 0 : match.score.awayScore || 0
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Link href={`/matches/${match.id}`}>
        <Card className={`glass angular-card overflow-hidden transition-all duration-300 hover:shadow-2xl ${sportGlow} border-2 ${isLive ? 'energy-border animate-energy-pulse' : 'border-border/50'} group cursor-pointer`}>
          {/* Status Badge */}
          <div className="absolute top-3 right-3 z-10">
            {isLive && (
              <Badge className="bg-red-500 text-white angular-badge animate-pulse flex items-center gap-1 px-3">
                <Zap className="h-3 w-3" />
                LIVE
              </Badge>
            )}
            {isCompleted && (
              <Badge variant="secondary" className="angular-badge">
                Completed
              </Badge>
            )}
            {match.status === "scheduled" && (
              <Badge variant="outline" className="angular-badge bg-background/80 backdrop-blur-sm">
                Upcoming
              </Badge>
            )}
          </div>

          {/* Sport Gradient Header */}
          <div className={`h-2 bg-gradient-to-r ${sportColor}`} />

          <div className="p-5">
            {/* Sport & Venue Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className={`h-4 w-4 bg-gradient-to-r ${sportColor} bg-clip-text text-transparent`} />
                <span className="text-sm font-semibold capitalize">{match.sport}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{match.venue}</span>
              </div>
            </div>

            {/* Teams & Scores */}
            <div className="space-y-3">
              {/* Home Team */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${sportColor} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                    {match.homeTeam.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                    {match.homeTeam.name}
                  </span>
                </div>
                <div className={`text-2xl font-bold ${isLive ? 'energy-glow' : ''} min-w-[3rem] text-right`}>
                  {getScore("home")}
                </div>
              </div>

              {/* VS Divider */}
              <div className="flex items-center justify-center">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
                <span className="px-3 text-xs font-semibold text-muted-foreground">VS</span>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>

              {/* Away Team */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${sportColor} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                    {match.awayTeam.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                    {match.awayTeam.name}
                  </span>
                </div>
                <div className={`text-2xl font-bold ${isLive ? 'energy-glow' : ''} min-w-[3rem] text-right`}>
                  {getScore("away")}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {isLive ? "Live now" : isCompleted ? "Completed" : formatDistanceToNow(new Date(match.date), { addSuffix: true })}
                </span>
              </div>
              <motion.div
                className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                initial={{ x: -10 }}
                whileHover={{ x: 0 }}
              >
                View Details →
              </motion.div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}
