-- ============================================================================
-- Migration: Add Sets Configuration to Table Tennis Match Config
-- ============================================================================
-- This script adds sets configuration fields to table_tennis_match_config table
-- ============================================================================

BEGIN;

-- Add sets configuration columns
ALTER TABLE table_tennis_match_config
ADD COLUMN IF NOT EXISTS sets_to_win INTEGER DEFAULT 2 CHECK (sets_to_win IN (2, 3, 4)),
ADD COLUMN IF NOT EXISTS points_to_win_per_set INTEGER DEFAULT 11 CHECK (points_to_win_per_set IN (11, 21));

COMMIT;

