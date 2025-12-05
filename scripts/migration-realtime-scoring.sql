-- Migration Script for Real-Time Scoring Feature
-- This script adds version tracking and NOTIFY triggers for real-time score updates
-- Run this script on your PostgreSQL database

-- ============================================================================
-- STEP 1: Add version and updated_at columns to matches table
-- ============================================================================

-- Add version column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'version'
    ) THEN
        ALTER TABLE matches ADD COLUMN version INTEGER DEFAULT 0;
        -- Initialize version for existing records
        UPDATE matches SET version = 0 WHERE version IS NULL;
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE matches ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        -- Initialize updated_at for existing records (use created_at if available)
        UPDATE matches 
        SET updated_at = COALESCE(created_at, CURRENT_TIMESTAMP) 
        WHERE updated_at IS NULL;
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Create trigger function for score updates
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_score_update()
RETURNS TRIGGER AS $$
DECLARE
    payload JSONB;
    old_score_json JSONB;
    new_score_json JSONB;
BEGIN
    -- Convert score columns to JSONB for comparison
    old_score_json := COALESCE(OLD.score, 'null'::jsonb);
    new_score_json := COALESCE(NEW.score, 'null'::jsonb);
    
    -- Check if score or status changed
    IF (old_score_json IS DISTINCT FROM new_score_json) OR (OLD.status IS DISTINCT FROM NEW.status) THEN
        -- Increment version
        NEW.version := COALESCE(OLD.version, 0) + 1;
        NEW.updated_at := CURRENT_TIMESTAMP;
        
        -- Build JSON payload with match update information
        payload := jsonb_build_object(
            'matchId', NEW.id::text,
            'score', NEW.score,
            'status', NEW.status,
            'version', NEW.version,
            'updatedAt', NEW.updated_at
        );
        
        -- Send NOTIFY to score_updates channel
        PERFORM pg_notify('score_updates', payload::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: Create trigger on matches table
-- ============================================================================

-- Drop existing trigger if it exists (for re-running migration)
DROP TRIGGER IF EXISTS score_update_trigger ON matches;

-- Create the trigger
CREATE TRIGGER score_update_trigger
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION notify_score_update();

-- ============================================================================
-- STEP 4: Verify the setup
-- ============================================================================

-- Verify columns exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'version'
    ) THEN
        RAISE EXCEPTION 'version column was not created';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'updated_at'
    ) THEN
        RAISE EXCEPTION 'updated_at column was not created';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Columns: version and updated_at added to matches table';
    RAISE NOTICE 'Trigger function: notify_score_update() created';
    RAISE NOTICE 'Trigger: score_update_trigger created on matches table';
END $$;

-- ============================================================================
-- OPTIONAL: Test the trigger (uncomment to test)
-- ============================================================================

-- Uncomment the following to test the trigger:
-- 
-- -- First, listen for notifications in another session:
-- -- LISTEN score_updates;
-- 
-- -- Then update a match score:
-- -- UPDATE matches SET score = '{"test": "value"}' WHERE id = (SELECT id FROM matches LIMIT 1);
-- 
-- -- You should see a notification in the listening session

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

-- To rollback this migration, run:
-- 
-- DROP TRIGGER IF EXISTS score_update_trigger ON matches;
-- DROP FUNCTION IF EXISTS notify_score_update();
-- ALTER TABLE matches DROP COLUMN IF EXISTS version;
-- ALTER TABLE matches DROP COLUMN IF EXISTS updated_at;

