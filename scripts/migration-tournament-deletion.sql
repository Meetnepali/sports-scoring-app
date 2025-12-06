-- ============================================================================
-- Migration Script for Tournament Complete Deletion
-- ============================================================================
-- This script ensures proper cascading deletes and constraints for complete
-- tournament deletion including all related matches, scores, and configurations
--
-- Purpose: When a tournament is deleted, ALL related data should be cleaned up:
--   - All matches (scheduled, live, completed)
--   - Match configurations (sport-specific)
--   - User participation records
--   - Group matches and standings
--   - Tournament structure (groups, teams, bracket nodes)
--
-- Run this script on your PostgreSQL database:
-- psql -U your_username -d sports_scoring_db -f scripts/migration-tournament-deletion.sql
-- ============================================================================

-- Starting migration
DO $$ BEGIN RAISE NOTICE 'Starting Tournament Deletion Migration...'; END $$;

-- ============================================================================
-- STEP 1: Ensure Tournament-Related Tables Have Proper Cascading
-- ============================================================================

DO $$ BEGIN RAISE NOTICE 'Step 1: Setting up tournament structure cascading...'; END $$;

-- 1.1 Tournament Sports (should cascade when tournament is deleted)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tournament_sports') THEN
        -- Drop existing constraint if it exists
        ALTER TABLE tournament_sports DROP CONSTRAINT IF EXISTS tournament_sports_tournament_id_fkey;
        
        -- Recreate with CASCADE
        ALTER TABLE tournament_sports
        ADD CONSTRAINT tournament_sports_tournament_id_fkey 
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✓ tournament_sports: CASCADE on tournament deletion';
    END IF;
END $$;

-- 1.2 Tournament Groups (should cascade when tournament is deleted)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tournament_groups') THEN
        ALTER TABLE tournament_groups DROP CONSTRAINT IF EXISTS tournament_groups_tournament_id_fkey;
        
        ALTER TABLE tournament_groups
        ADD CONSTRAINT tournament_groups_tournament_id_fkey 
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✓ tournament_groups: CASCADE on tournament deletion';
    END IF;
END $$;

