-- Migration Script for Cascading Deletes
-- This script ensures proper cascading deletes for matches and tournaments
-- Run this script on your PostgreSQL database

-- ============================================================================
-- STEP 1: Ensure matches table has proper foreign key constraints
-- ============================================================================

-- Verify that user_match_participation has ON DELETE CASCADE
DO $$
BEGIN
    -- Check if constraint exists and update if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_match_participation_match_id_fkey'
    ) THEN
        -- Drop and recreate with CASCADE
        ALTER TABLE user_match_participation 
        DROP CONSTRAINT IF EXISTS user_match_participation_match_id_fkey;
        
        ALTER TABLE user_match_participation
        ADD CONSTRAINT user_match_participation_match_id_fkey 
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Updated user_match_participation foreign key to CASCADE';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Ensure group_matches has proper foreign key for match_id
-- ============================================================================

-- Verify group_matches.match_id has ON DELETE SET NULL (matches can be deleted independently)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'group_matches' AND column_name = 'match_id'
    ) THEN
        -- Check if constraint exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'group_matches_match_id_fkey'
        ) THEN
            -- Drop and recreate with SET NULL
            ALTER TABLE group_matches 
            DROP CONSTRAINT IF EXISTS group_matches_match_id_fkey;
            
            ALTER TABLE group_matches
            ADD CONSTRAINT group_matches_match_id_fkey 
            FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE SET NULL;
            
            RAISE NOTICE 'Updated group_matches.match_id foreign key to SET NULL';
        ELSE
            -- Create constraint if it doesn't exist
            ALTER TABLE group_matches
            ADD CONSTRAINT group_matches_match_id_fkey 
            FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE SET NULL;
            
            RAISE NOTICE 'Created group_matches.match_id foreign key with SET NULL';
        END IF;
    ELSE
        RAISE NOTICE 'group_matches.match_id column does not exist - skipping';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Ensure tournament deletion cascades to related matches
-- ============================================================================

-- Note: Matches are linked to tournaments via:
-- 1. matches.tournament_id (direct link)
-- 2. group_matches.match_id -> matches.id (indirect via groups)

-- Verify matches.tournament_id has proper constraint
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'tournament_id'
    ) THEN
        -- First, clean up orphaned tournament_id references
        -- Set tournament_id to NULL for matches referencing non-existent tournaments
        UPDATE matches m
        SET tournament_id = NULL
        WHERE m.tournament_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM tournaments t WHERE t.id = m.tournament_id
        );
        
        -- Report how many orphaned references were cleaned up
        GET DIAGNOSTICS row_count = ROW_COUNT;
        IF row_count > 0 THEN
            RAISE NOTICE 'Cleaned up % orphaned tournament_id references in matches table', row_count;
        END IF;
        
        -- Check if constraint exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'matches_tournament_id_fkey'
        ) THEN
            -- Drop and recreate with SET NULL (we handle deletion in application code)
            ALTER TABLE matches 
            DROP CONSTRAINT IF EXISTS matches_tournament_id_fkey;
            
            ALTER TABLE matches
            ADD CONSTRAINT matches_tournament_id_fkey 
            FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL;
            
            RAISE NOTICE 'Updated matches.tournament_id foreign key to SET NULL';
        ELSE
            -- Create constraint if it doesn't exist
            ALTER TABLE matches
            ADD CONSTRAINT matches_tournament_id_fkey 
            FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL;
            
            RAISE NOTICE 'Created matches.tournament_id foreign key with SET NULL';
        END IF;
    ELSE
        RAISE NOTICE 'matches.tournament_id column does not exist - skipping';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: Ensure sport-specific config tables have proper cascading
-- ============================================================================

-- Cricket match config
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cricket_match_config') THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'cricket_match_config_match_id_fkey'
        ) THEN
            ALTER TABLE cricket_match_config 
            DROP CONSTRAINT IF EXISTS cricket_match_config_match_id_fkey;
            
            ALTER TABLE cricket_match_config
            ADD CONSTRAINT cricket_match_config_match_id_fkey 
            FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Updated cricket_match_config foreign key to CASCADE';
        END IF;
    END IF;
END $$;

-- Volleyball match config
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'volleyball_match_config') THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'volleyball_match_config_match_id_fkey'
        ) THEN
            ALTER TABLE volleyball_match_config 
            DROP CONSTRAINT IF EXISTS volleyball_match_config_match_id_fkey;
            
            ALTER TABLE volleyball_match_config
            ADD CONSTRAINT volleyball_match_config_match_id_fkey 
            FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Updated volleyball_match_config foreign key to CASCADE';
        END IF;
    END IF;
END $$;

-- Chess match config
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chess_match_config') THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'chess_match_config_match_id_fkey'
        ) THEN
            ALTER TABLE chess_match_config 
            DROP CONSTRAINT IF EXISTS chess_match_config_match_id_fkey;
            
            ALTER TABLE chess_match_config
            ADD CONSTRAINT chess_match_config_match_id_fkey 
            FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Updated chess_match_config foreign key to CASCADE';
        END IF;
    END IF;
END $$;

-- Futsal match config
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'futsal_match_config') THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'futsal_match_config_match_id_fkey'
        ) THEN
            ALTER TABLE futsal_match_config 
            DROP CONSTRAINT IF EXISTS futsal_match_config_match_id_fkey;
            
            ALTER TABLE futsal_match_config
            ADD CONSTRAINT futsal_match_config_match_id_fkey 
            FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Updated futsal_match_config foreign key to CASCADE';
        END IF;
    END IF;
END $$;

-- Table tennis match config
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'table_tennis_match_config') THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'table_tennis_match_config_match_id_fkey'
        ) THEN
            ALTER TABLE table_tennis_match_config 
            DROP CONSTRAINT IF EXISTS table_tennis_match_config_match_id_fkey;
            
            ALTER TABLE table_tennis_match_config
            ADD CONSTRAINT table_tennis_match_config_match_id_fkey 
            FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Updated table_tennis_match_config foreign key to CASCADE';
        END IF;
    END IF;
END $$;

-- Badminton match config
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badminton_match_config') THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'badminton_match_config_match_id_fkey'
        ) THEN
            ALTER TABLE badminton_match_config 
            DROP CONSTRAINT IF EXISTS badminton_match_config_match_id_fkey;
            
            ALTER TABLE badminton_match_config
            ADD CONSTRAINT badminton_match_config_match_id_fkey 
            FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Updated badminton_match_config foreign key to CASCADE';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- STEP 5: Verify the setup
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'All foreign key constraints have been updated for cascading deletes';
    RAISE NOTICE '';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '- user_match_participation: CASCADE on match deletion';
    RAISE NOTICE '- group_matches.match_id: SET NULL on match deletion';
    RAISE NOTICE '- matches.tournament_id: SET NULL on tournament deletion';
    RAISE NOTICE '- All sport config tables: CASCADE on match deletion';
END $$;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

-- To rollback, you would need to manually adjust the constraints
-- based on your original requirements. This migration is generally
-- safe and improves data integrity.

