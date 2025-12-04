# Match Status Flow - Complete Implementation

## Status Cycle

The match status follows this cycle:

```
Scheduled → Started → Live → Completed
```

## Detailed Flow

### 1. **Scheduled** (Initial State)
- Match is created by admin
- Sport-specific configuration saved (e.g., total overs for cricket, number of sets for volleyball)
- `config_completed = false`
- Match appears in "Scheduled" tab
- **No scoring allowed** - shows message: "Match is scheduled. Start the match to begin configuration."

### 2. **Started** (After "Start Match" Button Clicked)
- Admin clicks "Start Match" button
- Status changes: `scheduled` → `started`
- Match appears in "Live" tab (along with actual live matches)
- Shows badge: "Started" (yellow/orange indicator)
- **Toss/Configuration Required**
- When admin opens match page:
  - Toss dialog appears automatically (if config not completed)
  - Admin must complete toss/configuration
- **No scoring allowed yet** - waiting for toss

### 3. **Live** (After Toss Completed)
- Admin completes toss/configuration
- Status automatically changes: `started` → `live`
- `config_completed = true` (saved in database)
- Shows badge: "Live" (red indicator with pulsing dot)
- **Scoring interface becomes available**
- Admin can now score the match ball-by-ball

### 4. **Completed** (Match Finished)
- Match reaches completion (all innings/sets finished, or manually ended)
- Status changes: `live` → `completed`
- Shows badge: "Final"
- **Scoring locked** - view-only scorecard available
- Man of the match can be selected (if not already done)

## Implementation Details

### Type Definitions

**File**: `lib/static-data.ts`
```typescript
status: "scheduled" | "started" | "live" | "completed"
```

All status type definitions have been updated across:
- `lib/static-data.ts`
- `lib/client-api.ts`
- `lib/server-data.ts`
- `app/api/matches/route.ts`
- All scoreboard components

### Key Functions

#### 1. Start Match (`app/matches/page.tsx`)
```typescript
handleStartMatch() {
  await updateMatchStatus(matchId, 'started')  // NOT 'live'
  // Status: scheduled → started
}
```

#### 2. Toss Completion (`components/scoreboards/cricket-scoreboard-enhanced.tsx`, `volleyball-scoreboard.tsx`)
```typescript
handleTossComplete() {
  // Save toss data
  // Then update match status if needed
  if (match.status === "started") {
    await updateMatchStatus(matchId, 'live')
    // Status: started → live
  }
}
```

#### 3. Scoreboard Logic

**Cricket** (`cricket-scoreboard-enhanced.tsx`):
- Checks: `match.status === "started" || match.status === "live"` for toss dialog
- Shows toss dialog when: status is started/live AND config_completed = false
- Scoring enabled only when: status === "live" AND config_completed = true

**Volleyball** (`volleyball-scoreboard.tsx`):
- Same logic as cricket
- Checks for started/live status for toss
- Scoring controls only enabled when status === "live"

## Status Checks in Scoreboards

### Scheduled
```typescript
if (match.status === "scheduled") {
  // Show: "Match is scheduled. Start the match to begin configuration."
  // No toss dialog
  // No scoring controls
}
```

### Started (Toss Required)
```typescript
if ((match.status === "started" || match.status === "live") && !config.config_completed) {
  // Show toss dialog automatically
  // No scoring controls
}
```

### Live (Scoring Enabled)
```typescript
if (match.status === "live" && config.config_completed) {
  // Show full scoring interface
  // All scoring buttons enabled
}
```

## Database Schema

No changes needed - status column already supports VARCHAR(50):
```sql
status VARCHAR(50) DEFAULT 'scheduled'
```

Valid values:
- `'scheduled'`
- `'started'` (new)
- `'live'`
- `'completed'`

## UI Changes

### Match List Item (`components/match-list-item.tsx`)
- Shows "Started" badge (yellow/orange) for started matches
- Shows "Live" badge (red with pulsing dot) for live matches
- Shows "Upcoming" badge (gray) for scheduled matches
- Shows "Final" badge (gray) for completed matches

### Matches Page (`app/matches/page.tsx`)
- "Live" tab now shows both:
  - Started matches (need toss/configuration)
  - Live matches (actively being scored)
- "Scheduled" tab shows scheduled matches
- "Completed" tab shows completed matches

### Scoreboards
- **Scheduled**: Shows message, no controls
- **Started**: Shows toss dialog, no scoring
- **Live**: Full scoring interface
- **Completed**: View-only scorecard

## Flow Diagram

```
┌─────────────┐
│  Scheduled  │ ← Match created
└──────┬──────┘
       │
       │ Admin clicks "Start Match"
       ▼
┌─────────────┐
│   Started   │ ← Toss dialog appears
└──────┬──────┘
       │
       │ Admin completes toss
       ▼
┌─────────────┐
│    Live     │ ← Scoring enabled
└──────┬──────┘
       │
       │ Match finishes
       ▼
┌─────────────┐
│  Completed  │ ← View-only
└─────────────┘
```

## Benefits

1. **Clear Separation**: Toss phase is separate from scoring phase
2. **No Accidents**: Can't accidentally score before toss is done
3. **Better UX**: Clear visual indicators for each phase
4. **Consistent**: Same flow for all sports (cricket, volleyball, etc.)
5. **Audit Trail**: Status changes tracked in database

## Testing Checklist

- [ ] Create match → Status is "scheduled"
- [ ] Click "Start Match" → Status changes to "started"
- [ ] Open started match → Toss dialog appears
- [ ] Complete toss → Status changes to "live"
- [ ] Score match → All controls work
- [ ] Complete match → Status changes to "completed"
- [ ] Refresh page → Correct status maintained
- [ ] Started matches show in "Live" tab
- [ ] Scoring buttons disabled for started matches
- [ ] Scoring buttons enabled for live matches

## Migration Notes

**No database migration needed** - the status column already accepts any VARCHAR(50) value.

However, if you have existing matches with status "live" that haven't completed toss:
1. They should still work (backward compatible)
2. Or manually update them:
   ```sql
   UPDATE matches SET status = 'started' 
   WHERE status = 'live' 
   AND id IN (
     SELECT match_id FROM cricket_match_config 
     WHERE config_completed = false
   );
   ```

## Future Enhancements

- Add "started" status to other sports scoreboards
- Add status transition history/audit log
- Add admin ability to manually change status
- Add status badges to match cards on home page

