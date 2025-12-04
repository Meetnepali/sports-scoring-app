-- ============================================================================
-- Migration: Add Games Configuration to Badminton Match Config
-- ============================================================================
-- This script adds games configuration fields to badminton_match_config table
-- ============================================================================

BEGIN;

-- Add games configuration columns
ALTER TABLE badminton_match_config
ADD COLUMN IF NOT EXISTS games_to_win INTEGER DEFAULT 2 CHECK (games_to_win IN (2, 3)),
ADD COLUMN IF NOT EXISTS points_to_win_per_game INTEGER DEFAULT 21 CHECK (points_to_win_per_game IN (11, 15, 21));

COMMIT;

