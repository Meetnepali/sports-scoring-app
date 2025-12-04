-- ============================================================================
-- Migration: Tournament Completion Check Optimization
-- ============================================================================
-- This script adds indexes to optimize tournament completion checks.
-- These indexes improve performance when filtering tournaments that are
-- fully set up with all fixtures.
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: Indexes for Tournament Completion Queries
-- ============================================================================

-- Index on tournament_sports.tournament_id for checking if tournament has sports
CREATE INDEX IF NOT EXISTS idx_tournament_sports_tournament_id 
ON tournament_sports(tournament_id);

-- Index on tournament_groups.tournament_id for checking if tournament has groups
CREATE INDEX IF NOT EXISTS idx_tournament_groups_tournament_id 
ON tournament_groups(tournament_id);

-- Index on group_teams.group_id for checking if groups have teams
CREATE INDEX IF NOT EXISTS idx_group_teams_group_id 
ON group_teams(group_id);

-- Index on group_matches.group_id for checking if groups have fixtures
CREATE INDEX IF NOT EXISTS idx_group_matches_group_id 
ON group_matches(group_id);

-- Composite index for tournament_groups queries with tournament_id
CREATE INDEX IF NOT EXISTS idx_tournament_groups_tournament_sport 
ON tournament_groups(tournament_id, sport);

-- ============================================================================
-- PART 2: Optional - Add computed column for tournament completion status
-- ============================================================================
-- Uncomment below if you want to add a materialized completion status column
-- This would require a trigger to update it when fixtures are added/removed

-- ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS fixtures_complete BOOLEAN DEFAULT FALSE;
-- 
-- CREATE OR REPLACE FUNCTION update_tournament_completion_status()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   UPDATE tournaments
--   SET fixtures_complete = (
--     EXISTS (SELECT 1 FROM tournament_sports WHERE tournament_id = tournaments.id)
--     AND EXISTS (SELECT 1 FROM tournament_groups WHERE tournament_id = tournaments.id)
--     AND NOT EXISTS (
--       SELECT 1 FROM tournament_groups tg
--       WHERE tg.tournament_id = tournaments.id
--       AND NOT EXISTS (SELECT 1 FROM group_teams WHERE group_id = tg.id)
--     )
--     AND NOT EXISTS (
--       SELECT 1 FROM tournament_groups tg
--       WHERE tg.tournament_id = tournaments.id
--       AND NOT EXISTS (SELECT 1 FROM group_matches WHERE group_id = tg.id)
--     )
--   )
--   WHERE id = (
--     SELECT tournament_id FROM tournament_groups WHERE id = COALESCE(NEW.group_id, OLD.group_id)
--   );
--   RETURN COALESCE(NEW, OLD);
-- END;
-- $$ LANGUAGE plpgsql;
-- 
-- DROP TRIGGER IF EXISTS trigger_update_tournament_completion_on_group_teams;
-- CREATE TRIGGER trigger_update_tournament_completion_on_group_teams
-- AFTER INSERT OR DELETE ON group_teams
-- FOR EACH ROW EXECUTE FUNCTION update_tournament_completion_status();
-- 
-- DROP TRIGGER IF EXISTS trigger_update_tournament_completion_on_group_matches;
-- CREATE TRIGGER trigger_update_tournament_completion_on_group_matches
-- AFTER INSERT OR DELETE ON group_matches
-- FOR EACH ROW EXECUTE FUNCTION update_tournament_completion_status();

-- ============================================================================
-- PART 3: Verify Indexes Created
-- ============================================================================

-- Run these queries to verify indexes were created:
-- SELECT indexname, tablename 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- AND indexname LIKE 'idx_%tournament%' OR indexname LIKE 'idx_group%'
-- ORDER BY tablename, indexname;

COMMIT;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Next Steps:
-- 1. Run this migration: psql $DATABASE_URL -f scripts/add-tournament-completion-indexes.sql
-- 2. Verify indexes created: \di idx_*tournament* and \di idx_group*
-- 3. The getAllTournamentsFromDB() function will now use these indexes for faster queries
-- ============================================================================

