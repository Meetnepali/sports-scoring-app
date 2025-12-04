import { type NextRequest, NextResponse } from "next/server"
import { getUserFromToken } from "@/lib/auth"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get user's team memberships
    const teamMemberships = await query(
      `
      SELECT utm.*, t.name as team_name, t.sport, t.logo
      FROM user_team_memberships utm
      JOIN teams t ON utm.team_id = t.id
      WHERE utm.user_id = $1 AND utm.status = 'active'
      ORDER BY utm.joined_at DESC
    `,
      [user.id],
    )

    // Get user's sports statistics
    const sportsStats = await query(
      `
      SELECT * FROM user_sports_stats
      WHERE user_id = $1
      ORDER BY total_matches DESC
    `,
      [user.id],
    )

    // Ensure performance_rating is a number
    const processedSportsStats = sportsStats.map((stat: any) => ({
      ...stat,
      performance_rating: Number(stat.performance_rating || 0),
      total_matches: Number(stat.total_matches || 0),
      wins: Number(stat.wins || 0),
      losses: Number(stat.losses || 0),
      draws: Number(stat.draws || 0)
    }))

    // Get recent match participation
    const recentMatches = await query(
      `
      SELECT ump.*, m.match_date, m.venue, m.status,
             ht.name as home_team_name, at.name as away_team_name,
             t.name as user_team_name
      FROM user_match_participation ump
      JOIN matches m ON ump.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN teams t ON ump.team_id = t.id
      WHERE ump.user_id = $1
      ORDER BY m.match_date DESC
      LIMIT 10
    `,
      [user.id],
    )

    // Calculate overall statistics
    const overallStats = await query(
      `
      SELECT 
        COUNT(DISTINCT utm.team_id) as total_teams,
        COUNT(DISTINCT utm.sport) as sports_played,
        COUNT(DISTINCT ump.match_id) as total_matches,
        COALESCE(SUM(uss.wins), 0) as total_wins,
        COALESCE(SUM(uss.losses), 0) as total_losses,
        COALESCE(SUM(uss.draws), 0) as total_draws,
        COALESCE(AVG(uss.performance_rating), 0) as avg_rating
      FROM users u
      LEFT JOIN user_team_memberships utm ON u.id = utm.user_id AND utm.status = 'active'
      LEFT JOIN user_match_participation ump ON u.id = ump.user_id
      LEFT JOIN user_sports_stats uss ON u.id = uss.user_id
      WHERE u.id = $1
    `,
      [user.id],
    )

    // Get sport recommendations based on performance and activity
    const sportRecommendations = await query(
      `
      SELECT s.name as sport,
             COUNT(t.id) as available_teams,
             COALESCE(uss.performance_rating, 0) as current_rating,
             CASE 
               WHEN uss.user_id IS NULL THEN 'new'
               WHEN uss.performance_rating < 3.0 THEN 'beginner'
               WHEN uss.performance_rating < 4.0 THEN 'intermediate'
               ELSE 'advanced'
             END as skill_level
      FROM sports s
      LEFT JOIN teams t ON s.name = t.sport
      LEFT JOIN user_sports_stats uss ON s.name = uss.sport AND uss.user_id = $1
      GROUP BY s.name, uss.performance_rating, uss.user_id
      ORDER BY available_teams DESC, current_rating DESC
    `,
      [user.id],
    )

    // Process sport recommendations to ensure current_rating is a number
    const processedSportRecommendations = sportRecommendations.map((rec: any) => ({
      ...rec,
      current_rating: Number(rec.current_rating || 0),
      available_teams: Number(rec.available_teams || 0)
    }))

    return NextResponse.json({
      user,
      teamMemberships,
      sportsStats: processedSportsStats,
      recentMatches,
      overallStats: overallStats[0],
      sportRecommendations: processedSportRecommendations,
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
