-- Migration script to add badminton and table tennis config tables
-- Run this script to add the configuration tables for badminton and table tennis matches

-- Create badminton_match_config table
CREATE TABLE IF NOT EXISTS badminton_match_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  games_to_win INTEGER DEFAULT 2,
  points_to_win_per_game INTEGER DEFAULT 21,
  number_of_matches INTEGER DEFAULT 3,
  sets_per_match INTEGER DEFAULT 2,
  match_types JSONB,
  toss_winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  toss_decision VARCHAR(50),
  selected_court_side VARCHAR(50),
  serving_team VARCHAR(50),
  config_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table_tennis_match_config table
CREATE TABLE IF NOT EXISTS table_tennis_match_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  sets_to_win INTEGER DEFAULT 2,
  points_to_win_per_set INTEGER DEFAULT 11,
  number_of_matches INTEGER DEFAULT 3,
  sets_per_match INTEGER DEFAULT 2,
  match_types JSONB,
  toss_winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  toss_decision VARCHAR(50),
  selected_table_side VARCHAR(50),
  serving_team VARCHAR(50),
  config_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_badminton_config_match_id ON badminton_match_config(match_id);
CREATE INDEX IF NOT EXISTS idx_table_tennis_config_match_id ON table_tennis_match_config(match_id);