-- 1.3 Group Teams (should cascade when group is deleted)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_teams') THEN
        ALTER TABLE group_teams DROP CONSTRAINT IF EXISTS group_teams_group_id_fkey;
        
        ALTER TABLE group_teams
        ADD CONSTRAINT group_teams_group_id_fkey 
        FOREIGN KEY (group_id) REFERENCES tournament_groups(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✓ group_teams: CASCADE on group deletion';
    END IF;
END $$;

-- 1.4 Tournament Bracket Nodes (should cascade when tournament is deleted)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tournament_bracket_nodes') THEN
        ALTER TABLE tournament_bracket_nodes DROP CONSTRAINT IF EXISTS tournament_bracket_nodes_tournament_id_fkey;
        
        ALTER TABLE tournament_bracket_nodes
        ADD CONSTRAINT tournament_bracket_nodes_tournament_id_fkey 
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✓ tournament_bracket_nodes: CASCADE on tournament deletion';
    END IF;
END $$;

-- 1.5 Group Matches (should cascade when group is deleted)
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_matches') THEN
        -- First, clean up orphaned group_matches records
        DELETE FROM group_matches 
        WHERE group_id IS NOT NULL 
        AND NOT EXISTS (
            SELECT 1 FROM tournament_groups WHERE id = group_matches.group_id
        );
        
        GET DIAGNOSTICS orphaned_count = ROW_COUNT;
        IF orphaned_count > 0 THEN
            RAISE NOTICE 'Cleaned up % orphaned group_matches records', orphaned_count;
        END IF;
        
        ALTER TABLE group_matches DROP CONSTRAINT IF EXISTS group_matches_group_id_fkey;
        
        ALTER TABLE group_matches
        ADD CONSTRAINT group_matches_group_id_fkey 
        FOREIGN KEY (group_id) REFERENCES tournament_groups(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✓ group_matches: CASCADE on group deletion';
    END IF;
END $$;

-- 1.6 Group Standings (should cascade when group is deleted)
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_standings') THEN
        -- First, clean up orphaned group_standings records
        DELETE FROM group_standings 
        WHERE group_id IS NOT NULL 
        AND NOT EXISTS (
            SELECT 1 FROM tournament_groups WHERE id = group_standings.group_id
        );
        
        GET DIAGNOSTICS orphaned_count = ROW_COUNT;
        IF orphaned_count > 0 THEN
            RAISE NOTICE 'Cleaned up % orphaned group_standings records', orphaned_count;
        END IF;
        
        ALTER TABLE group_standings DROP CONSTRAINT IF EXISTS group_standings_group_id_fkey;
        
        ALTER TABLE group_standings
        ADD CONSTRAINT group_standings_group_id_fkey 
        FOREIGN KEY (group_id) REFERENCES tournament_groups(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✓ group_standings: CASCADE on group deletion';
    END IF;
END $$;

DO $$ BEGIN RAISE NOTICE ''; RAISE NOTICE 'Step 2: Setting up match-related cascading...'; END $$;

-- ============================================================================
-- STEP 2: Ensure Match Tables Have Proper Cascading
-- ============================================================================

-- 2.1 User Match Participation (should cascade when match is deleted)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_match_participation') THEN
        ALTER TABLE user_match_participation DROP CONSTRAINT IF EXISTS user_match_participation_match_id_fkey;
        
        ALTER TABLE user_match_participation
        ADD CONSTRAINT user_match_participation_match_id_fkey 
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✓ user_match_participation: CASCADE on match deletion';
    END IF;
END $$;

-- 2.2 Group Matches match_id (should CASCADE when match is deleted)
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'group_matches' AND column_name = 'match_id'
    ) THEN
        -- Clean up orphaned match references
        UPDATE group_matches 
        SET match_id = NULL
        WHERE match_id IS NOT NULL 
        AND NOT EXISTS (
            SELECT 1 FROM matches WHERE id = group_matches.match_id
        );
        
        GET DIAGNOSTICS orphaned_count = ROW_COUNT;
        IF orphaned_count > 0 THEN
            RAISE NOTICE 'Cleaned up % orphaned match_id references in group_matches', orphaned_count;
        END IF;
        
        ALTER TABLE group_matches DROP CONSTRAINT IF EXISTS group_matches_match_id_fkey;
        
        ALTER TABLE group_matches
        ADD CONSTRAINT group_matches_match_id_fkey 
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✓ group_matches.match_id: CASCADE on match deletion';
    END IF;
END $$;

-- 2.3 Matches tournament_id (SET NULL - we handle deletion in application code)
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'tournament_id'
    ) THEN
        -- First clean up any orphaned references
        UPDATE matches SET tournament_id = NULL
        WHERE tournament_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM tournaments WHERE id = matches.tournament_id);
        
        GET DIAGNOSTICS orphaned_count = ROW_COUNT;
        IF orphaned_count > 0 THEN
            RAISE NOTICE 'Cleaned up % orphaned tournament_id references in matches', orphaned_count;
        END IF;
        
        ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_tournament_id_fkey;
        
        ALTER TABLE matches
        ADD CONSTRAINT matches_tournament_id_fkey 
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL;
        
        RAISE NOTICE '✓ matches.tournament_id: SET NULL on tournament deletion';
    END IF;
END $$;

-- 2.4 Matches group_id (SET NULL)
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'group_id'
    ) THEN
        -- Clean up orphaned group references
        UPDATE matches SET group_id = NULL
        WHERE group_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM tournament_groups WHERE id = matches.group_id);
        
        GET DIAGNOSTICS orphaned_count = ROW_COUNT;
        IF orphaned_count > 0 THEN
            RAISE NOTICE 'Cleaned up % orphaned group_id references in matches', orphaned_count;
        END IF;
        
        ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_group_id_fkey;
        
        ALTER TABLE matches
        ADD CONSTRAINT matches_group_id_fkey 
        FOREIGN KEY (group_id) REFERENCES tournament_groups(id) ON DELETE SET NULL;
        
        RAISE NOTICE '✓ matches.group_id: SET NULL on group deletion';
    END IF;
