import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAdmin } from "@/lib/authorization"

// POST - Record a ball
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck) {
    return adminCheck
  }

  try {
    const { id: matchId } = await params
    const body = await request.json()

    const {
      inningsNumber,
      overNumber,
      ballNumber,
      bowlerId,
      batsmanStrikerId,
      batsmanNonStrikerId,
      runsScored,
      extraType,
      extraRuns,
      isWicket,
      wicketType,
      wicketPlayerId,
    } = body

    // Validate required fields
    if (
      inningsNumber === undefined ||
      overNumber === undefined ||
      ballNumber === undefined ||
      !bowlerId ||
      !batsmanStrikerId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate extra_type if provided
    const validExtraTypes = ['wide', 'noball', 'bye', 'legbye']
    if (extraType && !validExtraTypes.includes(extraType)) {
      return NextResponse.json(
        { error: `Invalid extra type: ${extraType}. Must be one of: ${validExtraTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate wicket_type if wicket is taken
    const validWicketTypes = ['bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket', 'caught_and_bowled', 'retired_hurt', 'obstructing_field', 'hit_ball_twice', 'timed_out']
    if (isWicket && wicketType && !validWicketTypes.includes(wicketType)) {
      return NextResponse.json(
        { error: `Invalid wicket type: ${wicketType}. Must be one of: ${validWicketTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Normalize wicket_type: if "out" is sent, convert to "bowled" as default
    const normalizedWicketType = isWicket && wicketType === "out" ? "bowled" : (isWicket ? wicketType : null)

    // Record the ball
    const ballResult = await query(
      `INSERT INTO cricket_ball_by_ball 
        (match_id, innings_number, over_number, ball_number, bowler_id, 
         batsman_striker_id, batsman_non_striker_id, runs_scored, extra_type, 
         extra_runs, is_wicket, wicket_type, wicket_player_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        matchId,
        inningsNumber,
        overNumber,
        ballNumber,
        bowlerId,
        batsmanStrikerId,
        batsmanNonStrikerId || null,
        runsScored || 0,
        extraType || null,
        extraRuns || 0,
        isWicket || false,
        normalizedWicketType,
        wicketPlayerId || null,
      ]
    )

    // Update or create batting statistics for striker
    const totalRuns = runsScored || 0
    const isFour = totalRuns === 4
    const isSix = totalRuns === 6
    const isLegalBall = !extraType || extraType === "bye" || extraType === "legbye"

    await query(
      `INSERT INTO cricket_player_innings 
        (match_id, player_id, innings_number, runs_scored, balls_faced, fours, sixes, is_out, wicket_type, is_batting)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (match_id, player_id, innings_number)
       DO UPDATE SET
         runs_scored = cricket_player_innings.runs_scored + $4,
         balls_faced = cricket_player_innings.balls_faced + $5,
         fours = cricket_player_innings.fours + $6,
         sixes = cricket_player_innings.sixes + $7,
         is_out = CASE WHEN $8 THEN true ELSE cricket_player_innings.is_out END,
         wicket_type = CASE WHEN $8 THEN $9 ELSE cricket_player_innings.wicket_type END,
         strike_rate = CASE 
           WHEN (cricket_player_innings.balls_faced + $5) > 0 
           THEN ((cricket_player_innings.runs_scored + $4)::DECIMAL / (cricket_player_innings.balls_faced + $5)::DECIMAL) * 100
           ELSE 0 
         END,
         updated_at = CURRENT_TIMESTAMP`,
      [
        matchId,
        batsmanStrikerId,
        inningsNumber,
        extraType === "bye" || extraType === "legbye" ? 0 : totalRuns,
        isLegalBall ? 1 : 0,
        isFour ? 1 : 0,
        isSix ? 1 : 0,
        isWicket && wicketPlayerId === batsmanStrikerId,
        normalizedWicketType,
        true,
      ]
    )

    // Update non-striker as batting if provided
    if (batsmanNonStrikerId) {
      await query(
        `INSERT INTO cricket_player_innings 
          (match_id, player_id, innings_number, is_batting)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (match_id, player_id, innings_number)
         DO UPDATE SET is_batting = true`,
        [matchId, batsmanNonStrikerId, inningsNumber]
      )
    }

    // Mark wicket player as out
    if (isWicket && wicketPlayerId) {
      await query(
        `UPDATE cricket_player_innings 
         SET is_out = true, wicket_type = $1, is_batting = false, updated_at = CURRENT_TIMESTAMP
         WHERE match_id = $2 AND player_id = $3 AND innings_number = $4`,
        [normalizedWicketType, matchId, wicketPlayerId, inningsNumber]
      )
    }

    // Update bowling statistics
    const ballsForOver = isLegalBall ? 1 : 0
    const runsForBowler = totalRuns + (extraRuns || 0)

    await query(
      `INSERT INTO cricket_player_bowling 
        (match_id, player_id, innings_number, overs_bowled, runs_conceded, wickets_taken, is_bowling)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (match_id, player_id, innings_number)
       DO UPDATE SET
         overs_bowled = cricket_player_bowling.overs_bowled + $4,
         runs_conceded = cricket_player_bowling.runs_conceded + $5,
         wickets_taken = cricket_player_bowling.wickets_taken + $6,
         economy_rate = CASE 
           WHEN (cricket_player_bowling.overs_bowled + $4) > 0 
           THEN (cricket_player_bowling.runs_conceded + $5)::DECIMAL / 
                (FLOOR((cricket_player_bowling.overs_bowled + $4) * 10) / 10 / 6 * 10)
           ELSE 0 
         END,
         is_bowling = true,
         updated_at = CURRENT_TIMESTAMP`,
      [
        matchId,
        bowlerId,
        inningsNumber,
        ballsForOver > 0 ? ballsForOver / 10.0 : 0,
        runsForBowler,
        isWicket ? 1 : 0,
      ]
    )

    // query() returns an array directly
    if (!ballResult || !Array.isArray(ballResult) || ballResult.length === 0) {
      return NextResponse.json(
        { error: "Failed to record ball" },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      {
        success: true,
        ball: ballResult[0],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error recording ball:", error)
    return NextResponse.json(
      { error: "Failed to record ball" },
      { status: 500 }
    )
  }
}

// GET - Fetch all balls for a match
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params
    const { searchParams } = new URL(request.url)
    const inningsNumber = searchParams.get("innings")

    let queryText = `
      SELECT 
        cbb.*,
        p1.name as bowler_name,
        p2.name as striker_name,
        p3.name as non_striker_name,
        p4.name as wicket_player_name
      FROM cricket_ball_by_ball cbb
      LEFT JOIN players p1 ON cbb.bowler_id = p1.id
      LEFT JOIN players p2 ON cbb.batsman_striker_id = p2.id
      LEFT JOIN players p3 ON cbb.batsman_non_striker_id = p3.id
      LEFT JOIN players p4 ON cbb.wicket_player_id = p4.id
      WHERE cbb.match_id = $1
    `
    
    const queryParams: any[] = [matchId]

    if (inningsNumber) {
      queryText += ` AND cbb.innings_number = $2`
      queryParams.push(parseInt(inningsNumber))
    }

    queryText += ` ORDER BY cbb.innings_number, cbb.over_number, cbb.ball_number`

    const result = await query(queryText, queryParams)

    // query() returns an array directly
    return NextResponse.json({ balls: Array.isArray(result) ? result : [] }, { status: 200 })
  } catch (error) {
    console.error("Error fetching balls:", error)
    return NextResponse.json(
      { error: "Failed to fetch ball data" },
      { status: 500 }
    )
  }
}

