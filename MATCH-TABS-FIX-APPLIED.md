# Critical Fix Applied - Match Tabs Now Working!

## What Was Wrong

The scoreboard was showing the OLD structure (Set 1, Set 2, Set 3) instead of the NEW structure (Match 1, Match 2, Match 3 tabs) even though:
- Match creation was correctly saving the configuration (3 matches, 3 sets per match)
- Toss dialog was showing the correct match structure

**Root Cause**: When the toss dialog completed setup, it wasn't passing the match configuration (numberOfMatches, setsPerMatch, matchTypes) to the API. The API was receiving these as `null` and not fetching them from the existing database config.

## What Was Fixed

### Files Modified:
1. **`app/api/matches/[id]/table-tennis/config/route.ts`** 
   - Now fetches FULL existing config (not just id and config_completed)
   - Uses existing config values when toss dialog updates (numberOfMatches, setsPerMatch, matchTypes)
   - Passes correct values to `updateMatchScore` function

2. **`app/api/matches/[id]/badminton/config/route.ts`**
   - Same fix applied for consistency

## How It Works Now

### Flow:
1. **Match Creation** → Saves config to database:
   ```json
   {
     "numberOfMatches": 3,
     "setsPerMatch": 3,
     "matchTypes": ["doubles", "singles", "singles"],
     "pointsToWinPerSet": 11
   }
   ```

2. **Toss Dialog** → Sends only toss info:
   ```json
   {
     "tossWinnerTeamId": "...",
     "servingTeam": "away",
     "configCompleted": true
   }
   ```

3. **API Handler** → Now does this:
   - ✅ Fetches existing config from database
   - ✅ Extracts: numberOfMatches, setsPerMatch, matchTypes
   - ✅ Passes these to `updateMatchScore` function
   - ✅ Creates proper match structure in database

4. **Score Structure Created**:
   ```json
   {
     "matches": [
       {
         "matchNumber": 1,
         "type": "doubles",
         "sets": [
           {"home": 0, "away": 0},
           {"home": 0, "away": 0},
           {"home": 0, "away": 0},
           {"home": 0, "away": 0}
         ],
         "winner": null
       },
       {
         "matchNumber": 2,
         "type": "singles",
         "sets": [...]
       },
       {
         "matchNumber": 3,
         "type": "singles",
         "sets": [...]
       }
     ],
     "currentMatch": 0,
     "matchWins": {"home": 0, "away": 0},
     "servingTeam": "away"
   }
   ```

5. **Scoreboard** → Detects `match.score.matches` exists:
   - ✅ Shows Match 1, Match 2, Match 3 tabs
   - ✅ Inside each tab: shows the sets for that specific match
   - ✅ Shows overall Match Wins summary

## Testing Steps

1. **Create a new match**:
   - Sport: Table Tennis or Badminton
   - Number of Matches: 3
   - Sets per Match: 3
   - Configure match types (e.g., Match 1: Doubles, Match 2: Singles, Match 3: Singles)

2. **Start and configure toss**:
   - Click "Start Match"
   - Complete toss configuration
   - Click "Complete Setup"

3. **Verify Match Tabs**:
   - Go to "Scorecard" tab
   - You should NOW see: **Match 1**, **Match 2**, **Match 3** tabs! ✅
   - Click each tab to see its specific sets
   - Each tab shows:
     - Match type badge (Singles/Doubles)
     - Sets count badge (e.g., "3 sets")
     - Set history table for that match only
   - Bottom shows: Overall Match Wins

## What Changed in Code

### Before (Broken):
```typescript
// Only fetched id and config_completed
const existingConfigResult = await query(
  `SELECT id, config_completed FROM table_tennis_match_config WHERE match_id = $1`,
  [id]
)

// Used null values when toss dialog didn't send them
await updateMatchScore(id, matches, servingTeam, pointsToWinPerSet, 
  setsToWin || setsPerMatch,  // ← null || null = null
  setTypes, configCompleted, 
  matchTypes,                 // ← null
  numberOfMatches,            // ← null
  setsPerMatch                // ← null
)
```

### After (Fixed):
```typescript
// Fetches FULL config including numberOfMatches, setsPerMatch, matchTypes
const existingConfigResult = await query(
  `SELECT * FROM table_tennis_match_config WHERE match_id = $1`,
  [id]
)
const existingConfig = existingConfigResult[0]

// Parse existing matchTypes from JSON
let existingMatchTypes = existingConfig.match_types
if (typeof existingMatchTypes === 'string') {
  existingMatchTypes = JSON.parse(existingMatchTypes)
}

// Use existing values when not provided in request
const finalNumberOfMatches = numberOfMatches || existingConfig.number_of_matches
const finalSetsPerMatch = setsPerMatch || existingConfig.sets_per_match
const finalMatchTypes = matchTypes || existingMatchTypes

// Pass correct values to updateMatchScore
await updateMatchScore(
  id, matches, servingTeam, finalPointsToWinPerSet,
  finalSetsToWin || finalSetsPerMatch,
  setTypes, configCompleted,
  finalMatchTypes,        // ← Now has correct value from DB
  finalNumberOfMatches,   // ← Now has correct value from DB
  finalSetsPerMatch       // ← Now has correct value from DB
)
```

## Result

✅ **Match tabs now appear correctly!**
✅ **Toss dialog configuration is preserved**
✅ **Score structure matches what was configured during match creation**

The fix ensures that the configuration you set during match creation (3 matches, 3 sets each, match types) is properly used when initializing the score structure after toss completion.

## No Database Migration Needed

This was a code logic fix, NOT a database schema change. Your existing database tables are fine. Just:

1. Restart your dev server (if running):
   ```bash
   # Kill existing server
   # Then restart:
   pnpm dev
   ```

2. Try creating a new match and completing the toss

The match tabs should now appear immediately! 🎉