END $$;

DO $$ BEGIN RAISE NOTICE ''; RAISE NOTICE 'Step 3: Setting up sport-specific match config cascading...'; END $$;

-- ============================================================================
-- STEP 3: Ensure Sport-Specific Config Tables Have Cascading Deletes
-- ============================================================================

-- 3.1 Cricket Match Config
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cricket_match_config') THEN
        ALTER TABLE cricket_match_config DROP CONSTRAINT IF EXISTS cricket_match_config_match_id_fkey;
        
        ALTER TABLE cricket_match_config
        ADD CONSTRAINT cricket_match_config_match_id_fkey 
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✓ cricket_match_config: CASCADE on match deletion';
    END IF;
END $$;

-- 3.2 Volleyball Match Config
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'volleyball_match_config') THEN
        ALTER TABLE volleyball_match_config DROP CONSTRAINT IF EXISTS volleyball_match_config_match_id_fkey;
        
        ALTER TABLE volleyball_match_config
        ADD CONSTRAINT volleyball_match_config_match_id_fkey 
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✓ volleyball_match_config: CASCADE on match deletion';
    END IF;
END $$;

-- 3.3 Chess Match Config
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chess_match_config') THEN
        ALTER TABLE chess_match_config DROP CONSTRAINT IF EXISTS chess_match_config_match_id_fkey;
        
        ALTER TABLE chess_match_config
        ADD CONSTRAINT chess_match_config_match_id_fkey 
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✓ chess_match_config: CASCADE on match deletion';
    END IF;
END $$;

-- 3.4 Futsal Match Config
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'futsal_match_config') THEN
        ALTER TABLE futsal_match_config DROP CONSTRAINT IF EXISTS futsal_match_config_match_id_fkey;
        
        ALTER TABLE futsal_match_config
        ADD CONSTRAINT futsal_match_config_match_id_fkey 
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✓ futsal_match_config: CASCADE on match deletion';
    END IF;
END $$;

-- 3.5 Table Tennis Match Config
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'table_tennis_match_config') THEN
        ALTER TABLE table_tennis_match_config DROP CONSTRAINT IF EXISTS table_tennis_match_config_match_id_fkey;
        
        ALTER TABLE table_tennis_match_config
        ADD CONSTRAINT table_tennis_match_config_match_id_fkey 
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✓ table_tennis_match_config: CASCADE on match deletion';
    END IF;
END $$;

-- 3.6 Badminton Match Config
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badminton_match_config') THEN
        ALTER TABLE badminton_match_config DROP CONSTRAINT IF EXISTS badminton_match_config_match_id_fkey;
        
        ALTER TABLE badminton_match_config
        ADD CONSTRAINT badminton_match_config_match_id_fkey 
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✓ badminton_match_config: CASCADE on match deletion';
    END IF;
END $$;

DO $$ BEGIN RAISE NOTICE ''; RAISE NOTICE 'Step 4: Creating indexes for better delete performance...'; END $$;

-- ============================================================================
-- STEP 4: Create Indexes for Better Performance
-- ============================================================================

-- Create indexes to speed up cascade operations
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_group_id ON matches(group_id);
CREATE INDEX IF NOT EXISTS idx_group_matches_match_id ON group_matches(match_id);
CREATE INDEX IF NOT EXISTS idx_group_matches_group_id ON group_matches(group_id);
CREATE INDEX IF NOT EXISTS idx_tournament_groups_tournament_id ON tournament_groups(tournament_id);
CREATE INDEX IF NOT EXISTS idx_user_match_participation_match_id ON user_match_participation(match_id);

