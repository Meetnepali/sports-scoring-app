-- ============================================================================
-- Migration: Volleyball Match Configuration System
-- ============================================================================
-- This script adds volleyball match configuration capabilities including:
-- - Match configuration (toss, sets, court side, serving)
-- - Number of sets selection (Best of 3 or Best of 5)
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: Volleyball Match Configuration Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS volleyball_match_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  number_of_sets INTEGER NOT NULL CHECK (number_of_sets IN (3, 5)),
  toss_winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  toss_decision VARCHAR(20) CHECK (toss_decision IN ('court_side', 'serve')),
  selected_court_side VARCHAR(10) CHECK (selected_court_side IN ('home', 'away')),
  serving_team VARCHAR(10) CHECK (serving_team IN ('home', 'away')),
  config_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_volleyball_match_config_match_id ON volleyball_match_config(match_id);

-- ============================================================================
-- PART 2: Trigger for updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_volleyball_match_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_volleyball_match_config_updated_at
  BEFORE UPDATE ON volleyball_match_config
  FOR EACH ROW
  EXECUTE FUNCTION update_volleyball_match_config_updated_at();

COMMIT;

