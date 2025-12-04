# Config Completed Logic Verification

## Question: Does "Start Match" set config_completed to true?

**Answer: NO** - "Start Match" only updates match status, it does NOT touch the config at all.

## Complete Flow Verification

### Step 1: Match Creation

**File**: `app/matches/create/page.tsx` (lines 184-193)

```javascript
// If cricket, save cricket-specific configuration
if (selectedSport === "cricket" && createdMatch?.id) {
  await fetch(`/api/matches/${createdMatch.id}/cricket/config`, {
    method: "POST",
    body: JSON.stringify({
      totalOvers: parseInt(cricketTotalOvers),
      maxOversPerBowler: parseInt(cricketMaxOversPerBowler),
      // NOTE: No tossWinnerTeamId or tossDecision sent
      // NOTE: No configCompleted sent - relies on API logic
    }),
  })
}
```

**API Route**: `app/api/matches/[id]/cricket/config/route.ts` (lines 96-111)

```javascript
// Create new config
const result = await query(
  `INSERT INTO cricket_match_config 
     (match_id, total_overs, max_overs_per_bowler, toss_winner_team_id, 
      toss_decision, elected_to_bat_first_team_id, config_completed)
   VALUES ($1, $2, $3, $4, $5, $6, $7)`,
  [
    id,
    totalOvers,
    maxOversPerBowler,
    tossWinnerTeamId || null,        // null (not provided)
    tossDecision || null,             // null (not provided)
    electedToBatFirstTeamId || null,  // null (not provided)
    tossWinnerTeamId && tossDecision ? true : false,  // null && null = FALSE
  ]
)
```

**Result**: `config_completed = FALSE` ✓

### Step 2: Admin Clicks "Start Match"

**File**: `app/matches/page.tsx` (lines 59-84)

```javascript
const handleStartMatch = async (matchId: string, e: React.MouseEvent) => {
  try {
    setStartingMatchId(matchId)
    await updateMatchStatus(matchId, 'live')  // <-- ONLY THIS
    
    toast({
      title: "Match Started!",
      description: "The match is now live. You can start scoring.",
    })
    
    await loadMatches()  // <-- Just reloads match list
  } catch (error) {
    // error handling
  }
}
```

**API Route**: `lib/server-data.ts` (lines 530-540)

```javascript
export async function updateMatchStatus(
  matchId: string,
  status: "scheduled" | "live" | "completed",
): Promise<void> {
  await query(`UPDATE matches SET status = $1 WHERE id = $2`, [status, matchId])
  // <-- ONLY updates matches table, does NOT touch cricket_match_config
}
```

**Result**: 
- Match status: `scheduled` → `live` ✓
- Config: **UNCHANGED** - `config_completed` still `FALSE` ✓

### Step 3: Admin Opens Match Page

**File**: `components/scoreboards/cricket-scoreboard-enhanced.tsx` (lines 113-136)

```javascript
const fetchConfig = async () => {
  try {
    setLoadingConfig(true)
    const response = await fetch(`/api/matches/${match.id}/cricket/config`)
    if (response.ok) {
      const data = await response.json()
      setConfig(data.config)  // config_completed = FALSE (from Step 1)
      
      // Check if we need to show toss dialog
      if (match.status === "live" && data.config && !data.config.config_completed) {
        setShowTossDialog(true)  // <-- Should show dialog
      }
    }
  } finally {
    setLoadingConfig(false)
  }
}
```

**Result**: Toss dialog should appear ✓

### Step 4: Admin Completes Toss

**File**: `components/cricket/toss-configuration-dialog.tsx` (line 41-95)

```javascript
const handleSave = async () => {
  // ... validation ...
  
  const response = await fetch(`/api/matches/${matchId}/cricket/config`, {
    method: "POST",
    body: JSON.stringify({
      totalOvers,
      maxOversPerBowler,
      tossWinnerTeamId: tossWinner,      // <-- NOW PROVIDED
      tossDecision,                       // <-- NOW PROVIDED
      electedToBatFirstTeamId,
    }),
  })
}
```

**API Route**: `app/api/matches/[id]/cricket/config/route.ts` (lines 69-94)

```javascript
if (existingConfig.rows.length > 0) {
  // Update existing config
  const result = await query(
    `UPDATE cricket_match_config 
     SET 
       total_overs = $1,
       max_overs_per_bowler = $2,
       toss_winner_team_id = $3,          // <-- NOW SET
       toss_decision = $4,                 // <-- NOW SET
       elected_to_bat_first_team_id = $5,
       config_completed = $6,              // <-- NOW TRUE
       updated_at = CURRENT_TIMESTAMP
     WHERE match_id = $7`,
    [
      totalOvers,
      maxOversPerBowler,
      tossWinnerTeamId || null,           // provided
      tossDecision || null,                // provided
      electedToBatFirstTeamId || null,
      tossWinnerTeamId && tossDecision ? true : false,  // true && true = TRUE
      id,
    ]
  )
}
```

**Result**: `config_completed = TRUE` ✓ (Only after toss is completed)

## Verification Summary

| Step | Action | config_completed Value | Code Location |
|------|--------|----------------------|---------------|
| 1 | Create Match | `FALSE` | `app/matches/create/page.tsx` → API creates config |
| 2 | Click "Start Match" | `FALSE` (unchanged) | `app/matches/page.tsx` → Only updates match status |
| 3 | Open Match Page | `FALSE` → Shows toss dialog | `cricket-scoreboard-enhanced.tsx` → Checks config |
| 4 | Complete Toss | `FALSE` → `TRUE` | `toss-configuration-dialog.tsx` → Updates config |

## Key Points

✅ **"Start Match" does NOT set config_completed to true**
- Only calls `updateMatchStatus(matchId, 'live')`
- Only updates `matches.status` column
- Does NOT touch `cricket_match_config` table at all

✅ **config_completed is only set to true when toss is completed**
- During match creation: `FALSE` (no toss data provided)
- After "Start Match": Still `FALSE` (config not touched)
- After toss completion: `TRUE` (toss data provided in API call)

✅ **Toss dialog logic is correct**
- Checks: `match.status === "live"` AND `!config.config_completed`
- Will show dialog if match is live and toss not completed

## Potential Issues (to check)

1. **Config not created during match creation**
   - If the API call fails silently, no config record exists
   - Match page would show error message instead of toss dialog
   - Check browser console for errors

2. **Race condition**
   - If match page opens before config is fully saved
   - Unlikely but possible with async operations

3. **Database default value**
   - Schema shows `DEFAULT FALSE` - this is correct
   - If somehow NULL gets inserted, need to handle that

## Recommended Fix (to be extra safe)

Make it explicit in match creation that `configCompleted: false`:

```javascript
// In app/matches/create/page.tsx
body: JSON.stringify({
  totalOvers: parseInt(cricketTotalOvers),
  maxOversPerBowler: parseInt(cricketMaxOversPerBowler),
  configCompleted: false,  // <-- EXPLICIT
}),
```

But the current logic should already work correctly because:
- No toss data provided → API sets `config_completed = false`

## Conclusion

**The logic is correct!** "Start Match" does NOT set `config_completed` to true. The toss dialog should appear when:
- Match status is "live" 
- Config exists
- `config_completed` is `false`

If the toss dialog is not appearing, check:
1. Is config being created during match creation?
2. Is config_completed actually false in database?
3. Are there any JavaScript errors in console?
4. Is the match status actually "live"?

