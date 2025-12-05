-- Fix All Sports Data Integrity Issues
-- This script identifies and fixes data issues across all sports with set/game-based scoring

-- ============================================================================
-- HELPER FUNCTION: Initialize default score structure for different sports
-- ============================================================================

-- ============================================================================
-- FIX TABLE TENNIS
-- ============================================================================

DO $$
DECLARE
    match_record RECORD;
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Fixing table tennis matches...';
    
    FOR match_record IN 
        SELECT id, score, status
        FROM matches 
        WHERE sport = 'table-tennis'
    LOOP
        -- Initialize missing scores
        IF (match_record.status != 'scheduled' AND 
            (match_record.score IS NULL OR match_record.score::text = '{}' OR match_record.score::text = 'null')) THEN
            
            UPDATE matches
            SET score = jsonb_build_object(
                'sets', jsonb_build_array(
                    jsonb_build_object('home', 0, 'away', 0, 'type', 'singles'),
                    jsonb_build_object('home', 0, 'away', 0, 'type', 'singles'),
                    jsonb_build_object('home', 0, 'away', 0, 'type', 'singles')
                ),
                'currentSet', 0,
                'servingPlayer', 'home',
                'pointsToWin', 11,
                'setsToWin', 2,
                'isDoubles', false
            )
            WHERE id = match_record.id;
            
            fixed_count := fixed_count + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Fixed % table tennis match(es)', fixed_count;
END $$;

-- ============================================================================
-- FIX VOLLEYBALL
-- ============================================================================

DO $$
DECLARE
    match_record RECORD;
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Fixing volleyball matches...';
    
    FOR match_record IN 
        SELECT id, score, status
        FROM matches 
        WHERE sport = 'volleyball'
    LOOP
        -- Initialize missing scores or fix currentSet
        IF match_record.score IS NOT NULL THEN
            -- Fix invalid currentSet
            IF NOT (match_record.score ? 'currentSet') OR 
               (match_record.score->>'currentSet')::text !~ '^\d+$' THEN
                UPDATE matches
                SET score = jsonb_set(COALESCE(score, '{}'::jsonb), '{currentSet}', '0')
                WHERE id = match_record.id;
                fixed_count := fixed_count + 1;
            ELSE
                -- Validate currentSet is within bounds
                DECLARE
                    current_set_val INTEGER;
                    sets_count INTEGER;
                BEGIN
                    current_set_val := (match_record.score->>'currentSet')::INTEGER;
                    IF match_record.score ? 'sets' AND jsonb_typeof(match_record.score->'sets') = 'array' THEN
                        sets_count := jsonb_array_length(match_record.score->'sets');
                        IF current_set_val < 0 OR current_set_val >= sets_count THEN
                            UPDATE matches
                            SET score = jsonb_set(score, '{currentSet}', '0')
                            WHERE id = match_record.id;
                            fixed_count := fixed_count + 1;
                        END IF;
                    END IF;
                EXCEPTION WHEN OTHERS THEN
                    UPDATE matches
                    SET score = jsonb_set(COALESCE(score, '{}'::jsonb), '{currentSet}', '0')
                    WHERE id = match_record.id;
                    fixed_count := fixed_count + 1;
                END;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Fixed % volleyball match(es)', fixed_count;
END $$;

-- ============================================================================
-- FIX BADMINTON
-- ============================================================================

DO $$
DECLARE
    match_record RECORD;
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Fixing badminton matches...';
    
    FOR match_record IN 
        SELECT id, score, status
        FROM matches 
        WHERE sport = 'badminton'
    LOOP
        -- Initialize missing scores
        IF (match_record.status != 'scheduled' AND 
            (match_record.score IS NULL OR match_record.score::text = '{}' OR match_record.score::text = 'null')) THEN
            
            UPDATE matches
            SET score = jsonb_build_object(
                'games', jsonb_build_array(
                    jsonb_build_object('home', 0, 'away', 0, 'type', 'singles'),
                    jsonb_build_object('home', 0, 'away', 0, 'type', 'singles'),
                    jsonb_build_object('home', 0, 'away', 0, 'type', 'singles')
                ),
                'currentGame', 0,
                'servingPlayer', 'home',
                'pointsToWin', 21,
                'gamesToWin', 2,
                'isDoubles', false
            )
            WHERE id = match_record.id;
            
            fixed_count := fixed_count + 1;
        -- Fix invalid currentGame
        ELSIF match_record.score IS NOT NULL THEN
            IF NOT (match_record.score ? 'currentGame') OR 
               (match_record.score->>'currentGame')::text !~ '^\d+$' THEN
                UPDATE matches
                SET score = jsonb_set(COALESCE(score, '{}'::jsonb), '{currentGame}', '0')
                WHERE id = match_record.id;
                fixed_count := fixed_count + 1;
            ELSE
                -- Validate currentGame is within bounds
                DECLARE
                    current_game_val INTEGER;
                    games_count INTEGER;
                BEGIN
                    current_game_val := (match_record.score->>'currentGame')::INTEGER;
                    IF match_record.score ? 'games' AND jsonb_typeof(match_record.score->'games') = 'array' THEN
                        games_count := jsonb_array_length(match_record.score->'games');
                        IF current_game_val < 0 OR current_game_val >= games_count THEN
                            UPDATE matches
                            SET score = jsonb_set(score, '{currentGame}', '0')
                            WHERE id = match_record.id;
                            fixed_count := fixed_count + 1;
                        END IF;
                    END IF;
                EXCEPTION WHEN OTHERS THEN
                    UPDATE matches
                    SET score = jsonb_set(COALESCE(score, '{}'::jsonb), '{currentGame}', '0')
                    WHERE id = match_record.id;
                    fixed_count := fixed_count + 1;
                END;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Fixed % badminton match(es)', fixed_count;
END $$;

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== Data Integrity Fix Summary ===';
    RAISE NOTICE 'Table Tennis: % total matches', (SELECT COUNT(*) FROM matches WHERE sport = 'table-tennis');
    RAISE NOTICE 'Volleyball: % total matches', (SELECT COUNT(*) FROM matches WHERE sport = 'volleyball');
    RAISE NOTICE 'Badminton: % total matches', (SELECT COUNT(*) FROM matches WHERE sport = 'badminton');
    RAISE NOTICE '';
    RAISE NOTICE 'All data integrity fixes applied successfully!';
    RAISE NOTICE 'Run validate-all-sports.sql to verify the fixes.';
END $$;

