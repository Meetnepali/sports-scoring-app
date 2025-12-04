-- ============================================================================
-- Migration: Add Tournament Fixture Support Columns
-- ============================================================================
-- This script adds necessary columns to support tournament fixtures with
-- cricket and volleyball configurations:
-- 1. Adds tournament_id and group_id to matches table
-- 2. Adds match_id and match_number to group_matches table
-- 3. Creates necessary indexes for performance
--
-- Migration Version: 1.0.0
-- Created: 2024
-- Dependencies: 
--   - tournaments table must exist
--   - tournament_groups table must exist
--   - matches table must exist
--   - group_matches table must exist
--   - cricket_match_config table (optional, checked)
--   - volleyball_match_config table (optional, checked)
-- ============================================================================
-- 
-- NOTE: This script should be run with psql or a database client that supports
--       DO blocks. For psql, run with: psql -v ON_ERROR_STOP=1 -f script.sql
-- ============================================================================

-- Log migration start
DO $$
BEGIN
  RAISE NOTICE 'Starting migration: Add Tournament Fixture Support Columns';
  RAISE NOTICE 'Timestamp: %', NOW();
END $$;

BEGIN;

-- ============================================================================
-- PART 1: Add tournament and group references to matches table
-- ============================================================================

-- Add tournament_id column to matches table (nullable, as not all matches are in tournaments)
DO $$ 
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Check if column already exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'matches' 
      AND column_name = 'tournament_id'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    RAISE NOTICE 'Adding tournament_id column to matches table...';
    
    ALTER TABLE matches 
    ADD COLUMN tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL;
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
    
    RAISE NOTICE 'Successfully added tournament_id column and index';
  ELSE
    RAISE NOTICE 'Column tournament_id already exists in matches table, skipping...';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error adding tournament_id column: %', SQLERRM;
END $$;

-- Add group_id column to matches table (nullable, as not all matches are in groups)
DO $$ 
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Check if column already exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'matches' 
      AND column_name = 'group_id'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    RAISE NOTICE 'Adding group_id column to matches table...';
    
    ALTER TABLE matches 
    ADD COLUMN group_id UUID REFERENCES tournament_groups(id) ON DELETE SET NULL;
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_matches_group_id ON matches(group_id);
    
    RAISE NOTICE 'Successfully added group_id column and index';
  ELSE
    RAISE NOTICE 'Column group_id already exists in matches table, skipping...';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error adding group_id column: %', SQLERRM;
END $$;

-- ============================================================================
-- PART 2: Add match linking columns to group_matches table
-- ============================================================================

-- Add match_id column to group_matches table (links to global matches table)
DO $$ 
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Check if column already exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'group_matches' 
      AND column_name = 'match_id'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    RAISE NOTICE 'Adding match_id column to group_matches table...';
    
    ALTER TABLE group_matches 
    ADD COLUMN match_id UUID REFERENCES matches(id) ON DELETE SET NULL;
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_group_matches_match_id ON group_matches(match_id);
    
    RAISE NOTICE 'Successfully added match_id column and index';
  ELSE
    RAISE NOTICE 'Column match_id already exists in group_matches table, skipping...';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error adding match_id column: %', SQLERRM;
END $$;

-- Add match_number column to group_matches table (sequence within group)
DO $$ 
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Check if column already exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'group_matches' 
      AND column_name = 'match_number'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    RAISE NOTICE 'Adding match_number column to group_matches table...';
    
    ALTER TABLE group_matches 
    ADD COLUMN match_number INTEGER;
    
    -- Create index for ordering matches within groups
    CREATE INDEX IF NOT EXISTS idx_group_matches_group_match_number ON group_matches(group_id, match_number);
    
    RAISE NOTICE 'Successfully added match_number column and index';
  ELSE
    RAISE NOTICE 'Column match_number already exists in group_matches table, skipping...';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error adding match_number column: %', SQLERRM;
END $$;

-- ============================================================================
-- PART 3: Ensure cricket_match_config table has unique constraint
-- ============================================================================

