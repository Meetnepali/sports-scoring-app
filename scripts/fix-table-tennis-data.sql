-- Fix Table Tennis Data Integrity Issues
-- This script identifies and fixes data issues in table tennis matches

-- ============================================================================
-- STEP 1: Identify and fix matches with invalid or null score data
-- ============================================================================

DO $$
DECLARE
    match_record RECORD;
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Checking table tennis matches for data integrity issues...';
    
    -- Find all table tennis matches
    FOR match_record IN 
        SELECT id, score, status
        FROM matches 
        WHERE sport = 'table-tennis'
    LOOP
        -- Check if score is null or empty for non-scheduled matches
        IF (match_record.status != 'scheduled' AND 
            (match_record.score IS NULL OR match_record.score::text = '{}' OR match_record.score::text = 'null')) THEN
            
            -- Initialize with default score structure
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
            RAISE NOTICE 'Fixed match ID: % - initialized score structure', match_record.id;
            
        -- Check if score has sets but they're invalid
        ELSIF match_record.score IS NOT NULL AND match_record.score ? 'sets' THEN
            DECLARE
                sets_array jsonb;
                current_set_val jsonb;
                needs_fix BOOLEAN := false;
                fixed_sets jsonb;
            BEGIN
                sets_array := match_record.score->'sets';
                
                -- Check if sets is an array
                IF jsonb_typeof(sets_array) != 'array' THEN
                    needs_fix := true;
                ELSIF jsonb_array_length(sets_array) = 0 THEN
                    needs_fix := true;
                ELSE
                    -- Check each set for proper structure
                    FOR i IN 0..jsonb_array_length(sets_array)-1 LOOP
                        current_set_val := sets_array->i;
                        IF current_set_val IS NULL OR 
                           NOT (current_set_val ? 'home') OR 
                           NOT (current_set_val ? 'away') THEN
                            needs_fix := true;
                            EXIT;
                        END IF;
                    END LOOP;
                END IF;
                
                -- Fix if needed
                IF needs_fix THEN
                    -- Create proper sets array
                    fixed_sets := jsonb_build_array(
                        jsonb_build_object('home', 0, 'away', 0, 'type', 'singles'),
                        jsonb_build_object('home', 0, 'away', 0, 'type', 'singles'),
                        jsonb_build_object('home', 0, 'away', 0, 'type', 'singles')
                    );
                    
                    UPDATE matches
                    SET score = jsonb_set(
                        COALESCE(score, '{}'::jsonb),
                        '{sets}',
                        fixed_sets
                    )
                    WHERE id = match_record.id;
                    
                    fixed_count := fixed_count + 1;
                    RAISE NOTICE 'Fixed match ID: % - repaired sets array', match_record.id;
                END IF;
            END;
        END IF;
        
        -- Ensure currentSet is valid
        IF match_record.score IS NOT NULL THEN
            DECLARE
                current_set_index INTEGER;
                sets_length INTEGER;
            BEGIN
                -- Get currentSet value
                current_set_index := COALESCE((match_record.score->>'currentSet')::INTEGER, 0);
                
                -- Get number of sets
                IF match_record.score ? 'sets' AND jsonb_typeof(match_record.score->'sets') = 'array' THEN
                    sets_length := jsonb_array_length(match_record.score->'sets');
                    
                    -- Fix if currentSet is out of bounds
                    IF current_set_index < 0 OR current_set_index >= sets_length THEN
                        UPDATE matches
                        SET score = jsonb_set(score, '{currentSet}', '0')
                        WHERE id = match_record.id;
                        
                        fixed_count := fixed_count + 1;
                        RAISE NOTICE 'Fixed match ID: % - reset currentSet from % to 0', match_record.id, current_set_index;
                    END IF;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                -- If there's any error parsing, reset to 0
                UPDATE matches
                SET score = jsonb_set(COALESCE(score, '{}'::jsonb), '{currentSet}', '0')
                WHERE id = match_record.id;
                
                fixed_count := fixed_count + 1;
                RAISE NOTICE 'Fixed match ID: % - reset invalid currentSet', match_record.id;
            END;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Data integrity check complete. Fixed % match(es).', fixed_count;
END $$;

-- ============================================================================
-- STEP 2: Ensure all table tennis match configs exist
-- ============================================================================

DO $$
DECLARE
    match_record RECORD;
    config_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Checking table tennis match configurations...';
    
    -- Find table tennis matches without config
    FOR match_record IN 
        SELECT m.id, m.status
        FROM matches m
        LEFT JOIN table_tennis_match_config c ON m.id = c.match_id
        WHERE m.sport = 'table-tennis'
        AND c.match_id IS NULL
    LOOP
        -- Create default config
        INSERT INTO table_tennis_match_config (
            match_id,
            sets_to_win,
            points_to_win_per_set,
            serving_team,
            toss_winner_team_id,
            toss_decision,
            selected_table_side,
            config_completed
        ) VALUES (
            match_record.id,
            2,  -- Best of 3
            11, -- First to 11
            NULL,
            NULL,
            NULL,
            NULL,
            false
        )
        ON CONFLICT (match_id) DO NOTHING;
        
        config_count := config_count + 1;
        RAISE NOTICE 'Created config for match ID: %', match_record.id;
    END LOOP;
    
    RAISE NOTICE 'Config check complete. Created % config(s).', config_count;
END $$;

-- ============================================================================
-- STEP 3: Report summary
-- ============================================================================

DO $$
DECLARE
    total_matches INTEGER;
    scheduled_matches INTEGER;
    live_matches INTEGER;
    completed_matches INTEGER;
    matches_with_config INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_matches FROM matches WHERE sport = 'table-tennis';
    SELECT COUNT(*) INTO scheduled_matches FROM matches WHERE sport = 'table-tennis' AND status = 'scheduled';
    SELECT COUNT(*) INTO live_matches FROM matches WHERE sport = 'table-tennis' AND status IN ('started', 'live');
    SELECT COUNT(*) INTO completed_matches FROM matches WHERE sport = 'table-tennis' AND status = 'completed';
    SELECT COUNT(*) INTO matches_with_config FROM table_tennis_match_config;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Table Tennis Matches Summary ===';
    RAISE NOTICE 'Total matches: %', total_matches;
    RAISE NOTICE 'Scheduled: %', scheduled_matches;
    RAISE NOTICE 'Live/Started: %', live_matches;
    RAISE NOTICE 'Completed: %', completed_matches;
    RAISE NOTICE 'Matches with config: %', matches_with_config;
    RAISE NOTICE '';
    RAISE NOTICE 'Data integrity fixes applied successfully!';
END $$;