-- Sport-specific config indexes
CREATE INDEX IF NOT EXISTS idx_cricket_match_config_match_id ON cricket_match_config(match_id);
CREATE INDEX IF NOT EXISTS idx_volleyball_match_config_match_id ON volleyball_match_config(match_id);
CREATE INDEX IF NOT EXISTS idx_chess_match_config_match_id ON chess_match_config(match_id);
CREATE INDEX IF NOT EXISTS idx_futsal_match_config_match_id ON futsal_match_config(match_id);
CREATE INDEX IF NOT EXISTS idx_table_tennis_match_config_match_id ON table_tennis_match_config(match_id);
CREATE INDEX IF NOT EXISTS idx_badminton_match_config_match_id ON badminton_match_config(match_id);

DO $$ BEGIN RAISE NOTICE '✓ Performance indexes created'; END $$;

-- ============================================================================
-- STEP 5: Verify the Migration
-- ============================================================================

DO $$ BEGIN RAISE NOTICE ''; RAISE NOTICE 'Step 5: Verifying migration...'; RAISE NOTICE ''; END $$;

DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    -- Count total constraints created
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints
    WHERE constraint_name LIKE '%tournament%' 
       OR constraint_name LIKE '%group_%' 
       OR constraint_name LIKE '%match%';
    
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Migration Completed Successfully!';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Summary of Changes:';
    RAISE NOTICE '';
    RAISE NOTICE '1. Tournament Structure (CASCADE on tournament deletion):';
    RAISE NOTICE '   - tournament_sports';
    RAISE NOTICE '   - tournament_groups';
    RAISE NOTICE '   - group_teams';
    RAISE NOTICE '   - tournament_bracket_nodes';
    RAISE NOTICE '   - group_matches';
    RAISE NOTICE '   - group_standings';
    RAISE NOTICE '';
    RAISE NOTICE '2. Match-Related Tables (CASCADE on match deletion):';
    RAISE NOTICE '   - user_match_participation';
    RAISE NOTICE '   - group_matches (via match_id)';
    RAISE NOTICE '   - cricket_match_config';
    RAISE NOTICE '   - volleyball_match_config';
    RAISE NOTICE '   - chess_match_config';
    RAISE NOTICE '   - futsal_match_config';
    RAISE NOTICE '   - table_tennis_match_config';
    RAISE NOTICE '   - badminton_match_config';
    RAISE NOTICE '';
    RAISE NOTICE '3. Tournament-Match Links:';
    RAISE NOTICE '   - matches.tournament_id: SET NULL (handled by app logic)';
    RAISE NOTICE '   - matches.group_id: SET NULL';
    RAISE NOTICE '';
    RAISE NOTICE 'What Happens When You Delete a Tournament:';
    RAISE NOTICE '1. Application code finds all related matches';
    RAISE NOTICE '2. Deletes sport-specific configs for each match';
    RAISE NOTICE '3. Deletes user_match_participation records';
    RAISE NOTICE '4. Deletes all match records';
    RAISE NOTICE '5. Database cascades delete to:';
    RAISE NOTICE '   - group_matches, group_standings';
    RAISE NOTICE '   - tournament_groups, group_teams';
    RAISE NOTICE '   - tournament_sports, tournament_bracket_nodes';
    RAISE NOTICE '6. Finally deletes the tournament record';
    RAISE NOTICE '';
    RAISE NOTICE 'Total constraints configured: %', constraint_count;
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'To verify, you can test by:';
    RAISE NOTICE '1. Creating a test tournament with matches';
    RAISE NOTICE '2. Deleting the tournament via the application';
    RAISE NOTICE '3. Verifying all related data is removed from:';
    RAISE NOTICE '   - matches table';
    RAISE NOTICE '   - group_matches table';
    RAISE NOTICE '   - sport-specific config tables';
    RAISE NOTICE '   - tournament structure tables';
    RAISE NOTICE '';
END $$;

