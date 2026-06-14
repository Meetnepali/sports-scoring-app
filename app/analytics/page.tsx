"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Users, Calendar, Star, Activity, TrendingUp, Target, Award } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { LoadingSpinner } from "@/components/loading-spinner"
import { motion } from "framer-motion"

interface AnalyticsData {
  user: any
  teamMemberships: any[]
  sportsStats: any[]
  recentMatches: any[]
  overallStats: any
  sportRecommendations: any[]
}

const sportGradients: Record<string, string> = {
  cricket: "from-orange-500 to-red-600",
  volleyball: "from-teal-500 to-cyan-600",
  chess: "from-amber-500 to-yellow-600",
  futsal: "from-green-500 to-emerald-600",
  "table-tennis": "from-blue-500 to-indigo-600",
  badminton: "from-purple-500 to-violet-600",
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch("/api/user/analytics")
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchAnalytics()
    }
  }, [user])

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-16">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Activity className="h-8 w-8 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-slate-900">Analytics</h1>
          <p className="text-slate-500">Failed to load analytics data. Please try again later.</p>
        </div>
      </div>
    )
  }

  const { teamMemberships, sportsStats, recentMatches, overallStats, sportRecommendations } = analytics
  const winRate = overallStats.total_matches > 0 ? ((overallStats.total_wins / overallStats.total_matches) * 100).toFixed(1) : 0

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-5"
      >
        <Avatar className="h-20 w-20 ring-4 ring-indigo-100">
          <AvatarImage src={user?.avatar_url || "/placeholder.svg"} alt={user?.full_name} />
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-xl font-bold text-white">
            {user?.full_name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{user?.full_name}</h1>
          <p className="text-slate-500">@{user?.username}</p>
          <Badge className="mt-2 bg-indigo-100 text-indigo-700 border-0 hover:bg-indigo-100">
            {user?.role === "admin" ? "Administrator" : "Player"}
          </Badge>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            title: "Total Matches",
            value: overallStats.total_matches || 0,
            subtitle: "Across all sports",
            icon: Calendar,
            gradient: "from-blue-500 to-indigo-600",
            bg: "bg-blue-50",
          },
          {
            title: "Win Rate",
            value: `${winRate}%`,
            subtitle: `${overallStats.total_wins || 0} wins of ${overallStats.total_matches || 0}`,
            icon: Trophy,
            gradient: "from-amber-500 to-orange-600",
            bg: "bg-amber-50",
          },
          {
            title: "Teams",
            value: overallStats.total_teams || 0,
            subtitle: "Active memberships",
            icon: Users,
            gradient: "from-teal-500 to-cyan-600",
            bg: "bg-teal-50",
          },
          {
            title: "Sports Played",
            value: overallStats.sports_played || 0,
            subtitle: "Different sports",
            icon: Activity,
            gradient: "from-purple-500 to-violet-600",
            bg: "bg-purple-50",
          },
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{stat.subtitle}</p>
                </div>
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Win Rate Visual */}
      {overallStats.total_matches > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700">Performance Overview</h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Wins ({overallStats.total_wins || 0})</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Losses ({overallStats.total_matches - overallStats.total_wins || 0})</span>
                </div>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${winRate}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-400">
                <span>0%</span>
                <span className="font-semibold text-slate-600">{winRate}% Win Rate</span>
                <span>100%</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="sports" className="space-y-4">
        <TabsList className="bg-slate-100/70 rounded-xl p-1">
          <TabsTrigger value="sports" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Sports Stats</TabsTrigger>
          <TabsTrigger value="teams" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">My Teams</TabsTrigger>
          <TabsTrigger value="matches" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Recent Matches</TabsTrigger>
          <TabsTrigger value="recommendations" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Discover</TabsTrigger>
        </TabsList>

        {/* Sports Stats Tab */}
        <TabsContent value="sports" className="space-y-4">
          {sportsStats.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <Target className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No sports statistics available yet. Play some matches to see your stats!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sportsStats.map((stat) => {
                const gradient = sportGradients[stat.sport] || "from-slate-500 to-slate-600"
                const sportWinRate = stat.total_matches > 0 ? ((stat.wins / stat.total_matches) * 100) : 0
                const rating = typeof stat.performance_rating === 'number'
                  ? stat.performance_rating
                  : Number(stat.performance_rating || 0)

                return (
                  <Card key={stat.sport} className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className={`h-1 bg-gradient-to-r ${gradient}`} />
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900 capitalize text-lg">{stat.sport}</h3>
                        <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-bold text-amber-700">{rating.toFixed(1)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3 mb-4">
                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                          <p className="text-lg font-bold text-slate-900">{stat.total_matches}</p>
                          <p className="text-[10px] text-slate-400 uppercase">Played</p>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded-lg">
                          <p className="text-lg font-bold text-green-600">{stat.wins}</p>
                          <p className="text-[10px] text-slate-400 uppercase">Wins</p>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded-lg">
                          <p className="text-lg font-bold text-red-500">{stat.losses}</p>
                          <p className="text-[10px] text-slate-400 uppercase">Losses</p>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 rounded-lg">
                          <p className="text-lg font-bold text-yellow-600">{stat.draws}</p>
                          <p className="text-[10px] text-slate-400 uppercase">Draws</p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-slate-500">Win Rate</span>
                          <span className="font-semibold text-slate-700">{sportWinRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={sportWinRate} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-4">
          {teamMemberships.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">You&apos;re not part of any teams yet. Join a team to start playing!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMemberships.map((membership) => {
                const gradient = sportGradients[membership.sport] || "from-slate-500 to-slate-600"
                return (
                  <Card key={membership.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
                          <span className="text-lg font-bold text-white">{membership.team_name?.charAt(0)}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{membership.team_name}</h3>
                          <p className="text-xs text-slate-500 capitalize">{membership.sport}</p>
                          {membership.position && (
                            <Badge variant="outline" className="mt-1 text-[10px] rounded-md">
                              {membership.position}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Recent Matches Tab */}
        <TabsContent value="matches" className="space-y-3">
          {recentMatches.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No recent matches found. Join a team and start playing!</p>
              </CardContent>
            </Card>
          ) : (
            recentMatches.map((match) => {
              const gradient = sportGradients[match.sport] || "from-slate-500 to-slate-600"
              return (
                <Card key={match.id} className={`border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden sport-accent-${match.sport || 'cricket'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">
                          {match.home_team_name} vs {match.away_team_name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Playing for {match.user_team_name} {match.venue ? `at ${match.venue}` : ""}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(match.match_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <Badge
                        className={
                          match.status === "completed"
                            ? "bg-green-100 text-green-700 border-0"
                            : match.status === "live"
                              ? "bg-red-100 text-red-700 border-0"
                              : "bg-slate-100 text-slate-600 border-0"
                        }
                      >
                        {match.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sportRecommendations.map((rec) => {
              const gradient = sportGradients[rec.sport] || "from-slate-500 to-slate-600"
              const rating = typeof rec.current_rating === 'number'
                ? rec.current_rating
                : Number(rec.current_rating || 0)

              return (
                <Card key={rec.sport} className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className={`h-1 bg-gradient-to-r ${gradient}`} />
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold capitalize text-slate-900">{rec.sport}</h3>
                      <Badge className={`border-0 ${
                        rec.skill_level === "new" ? "bg-blue-100 text-blue-700" :
                        rec.skill_level === "beginner" ? "bg-green-100 text-green-700" :
                        rec.skill_level === "intermediate" ? "bg-amber-100 text-amber-700" :
                        "bg-purple-100 text-purple-700"
                      }`}>
                        {rec.skill_level}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Available Teams</span>
                        <span className="font-semibold text-slate-900">{rec.available_teams}</span>
                      </div>

                      {rating > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Your Rating</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            <span className="font-semibold text-slate-900">{rating.toFixed(1)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-50">
                      {rec.skill_level === "new" && (
                        <p className="text-xs text-blue-600 flex items-center gap-1.5"><Award className="h-3.5 w-3.5" /> New sport to try! Great for beginners.</p>
                      )}
                      {rec.skill_level === "beginner" && (
                        <p className="text-xs text-green-600 flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Keep practicing to improve!</p>
                      )}
                      {rec.skill_level === "intermediate" && (
                        <p className="text-xs text-amber-600 flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> Doing well! Join more teams.</p>
                      )}
                      {rec.skill_level === "advanced" && (
                        <p className="text-xs text-purple-600 flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" /> Excellent! Consider mentoring.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
