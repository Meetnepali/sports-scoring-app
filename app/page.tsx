"use client"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Calendar, BarChart3, ArrowRight, LogIn, UserPlus, Zap, Shield, TrendingUp } from "lucide-react"
import Link from "next/link"
import { LoadingSpinner } from "@/components/loading-spinner"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { getMatchesByStatus } from "@/lib/client-api"
import { Match } from "@/lib/static-data"
import { EnhancedMatchCard } from "@/components/enhanced-match-card"
import { MatchCardSkeleton } from "@/components/loading-skeleton"
import { LiveTodaySection } from "@/components/live-today-section"
import { ResultsSection } from "@/components/results-section"
import { SportsLeaguesSection } from "@/components/sports-leagues-section"
import { EnhancedFooter } from "@/components/enhanced-footer"

export default function HomePage() {
  const { user, loading } = useAuth()
  const [liveMatches, setLiveMatches] = useState<Match[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [completedMatches, setCompletedMatches] = useState<Match[]>([])
  const [matchesLoading, setMatchesLoading] = useState(true)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setMatchesLoading(true)
        const [live, upcoming, completed] = await Promise.all([
          getMatchesByStatus("live"),
          getMatchesByStatus("scheduled"),
          getMatchesByStatus("completed"),
        ])
        setLiveMatches(live.slice(0, 3))
        setUpcomingMatches(upcoming.slice(0, 3))
        setCompletedMatches(completed.slice(0, 3))
      } catch (error) {
        console.error("Error fetching matches:", error)
      } finally {
        setMatchesLoading(false)
      }
    }

    fetchMatches()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated background elements */}

        <div className="container mx-auto px-4 py-16 sm:py-20 lg:py-24 relative z-10">
          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-16 lg:mb-20">
            {[
              { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-50", title: "Multiple Sports", desc: "Support for Cricket, Volleyball, Chess, Futsal, Table Tennis, and Badminton", delay: 0.6 },
              { icon: Users, color: "text-blue-500", bg: "bg-blue-50", title: "Team Management", desc: "Create and manage teams, track player statistics and performance", delay: 0.7 },
              { icon: Calendar, color: "text-green-500", bg: "bg-green-50", title: "Match Scheduling", desc: "Schedule matches, track scores, and manage tournaments", delay: 0.8 },
              { icon: BarChart3, color: "text-purple-500", bg: "bg-purple-50", title: "Analytics", desc: "Detailed analytics and insights into player and team performance", delay: 0.9 }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: feature.delay }}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
              >
                <Card className="text-center h-full bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 group">
                  <CardHeader>
                    <div className={`${feature.bg} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className={`h-10 w-10 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl lg:text-2xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm lg:text-base">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Additional Features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16 lg:mb-20"
          >
            {[
              { icon: Zap, title: "Real-time Updates", desc: "Get instant score updates and live match tracking" },
              { icon: Shield, title: "Secure & Reliable", desc: "Your data is protected with enterprise-grade security" },
              { icon: TrendingUp, title: "Performance Insights", desc: "Track progress and improve with detailed statistics" }
            ].map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                  <item.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg lg:text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm lg:text-base">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Live Today Section - Matching Goal808 Design */}
          {!matchesLoading && (liveMatches.length > 0 || upcomingMatches.length > 0) && (
            <LiveTodaySection matches={[...liveMatches, ...upcomingMatches]} />
          )}

          {/* Results Section - Matching Goal808 Design */}
          {!matchesLoading && completedMatches.length > 0 && (
            <ResultsSection matches={completedMatches} />
          )}

          {/* Sports Leagues Section - Matching Goal808 Design */}
          <SportsLeaguesSection />
        </div>

        {/* Enhanced Footer - Matching Goal808 Design */}
        <EnhancedFooter />
      </div>
    )
  }

  const firstName = user?.full_name?.split(" ")[0] || user?.username || "there"

  const dashboardTiles = [
    {
      title: "Performance Hub",
      description: "See real-time analytics and dive into player trends across every sport you manage.",
      href: "/analytics",
      icon: BarChart3,
      gradient: "from-indigo-500 via-purple-500 to-sky-500",
      accent: "from-indigo-500 to-purple-500",
      cta: "Open analytics",
    },
    {
      title: "Team Rooms",
      description: "Organise rosters, review player form, and keep your squads ready for the next game.",
      href: "/teams",
      icon: Users,
      gradient: "from-emerald-500 via-teal-400 to-cyan-500",
      accent: "from-emerald-500 to-teal-400",
      cta: "Manage teams",
    },
    {
      title: "Match Centre",
      description: "Track live scores, confirm schedules, and jump straight into scoring with one tap.",
      href: "/matches",
      icon: Calendar,
      gradient: "from-sky-500 via-blue-500 to-indigo-500",
      accent: "from-sky-500 to-blue-500",
      cta: "Go to matches",
    },
    {
      title: "Tournament Studio",
      description: "Spin up new brackets, manage fixtures, and highlight champions in seconds.",
      href: "/tournaments",
      icon: Trophy,
      gradient: "from-amber-500 via-orange-500 to-rose-500",
      accent: "from-amber-500 to-orange-500",
      cta: "Explore tournaments",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 lg:mb-14"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
          Personal dashboard
        </span>
        <h1 className="mt-3 text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
          Welcome back,{" "}
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 bg-clip-text text-transparent">
            {firstName}
          </span>
          .
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
          Everything you need to run your matches, teams, and tournaments lives here. Pick up where you left off or
          explore what’s new today.
        </p>
      </motion.div>

      <div className="mb-12 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardTiles.map((tile, index) => {
          const Icon = tile.icon
          return (
            <motion.div
              key={tile.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{ y: -8 }}
            >
              <Link
                href={tile.href}
                className="group relative block h-full overflow-hidden rounded-[28px]"
              >
                <div
                  className={`absolute inset-0 rounded-[28px] bg-gradient-to-br ${tile.gradient} opacity-0 transition duration-500 group-hover:opacity-100`}
                />
                <div className="relative flex h-full flex-col justify-between rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-all duration-300 group-hover:border-transparent group-hover:bg-white group-hover:shadow-[0_30px_55px_rgba(15,23,42,0.12)]">
                  <div>
                    <span
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tile.accent} text-white shadow-lg shadow-black/10 transition-transform duration-300 group-hover:scale-105`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-6 text-xl font-semibold text-slate-900">{tile.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-500">{tile.description}</p>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition-colors duration-300 group-hover:text-slate-900">
                    {tile.cta}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
