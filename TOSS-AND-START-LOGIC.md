# Toss and Start Match Logic - Cricket & Volleyball

## Overview
This document explains how the toss configuration and match start logic works for both Cricket and Volleyball matches.

## Flow Diagram

```
1. CREATE MATCH
   ├─ Admin creates match (scheduled status)
   ├─ Sport-specific config saved (overs/sets)
   └─ Match appears in "Scheduled" tab

2. START MATCH  
   ├─ Admin clicks "Start Match" button
   ├─ Match status changes: scheduled → live
   └─ Match moves to "Live" tab

3. OPEN LIVE MATCH
   ├─ Admin opens match page
   ├─ System checks match status (must be "live")
   ├─ System fetches sport-specific config
   └─ Decision point:

4. TOSS CHECK
   ├─ IF config exists AND config_completed = false
   │  └─ Show Toss Dialog automatically
   ├─ IF config exists AND config_completed = true  
   │  └─ Show Scoring Interface (toss already done)
   └─ IF no config exists
      └─ Show error message (shouldn't happen)

5. COMPLETE TOSS
   ├─ Admin selects toss winner and decision
   ├─ Config updated with toss details
   ├─ config_completed set to true
   └─ Scoring interface appears

6. SCORING
   └─ Admin can now score the match
```

## Cricket Logic

### Match Creation
- Admin selects cricket as sport
- Enters:
  - Total overs (5, 10, 20, 50)
  - Max overs per bowler (custom)
- Config saved to `cricket_match_config` table
- `config_completed = false` initially

