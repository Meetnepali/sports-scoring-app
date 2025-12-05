-- Validation Script for Table Tennis Data
-- Run this to check if all table tennis matches have valid data

-- Check 1: Matches with null or empty scores
SELECT 
    'Matches with invalid scores' as check_name,
    COUNT(*) as count
FROM matches 
WHERE sport = 'table-tennis'
AND status != 'scheduled'
AND (score IS NULL OR score::text = '{}' OR score::text = 'null');

-- Check 2: Matches with missing sets array
SELECT 
    'Matches with missing sets array' as check_name,
    COUNT(*) as count
FROM matches 
WHERE sport = 'table-tennis'
AND (score IS NULL OR NOT (score ? 'sets'));

-- Check 3: Matches with empty sets array
SELECT 
    'Matches with empty sets array' as check_name,
    COUNT(*) as count
FROM matches 
WHERE sport = 'table-tennis'
AND score ? 'sets'
AND jsonb_array_length(score->'sets') = 0;

-- Check 4: Matches with invalid currentSet
SELECT 
    'Matches with invalid currentSet' as check_name,
    COUNT(*) as count
FROM matches 
WHERE sport = 'table-tennis'
AND score IS NOT NULL
AND (
    NOT (score ? 'currentSet')
    OR (score->>'currentSet') IS NULL
    OR (score->>'currentSet')::text !~ '^\d+$'
);

-- Check 5: Matches without config
SELECT 
    'Matches without config' as check_name,
    COUNT(*) as count
FROM matches m
LEFT JOIN table_tennis_match_config c ON m.id = c.match_id
WHERE m.sport = 'table-tennis'
AND c.match_id IS NULL;

-- Check 6: Show problematic matches (if any)
SELECT 
    m.id,
    m.status,
    CASE 
        WHEN m.score IS NULL THEN 'NULL score'
        WHEN NOT (m.score ? 'sets') THEN 'Missing sets'
        WHEN jsonb_array_length(m.score->'sets') = 0 THEN 'Empty sets array'
        WHEN NOT (m.score ? 'currentSet') THEN 'Missing currentSet'
        ELSE 'Other issue'
    END as issue,
    m.score
FROM matches m
WHERE m.sport = 'table-tennis'
AND (
    m.score IS NULL 
    OR NOT (m.score ? 'sets')
    OR jsonb_array_length(m.score->'sets') = 0
    OR NOT (m.score ? 'currentSet')
)
LIMIT 10;

-- Summary report
SELECT 
    COUNT(*) as total_table_tennis_matches,
    SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
    SUM(CASE WHEN status IN ('started', 'live') THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN score IS NOT NULL AND score ? 'sets' AND jsonb_array_length(score->'sets') > 0 THEN 1 ELSE 0 END) as with_valid_score
FROM matches
WHERE sport = 'table-tennis';

