-- ============================================================================
-- Migration: Add Set/Game Types Support for Badminton and Table Tennis
-- ============================================================================
-- This script adds support for storing singles/doubles type for each set/game
-- in badminton and table tennis matches. The data is stored in the score JSON
-- field, so no schema changes are needed. This script is for documentation.
-- ============================================================================

BEGIN;

-- Note: Set/Game types are stored in the score JSON field as part of each
-- set/game object. The structure will be:
-- For Badminton:
--   score.games = [{ home: 0, away: 0, type: "singles" | "doubles" }, ...]
-- For Table Tennis:
--   score.sets = [{ home: 0, away: 0, type: "singles" | "doubles" }, ...]

-- No database schema changes needed as we're using JSON fields
-- The application code will handle the type field in the score JSON

COMMIT;