### Starting Match
1. Admin clicks "Start Match" on scheduled match
2. Status changes from `scheduled` → `live`
3. No toss dialog yet (hasn't opened match page)

### Opening Match (First Time)
1. Match page loads
2. `fetchConfig()` called:
   - Fetches from `/api/matches/[id]/cricket/config`
   - Sets `config` state
   - Sets `loadingConfig = false`

3. `useEffect` hook checks:
   ```javascript
   if (match.status === "live" && !loadingConfig && config && !config.config_completed) {
     setShowTossDialog(true)  // Auto-open dialog
   }
   ```

4. **Toss Dialog Appears** (cannot be bypassed)
   - Shows: Toss winner selection
   - Shows: Decision (Bat/Bowl first)
   - Must complete before scoring

5. Admin completes toss:
   - Saves to database
   - Updates local config state
   - Sets `config_completed = true`
   - Dialog closes

6. Scoring interface appears

### Opening Match (After Toss Completed)
1. Match page loads
2. Config fetched
3. `config_completed = true`
4. **No dialog shown** - goes straight to scoring

### Opening Match (Scheduled Status)
1. Match page loads
2. Shows: "Match is scheduled. Start the match to begin scoring."
3. **No toss dialog** - cannot score yet

## Volleyball Logic

### Match Creation
- Admin selects volleyball as sport
- Enters:
  - Number of sets (Best of 3 or Best of 5)
- Config saved to `volleyball_match_config` table
- `config_completed = false` initially

### Starting Match
1. Admin clicks "Start Match" on scheduled match
2. Status changes from `scheduled` → `live`
3. No toss dialog yet (hasn't opened match page)

### Opening Match (First Time)
1. Match page loads
2. `fetchConfig()` called:
   - Fetches from `/api/matches/[id]/volleyball/config`
   - Sets `volleyballConfig` state
   - Sets `loadingConfig = false`

3. `useEffect` hook checks:
   ```javascript
   if (match.status === "live" && !loadingConfig && volleyballConfig && !volleyballConfig.configCompleted) {
     setShowTossDialog(true)  // Auto-open dialog
   }
   ```

4. **Toss Dialog Appears** (cannot be bypassed)
   - Shows: Toss winner selection
   - Shows: Decision (Court Side or Serve first)
   - Shows: Court side selection (if applicable)
   - Must complete before scoring

5. Admin completes toss:
   - Saves to database
   - Updates local config state
   - Sets `configCompleted = true`
   - Sets serving team in score
   - Dialog closes

6. Scoring interface appears

### Opening Match (After Toss Completed)
1. Match page loads
2. Config fetched
3. `configCompleted = true`
4. **No dialog shown** - goes straight to scoring

### Opening Match (Scheduled Status)
1. Match page loads
2. Shows: "Match is scheduled. Start the match to begin scoring."
3. **No toss dialog** - cannot score yet

## Key Conditions

### Toss Dialog Shows When:
✅ Match status is `"live"`
✅ Config exists in database
✅ `config_completed` is `false`
✅ Config loading is complete

### Toss Dialog Does NOT Show When:
❌ Match status is `"scheduled"`
❌ Match status is `"completed"`
❌ Config doesn't exist (error state)
❌ `config_completed` is `true` (already done)

## Implementation Details

### Cricket Files
- `components/scoreboards/cricket-scoreboard-enhanced.tsx`
  - Main scoreboard component
  - Handles toss dialog logic
  - Manages match state

- `components/cricket/toss-configuration-dialog.tsx`
  - Toss UI component
  - Validates inputs
  - Saves to database

- `app/api/matches/[id]/cricket/config/route.ts`
  - GET: Fetch config
  - POST: Save/update config

### Volleyball Files
- `components/scoreboards/volleyball-scoreboard.tsx`
  - Main scoreboard component
  - Handles toss dialog logic
  - Manages match state

- `components/volleyball/toss-configuration-dialog.tsx`
  - Toss UI component
  - Validates inputs
  - Saves to database

- `app/api/matches/[id]/volleyball/config/route.ts`
  - GET: Fetch config
  - POST: Save/update config

## State Management

### Cricket State Flow
```
1. Component mounts
   └─ loadingConfig = true

2. fetchConfig() called
   └─ API request sent

3. Config received
   ├─ config = { ...configData }
   └─ loadingConfig = false

4. useEffect checks conditions
   └─ If all conditions met → showTossDialog = true

5. Toss completed
   ├─ config.config_completed = true
   └─ showTossDialog = false

6. Scoring begins
   └─ Full interface visible
```

### Volleyball State Flow
```
1. Component mounts
   └─ loadingConfig = true

2. fetchConfig() called
   └─ API request sent

3. Config received
   ├─ volleyballConfig = { ...configData }
   ├─ Score initialized with sets
   └─ loadingConfig = false

4. useEffect checks conditions
   └─ If all conditions met → showTossDialog = true

5. Toss completed
   ├─ volleyballConfig.configCompleted = true
   ├─ Serving team set in score
   └─ showTossDialog = false

6. Scoring begins
   └─ Full interface visible
```

## Error Handling

### Config Not Found
- Shows error message
- Prompts to ensure match was created properly
- Config should be created during match creation

### Match Not Live
- Shows "Match is scheduled" message
- No scoring controls visible
- Toss dialog doesn't appear

### Network Errors
- Logged to console
- User sees error toast
- Can retry by refreshing page

## Testing Checklist

### Cricket
- [ ] Create cricket match → Config saved
- [ ] Match shows as "scheduled"
- [ ] Cannot score scheduled match
- [ ] Click "Start Match" → Status changes to "live"
- [ ] Open live match → Toss dialog appears automatically
- [ ] Complete toss → Dialog closes, scoring interface appears
- [ ] Refresh page → No toss dialog (already completed)
- [ ] Score match normally

### Volleyball
- [ ] Create volleyball match → Config saved
- [ ] Match shows as "scheduled"
- [ ] Cannot score scheduled match
- [ ] Click "Start Match" → Status changes to "live"
- [ ] Open live match → Toss dialog appears automatically
- [ ] Complete toss → Dialog closes, scoring interface appears
- [ ] Refresh page → No toss dialog (already completed)
- [ ] Score match normally

## Common Issues & Solutions

### Issue: Toss dialog appears for scheduled match
**Cause**: Logic not checking match status properly
**Fix**: Added explicit check: `match.status === "live"`

### Issue: Toss dialog doesn't appear when match becomes live
**Cause**: useEffect not watching match.status changes
**Fix**: Added separate useEffect to watch status changes

### Issue: Dialog appears even after toss completed
**Cause**: Config not updating local state properly
**Fix**: State updated immediately after toss save

### Issue: Can bypass toss dialog
**Cause**: Dialog not blocking interaction
**Fix**: Dialog prevents interaction outside (onInteractOutside blocked)

## Summary

Both Cricket and Volleyball follow the same pattern:
1. **Create** → Config saved (incomplete)
2. **Start** → Status → live
3. **Open** → Check config → Show toss if needed
4. **Toss** → Complete → Enable scoring
5. **Score** → Normal match scoring

The key is that toss **only happens once** when the match is first opened after being started, and it **cannot be bypassed** if not completed yet.

