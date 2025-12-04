import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// GET complete scorecard data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params

    // Get batting statistics
    const battingStats = await query(
      `SELECT 
        cpi.*,
        p.name as player_name,
        p.number as player_number,
        t.id as team_id,
        t.name as team_name
       FROM cricket_player_innings cpi
       JOIN players p ON cpi.player_id = p.id
       JOIN teams t ON p.team_id = t.id
       WHERE cpi.match_id = $1
       ORDER BY cpi.innings_number, cpi.runs_scored DESC`,
      [matchId]
    )

    // Get bowling statistics
    const bowlingStats = await query(
      `SELECT 
        cpb.*,
        p.name as player_name,
        p.number as player_number,
        t.id as team_id,
        t.name as team_name
       FROM cricket_player_bowling cpb
       JOIN players p ON cpb.player_id = p.id
       JOIN teams t ON p.team_id = t.id
       WHERE cpb.match_id = $1
       ORDER BY cpb.innings_number, cpb.wickets_taken DESC, cpb.economy_rate ASC`,
      [matchId]
    )

    // Get fall of wickets (chronological order of dismissals)
    const fallOfWickets = await query(
      `SELECT 
        cbb.innings_number,
        cbb.over_number,
        cbb.ball_number,
        p.name as player_name,
        cbb.wicket_type,
        (SELECT SUM(runs_scored + COALESCE(extra_runs, 0))
         FROM cricket_ball_by_ball
         WHERE match_id = cbb.match_id 
           AND innings_number = cbb.innings_number
           AND (over_number < cbb.over_number 
                OR (over_number = cbb.over_number AND ball_number <= cbb.ball_number))
        ) as score_at_wicket
       FROM cricket_ball_by_ball cbb
       JOIN players p ON cbb.wicket_player_id = p.id
       WHERE cbb.match_id = $1 AND cbb.is_wicket = true
       ORDER BY cbb.innings_number, cbb.over_number, cbb.ball_number`,
      [matchId]
    )

    // Get match configuration
    const config = await query(
      `SELECT 
        cmc.*,
        tw.name as toss_winner_team_name,
        bf.name as bat_first_team_name
       FROM cricket_match_config cmc
       LEFT JOIN teams tw ON cmc.toss_winner_team_id = tw.id
       LEFT JOIN teams bf ON cmc.elected_to_bat_first_team_id = bf.id
       WHERE cmc.match_id = $1`,
      [matchId]
    )

    // Get match summary
    const summary = await query(
      `SELECT 
        cms.*,
        w.name as winner_team_name,
        p.name as man_of_match_name
       FROM cricket_match_summary cms
       LEFT JOIN teams w ON cms.winner_team_id = w.id
       LEFT JOIN players p ON cms.man_of_match_player_id = p.id
       WHERE cms.match_id = $1`,
      [matchId]
    )

    // Calculate extras by innings
    const extras = await query(
      `SELECT 
        innings_number,
        SUM(CASE WHEN extra_type = 'wide' THEN extra_runs ELSE 0 END) as wides,
        SUM(CASE WHEN extra_type = 'noball' THEN extra_runs ELSE 0 END) as noballs,
        SUM(CASE WHEN extra_type = 'bye' THEN extra_runs ELSE 0 END) as byes,
        SUM(CASE WHEN extra_type = 'legbye' THEN extra_runs ELSE 0 END) as legbyes,
        SUM(extra_runs) as total_extras
       FROM cricket_ball_by_ball
       WHERE match_id = $1
       GROUP BY innings_number
       ORDER BY innings_number`,
      [matchId]
    )

    // query() returns an array directly
    return NextResponse.json(
      {
        batting: Array.isArray(battingStats) ? battingStats : [],
        bowling: Array.isArray(bowlingStats) ? bowlingStats : [],
        fallOfWickets: Array.isArray(fallOfWickets) ? fallOfWickets : [],
        config: Array.isArray(config) && config.length > 0 ? config[0] : null,
        summary: Array.isArray(summary) && summary.length > 0 ? summary[0] : null,
        extras: Array.isArray(extras) ? extras : [],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching scorecard:", error)
    return NextResponse.json(
      { error: "Failed to fetch scorecard data" },
      { status: 500 }
    )
  }
}

