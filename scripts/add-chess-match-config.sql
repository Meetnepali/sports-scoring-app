-- ============================================================================
-- Migration: Chess Match Configuration System
-- ============================================================================
-- This script adds chess match configuration capabilities including:
-- - Match configuration (toss, color selection, side)
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: Chess Match Configuration Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS chess_match_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  toss_winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  toss_decision VARCHAR(20) CHECK (toss_decision IN ('color', 'side')),
  selected_color VARCHAR(10) CHECK (selected_color IN ('white', 'black')),
  white_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  config_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chess_match_config_match_id ON chess_match_config(match_id);

-- ============================================================================
-- PART 2: Trigger for updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_chess_match_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chess_match_config_updated_at
  BEFORE UPDATE ON chess_match_config
  FOR EACH ROW
  EXECUTE FUNCTION update_chess_match_config_updated_at();

COMMIT;

