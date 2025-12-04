-- ============================================================================
-- Migration: Futsal Match Configuration System
-- ============================================================================
-- This script adds futsal match configuration capabilities including:
-- - Match configuration (toss, side selection, kick off)
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: Futsal Match Configuration Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS futsal_match_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  toss_winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  toss_decision VARCHAR(20) CHECK (toss_decision IN ('kick_off', 'side')),
  selected_side VARCHAR(10) CHECK (selected_side IN ('home', 'away')),
  kicking_off_team VARCHAR(10) CHECK (kicking_off_team IN ('home', 'away')),
  config_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_futsal_match_config_match_id ON futsal_match_config(match_id);

-- ============================================================================
-- PART 2: Trigger for updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_futsal_match_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_futsal_match_config_updated_at
  BEFORE UPDATE ON futsal_match_config
  FOR EACH ROW
  EXECUTE FUNCTION update_futsal_match_config_updated_at();

COMMIT;

