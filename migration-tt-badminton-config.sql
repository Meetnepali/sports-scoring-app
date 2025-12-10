-- Migration Script for Table Tennis and Badminton Configuration
-- This script adds new columns to support "number of matches" instead of "number of sets"
-- Run this in pgAdmin or any PostgreSQL client

-- ============================================================================
-- TABLE TENNIS CONFIGURATION TABLE MIGRATION
-- ============================================================================

-- Add new columns to table_tennis_match_config table
DO $$ 
BEGIN
  -- Add number_of_matches column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'table_tennis_match_config' AND column_name = 'number_of_matches') THEN
    ALTER TABLE table_tennis_match_config ADD COLUMN number_of_matches INTEGER DEFAULT 3;
    RAISE NOTICE 'Added number_of_matches column to table_tennis_match_config';
  ELSE
    RAISE NOTICE 'Column number_of_matches already exists in table_tennis_match_config';
  END IF;
  
  -- Add sets_per_match column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'table_tennis_match_config' AND column_name = 'sets_per_match') THEN
    ALTER TABLE table_tennis_match_config ADD COLUMN sets_per_match INTEGER DEFAULT 2;
    RAISE NOTICE 'Added sets_per_match column to table_tennis_match_config';
  ELSE
    RAISE NOTICE 'Column sets_per_match already exists in table_tennis_match_config';
  END IF;
  
  -- Add match_types column if it doesn't exist (JSONB to store array of match types)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'table_tennis_match_config' AND column_name = 'match_types') THEN
    ALTER TABLE table_tennis_match_config ADD COLUMN match_types JSONB;
    RAISE NOTICE 'Added match_types column to table_tennis_match_config';
  ELSE
    RAISE NOTICE 'Column match_types already exists in table_tennis_match_config';
  END IF;
  
  -- Add set_types column for backward compatibility if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'table_tennis_match_config' AND column_name = 'set_types') THEN
    ALTER TABLE table_tennis_match_config ADD COLUMN set_types JSONB;
    RAISE NOTICE 'Added set_types column to table_tennis_match_config';
  ELSE
    RAISE NOTICE 'Column set_types already exists in table_tennis_match_config';
  END IF;
END $$;

-- ============================================================================
-- BADMINTON CONFIGURATION TABLE MIGRATION
-- ============================================================================

-- Add new columns to badminton_match_config table
DO $$ 
BEGIN
  -- Add number_of_matches column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'badminton_match_config' AND column_name = 'number_of_matches') THEN
    ALTER TABLE badminton_match_config ADD COLUMN number_of_matches INTEGER DEFAULT 3;
    RAISE NOTICE 'Added number_of_matches column to badminton_match_config';
  ELSE
    RAISE NOTICE 'Column number_of_matches already exists in badminton_match_config';
  END IF;
  
  -- Add sets_per_match column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'badminton_match_config' AND column_name = 'sets_per_match') THEN
    ALTER TABLE badminton_match_config ADD COLUMN sets_per_match INTEGER DEFAULT 2;
    RAISE NOTICE 'Added sets_per_match column to badminton_match_config';
  ELSE
    RAISE NOTICE 'Column sets_per_match already exists in badminton_match_config';
  END IF;
  
  -- Add match_types column if it doesn't exist (JSONB to store array of match types)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'badminton_match_config' AND column_name = 'match_types') THEN
    ALTER TABLE badminton_match_config ADD COLUMN match_types JSONB;
    RAISE NOTICE 'Added match_types column to badminton_match_config';
  ELSE
    RAISE NOTICE 'Column match_types already exists in badminton_match_config';
  END IF;
  
  -- Add game_types column for backward compatibility if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'badminton_match_config' AND column_name = 'game_types') THEN
    ALTER TABLE badminton_match_config ADD COLUMN game_types JSONB;
    RAISE NOTICE 'Added game_types column to badminton_match_config';
  ELSE
    RAISE NOTICE 'Column game_types already exists in badminton_match_config';
  END IF;
END $$;

-- ============================================================================
-- VERIFY MIGRATION
-- ============================================================================

-- Check table_tennis_match_config columns
SELECT 
  'table_tennis_match_config' as table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'table_tennis_match_config'
  AND column_name IN ('number_of_matches', 'sets_per_match', 'match_types', 'set_types')
ORDER BY column_name;

-- Check badminton_match_config columns
SELECT 
  'badminton_match_config' as table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'badminton_match_config'
  AND column_name IN ('number_of_matches', 'sets_per_match', 'match_types', 'game_types')
ORDER BY column_name;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- New columns added:
-- 1. number_of_matches (INTEGER) - Total number of matches to play (3, 5, or 7)
-- 2. sets_per_match (INTEGER) - Sets to win per match (2, 3, or 4)
-- 3. match_types (JSONB) - Array of match types ["singles", "doubles", etc.]
-- 4. set_types/game_types (JSONB) - Legacy compatibility field
-- ============================================================================

