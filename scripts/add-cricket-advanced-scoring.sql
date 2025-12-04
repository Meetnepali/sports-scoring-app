-- ============================================================================
-- Migration: Advanced Cricket Scoring System
-- ============================================================================
-- This script adds comprehensive cricket scoring capabilities including:
-- - Match configuration (toss, overs, bowler restrictions)
-- - Ball-by-ball tracking
-- - Player batting and bowling statistics
-- - Match summary and man of the match
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: Cricket Match Configuration Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS cricket_match_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  total_overs INTEGER NOT NULL,
  max_overs_per_bowler INTEGER NOT NULL,
  toss_winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  toss_decision VARCHAR(10) CHECK (toss_decision IN ('bat', 'bowl')),
  elected_to_bat_first_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  config_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PART 2: Ball-by-Ball Tracking Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS cricket_ball_by_ball (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  innings_number INTEGER NOT NULL CHECK (innings_number IN (1, 2)),
  over_number INTEGER NOT NULL,
  ball_number INTEGER NOT NULL CHECK (ball_number BETWEEN 1 AND 6),
  bowler_id UUID REFERENCES players(id) ON DELETE SET NULL,
  batsman_striker_id UUID REFERENCES players(id) ON DELETE SET NULL,
  batsman_non_striker_id UUID REFERENCES players(id) ON DELETE SET NULL,
  runs_scored INTEGER DEFAULT 0,
  extra_type VARCHAR(20) CHECK (extra_type IN ('wide', 'noball', 'bye', 'legbye')),
  extra_runs INTEGER DEFAULT 0,
  is_wicket BOOLEAN DEFAULT FALSE,
  wicket_type VARCHAR(30) CHECK (wicket_type IN ('bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket', 'caught_and_bowled', 'retired_hurt', 'obstructing_field', 'hit_ball_twice', 'timed_out')),
  wicket_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PART 3: Player Batting Statistics Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS cricket_player_innings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  innings_number INTEGER NOT NULL CHECK (innings_number IN (1, 2)),
  runs_scored INTEGER DEFAULT 0,
  balls_faced INTEGER DEFAULT 0,
  fours INTEGER DEFAULT 0,
  sixes INTEGER DEFAULT 0,
  strike_rate DECIMAL(6,2) DEFAULT 0.00,
  is_out BOOLEAN DEFAULT FALSE,
  wicket_type VARCHAR(30),
  is_batting BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(match_id, player_id, innings_number)
);

-- ============================================================================
-- PART 4: Player Bowling Statistics Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS cricket_player_bowling (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  innings_number INTEGER NOT NULL CHECK (innings_number IN (1, 2)),
  overs_bowled DECIMAL(4,1) DEFAULT 0.0,
  runs_conceded INTEGER DEFAULT 0,
  wickets_taken INTEGER DEFAULT 0,
  maidens INTEGER DEFAULT 0,
  economy_rate DECIMAL(5,2) DEFAULT 0.00,
  is_bowling BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(match_id, player_id, innings_number)
);

-- ============================================================================
-- PART 5: Match Summary Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS cricket_match_summary (
  match_id UUID PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
  winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  win_margin VARCHAR(100),
  man_of_match_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  match_status VARCHAR(20) DEFAULT 'in_progress' CHECK (match_status IN ('in_progress', 'completed', 'abandoned', 'tie')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PART 6: Create Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cricket_match_config_match_id ON cricket_match_config(match_id);
CREATE INDEX IF NOT EXISTS idx_cricket_ball_match_id ON cricket_ball_by_ball(match_id);
CREATE INDEX IF NOT EXISTS idx_cricket_ball_innings ON cricket_ball_by_ball(match_id, innings_number);
CREATE INDEX IF NOT EXISTS idx_cricket_ball_bowler ON cricket_ball_by_ball(bowler_id);
CREATE INDEX IF NOT EXISTS idx_cricket_ball_batsman ON cricket_ball_by_ball(batsman_striker_id);
CREATE INDEX IF NOT EXISTS idx_cricket_player_innings_match ON cricket_player_innings(match_id, innings_number);
CREATE INDEX IF NOT EXISTS idx_cricket_player_innings_player ON cricket_player_innings(player_id);
CREATE INDEX IF NOT EXISTS idx_cricket_player_bowling_match ON cricket_player_bowling(match_id, innings_number);
CREATE INDEX IF NOT EXISTS idx_cricket_player_bowling_player ON cricket_player_bowling(player_id);
CREATE INDEX IF NOT EXISTS idx_cricket_summary_match ON cricket_match_summary(match_id);
CREATE INDEX IF NOT EXISTS idx_cricket_summary_winner ON cricket_match_summary(winner_team_id);

COMMIT;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Next Steps:
-- 1. Run this migration: psql $DATABASE_URL -f scripts/add-cricket-advanced-scoring.sql
-- 2. Verify tables created: \dt cricket_*
-- 3. Start implementing API routes and components
-- ============================================================================