-- Verify cricket_match_config table exists and has proper constraints
DO $$ 
DECLARE
  table_exists BOOLEAN;
  constraint_exists BOOLEAN;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public'
      AND table_name = 'cricket_match_config'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'cricket_match_config table exists, checking constraints...';
    
    -- Check if unique constraint already exists
    SELECT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'cricket_match_config_match_id_key'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
      RAISE NOTICE 'Adding unique constraint on cricket_match_config.match_id...';
      ALTER TABLE cricket_match_config 
      ADD CONSTRAINT cricket_match_config_match_id_key UNIQUE (match_id);
      RAISE NOTICE 'Successfully added unique constraint';
    ELSE
      RAISE NOTICE 'Unique constraint already exists on cricket_match_config.match_id';
    END IF;
  ELSE
    RAISE NOTICE 'cricket_match_config table does not exist, skipping constraint check';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error checking/adding cricket_match_config constraint: %', SQLERRM;
END $$;

-- ============================================================================
-- PART 4: Ensure volleyball_match_config table has unique constraint
-- ============================================================================

-- Verify volleyball_match_config table exists and has proper constraints
DO $$ 
DECLARE
  table_exists BOOLEAN;
  constraint_exists BOOLEAN;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public'
      AND table_name = 'volleyball_match_config'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'volleyball_match_config table exists, checking constraints...';
    
    -- Check if unique constraint already exists
    SELECT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'volleyball_match_config_match_id_key'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
      RAISE NOTICE 'Adding unique constraint on volleyball_match_config.match_id...';
      ALTER TABLE volleyball_match_config 
      ADD CONSTRAINT volleyball_match_config_match_id_key UNIQUE (match_id);
      RAISE NOTICE 'Successfully added unique constraint';
    ELSE
      RAISE NOTICE 'Unique constraint already exists on volleyball_match_config.match_id';
    END IF;
  ELSE
    RAISE NOTICE 'volleyball_match_config table does not exist, skipping constraint check';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error checking/adding volleyball_match_config constraint: %', SQLERRM;
END $$;

-- ============================================================================
-- PART 5: Add additional indexes for performance
-- ============================================================================

-- Index for querying matches by tournament and group
DO $$
BEGIN
  RAISE NOTICE 'Creating composite index for tournament and group queries...';
  CREATE INDEX IF NOT EXISTS idx_matches_tournament_group 
  ON matches(tournament_id, group_id) 
  WHERE tournament_id IS NOT NULL AND group_id IS NOT NULL;
  RAISE NOTICE 'Index idx_matches_tournament_group created/verified';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating idx_matches_tournament_group: %', SQLERRM;
END $$;

-- Index for querying group matches by status
DO $$
BEGIN
  RAISE NOTICE 'Creating index for group matches status queries...';
  CREATE INDEX IF NOT EXISTS idx_group_matches_status 
  ON group_matches(status);
  RAISE NOTICE 'Index idx_group_matches_status created/verified';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating idx_group_matches_status: %', SQLERRM;
END $$;

-- Index for querying group matches by group and status
DO $$
BEGIN
  RAISE NOTICE 'Creating composite index for group and status queries...';
  CREATE INDEX IF NOT EXISTS idx_group_matches_group_status 
  ON group_matches(group_id, status);
  RAISE NOTICE 'Index idx_group_matches_group_status created/verified';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating idx_group_matches_group_status: %', SQLERRM;
END $$;

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully at %', NOW();
END $$;

COMMIT;

-- ============================================================================
-- Verification Queries (run these to verify the migration)
-- ============================================================================
-- 
-- Verify matches table columns:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'matches' 
-- AND column_name IN ('tournament_id', 'group_id');
--
-- Verify group_matches table columns:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'group_matches' 
-- AND column_name IN ('match_id', 'match_number');
--
-- Verify indexes:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename IN ('matches', 'group_matches') 
-- AND indexname LIKE '%tournament%' OR indexname LIKE '%group%' OR indexname LIKE '%match%';
-- ============================================================================

