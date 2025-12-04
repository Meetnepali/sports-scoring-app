"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Users, Calendar, Star, Activity } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { LoadingSpinner } from "@/components/loading-spinner"

interface AnalyticsData {
  user: any
  teamMemberships: any[]
  sportsStats: any[]
  recentMatches: any[]
  overallStats: any
  sportRecommendations: any[]
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
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Analytics</h1>
          <p className="text-muted-foreground">Failed to load analytics data.</p>
        </div>
      </div>
    )
  }

  const { teamMemberships, sportsStats, recentMatches, overallStats, sportRecommendations } = analytics

  const winRate =
    overallStats.total_matches > 0 ? ((overallStats.total_wins / overallStats.total_matches) * 100).toFixed(1) : 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user?.avatar_url || "/placeholder.svg"} alt={user?.full_name} />
          <AvatarFallback className="text-lg">
            {user?.full_name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{user?.full_name}</h1>
          <p className="text-muted-foreground">@{user?.username}</p>
          <Badge variant="secondary" className="mt-1">
            {user?.role === "admin" ? "Administrator" : "Player"}
          </Badge>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.total_matches || 0}</div>
            <p className="text-xs text-muted-foreground">Across all sports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate}%</div>
            <p className="text-xs text-muted-foreground">
              {overallStats.total_wins || 0} wins out of {overallStats.total_matches || 0} matches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.total_teams || 0}</div>
            <p className="text-xs text-muted-foreground">Active memberships</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sports Played</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.sports_played || 0}</div>
            <p className="text-xs text-muted-foreground">Different sports</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="teams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teams">My Teams</TabsTrigger>
          <TabsTrigger value="sports">Sports Stats</TabsTrigger>
          <TabsTrigger value="matches">Recent Matches</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Memberships</CardTitle>
              <CardDescription>Teams you're currently part of</CardDescription>
            </CardHeader>
            <CardContent>
              {teamMemberships.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  You're not part of any teams yet. Join a team to start playing!
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamMemberships.map((membership) => (
                    <Card key={membership.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Trophy className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{membership.team_name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">{membership.sport}</p>
                            {membership.position && (
                              <Badge variant="outline" className="mt-1">
                                {membership.position}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sports Performance</CardTitle>
              <CardDescription>Your statistics across different sports</CardDescription>
            </CardHeader>
            <CardContent>
              {sportsStats.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No sports statistics available yet. Play some matches to see your stats!
                </p>
              ) : (
                <div className="space-y-4">
                  {sportsStats.map((stat) => (
                    <div key={stat.sport} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold capitalize">{stat.sport}</h3>
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">
                            {typeof stat.performance_rating === 'number' 
                              ? stat.performance_rating.toFixed(1) 
                              : Number(stat.performance_rating || 0).toFixed(1)}/5.0
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Matches</p>
                          <p className="font-semibold">{stat.total_matches}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Wins</p>
                          <p className="font-semibold text-green-600">{stat.wins}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Losses</p>
                          <p className="font-semibold text-red-600">{stat.losses}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Draws</p>
                          <p className="font-semibold text-yellow-600">{stat.draws}</p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Win Rate</span>
                          <span>
                            {stat.total_matches > 0 ? ((stat.wins / stat.total_matches) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                        <Progress
                          value={stat.total_matches > 0 ? (stat.wins / stat.total_matches) * 100 : 0}
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Matches</CardTitle>
              <CardDescription>Your latest match performances</CardDescription>
            </CardHeader>
            <CardContent>
              {recentMatches.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No recent matches found. Join a team and start playing!
                </p>
              ) : (
                <div className="space-y-3">
                  {recentMatches.map((match) => (
                    <div key={match.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {match.home_team_name} vs {match.away_team_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Playing for {match.user_team_name} • {match.venue}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(match.match_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            match.status === "completed"
                              ? "default"
                              : match.status === "live"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {match.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sport Recommendations</CardTitle>
              <CardDescription>
                Sports you might want to try based on available teams and your performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sportRecommendations.map((rec) => (
                  <Card key={rec.sport}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold capitalize">{rec.sport}</h3>
                        <Badge variant="outline">{rec.skill_level}</Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Available Teams</span>
                          <span className="font-medium">{rec.available_teams}</span>
                        </div>

                        {rec.current_rating > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Your Rating</span>
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="font-medium">
                                {typeof rec.current_rating === 'number' 
                                  ? rec.current_rating.toFixed(1) 
                                  : Number(rec.current_rating || 0).toFixed(1)}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="pt-2">
                          {rec.skill_level === "new" && (
                            <p className="text-xs text-blue-600">🌟 New sport to try! Great for beginners.</p>
                          )}
                          {rec.skill_level === "beginner" && (
                            <p className="text-xs text-green-600">📈 Keep practicing to improve your skills!</p>
                          )}
                          {rec.skill_level === "intermediate" && (
                            <p className="text-xs text-orange-600">
                              🎯 You're doing well! Consider joining more teams.
                            </p>
                          )}
                          {rec.skill_level === "advanced" && (
                            <p className="text-xs text-purple-600">
                              🏆 Excellent performance! Consider mentoring others.
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
