-- Validation Script for All Sports with Set/Game-based Scoring
-- Run this to check if all matches have valid data

-- ============================================================================
-- TABLE TENNIS VALIDATION
-- ============================================================================

SELECT '=== TABLE TENNIS VALIDATION ===' as section;

-- Check for invalid currentSet
SELECT 
    'Table Tennis: Invalid currentSet' as check_name,
    COUNT(*) as count
FROM matches 
WHERE sport = 'table-tennis'
AND score IS NOT NULL
AND (
    NOT (score ? 'currentSet')
    OR (score->>'currentSet') IS NULL
    OR (score->>'currentSet')::text !~ '^\d+$'
);

-- Check for missing sets array
SELECT 
    'Table Tennis: Missing sets array' as check_name,
    COUNT(*) as count
FROM matches 
WHERE sport = 'table-tennis'
AND (score IS NULL OR NOT (score ? 'sets') OR jsonb_array_length(score->'sets') = 0);

-- ============================================================================
-- VOLLEYBALL VALIDATION
-- ============================================================================

SELECT '=== VOLLEYBALL VALIDATION ===' as section;

-- Check for invalid currentSet
SELECT 
    'Volleyball: Invalid currentSet' as check_name,
    COUNT(*) as count
FROM matches 
WHERE sport = 'volleyball'
AND score IS NOT NULL
AND (
    NOT (score ? 'currentSet')
    OR (score->>'currentSet') IS NULL
    OR (score->>'currentSet')::text !~ '^\d+$'
);

-- Check for missing sets array
SELECT 
    'Volleyball: Missing sets array' as check_name,
    COUNT(*) as count
FROM matches 
WHERE sport = 'volleyball'
AND (score IS NULL OR NOT (score ? 'sets') OR jsonb_array_length(score->'sets') = 0);

-- ============================================================================
-- BADMINTON VALIDATION
-- ============================================================================

SELECT '=== BADMINTON VALIDATION ===' as section;

-- Check for invalid currentGame
SELECT 
    'Badminton: Invalid currentGame' as check_name,
    COUNT(*) as count
FROM matches 
WHERE sport = 'badminton'
AND score IS NOT NULL
AND (
    NOT (score ? 'currentGame')
    OR (score->>'currentGame') IS NULL
    OR (score->>'currentGame')::text !~ '^\d+$'
);

-- Check for missing games array
SELECT 
    'Badminton: Missing games array' as check_name,
    COUNT(*) as count
FROM matches 
WHERE sport = 'badminton'
AND (score IS NULL OR NOT (score ? 'games') OR jsonb_array_length(score->'games') = 0);

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT '=== OVERALL SUMMARY ===' as section;

SELECT 
    sport,
    COUNT(*) as total_matches,
    SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
    SUM(CASE WHEN status IN ('started', 'live') THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
FROM matches
WHERE sport IN ('table-tennis', 'volleyball', 'badminton')
GROUP BY sport
ORDER BY sport;

-- Show any remaining problematic matches
SELECT 
    '=== PROBLEMATIC MATCHES (if any) ===' as section;

SELECT 
    m.id,
    m.sport,
    m.status,
    CASE 
        WHEN m.score IS NULL THEN 'NULL score'
        WHEN m.sport = 'badminton' AND NOT (m.score ? 'games') THEN 'Missing games'
        WHEN m.sport IN ('table-tennis', 'volleyball') AND NOT (m.score ? 'sets') THEN 'Missing sets'
        WHEN m.sport = 'badminton' AND NOT (m.score ? 'currentGame') THEN 'Missing currentGame'
        WHEN m.sport IN ('table-tennis', 'volleyball') AND NOT (m.score ? 'currentSet') THEN 'Missing currentSet'
        ELSE 'Other issue'
    END as issue
FROM matches m
WHERE m.sport IN ('table-tennis', 'volleyball', 'badminton')
AND (
    m.score IS NULL 
    OR (m.sport = 'badminton' AND (NOT (m.score ? 'games') OR NOT (m.score ? 'currentGame')))
    OR (m.sport IN ('table-tennis', 'volleyball') AND (NOT (m.score ? 'sets') OR NOT (m.score ? 'currentSet')))
)
LIMIT 20;

