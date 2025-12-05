# Real-Time Score Updates Fix

## Problem
Score changes made by admins were not immediately visible to other users (non-admins) viewing the match. The scores only updated after the match was completed or when users manually refreshed the page.

## Root Cause
The scoreboards were updating their **local React state** when admins changed scores, but these changes were **not being persisted to the database** during gameplay. The score was only saved when:
- The match was completed
- Specific game/set configuration changes were saved

This meant the real-time update infrastructure (PostgreSQL LISTEN/NOTIFY + Server-Sent Events) was working correctly, but there was no data being broadcast because the database wasn't being updated.

## Solution
Added **automatic score persistence** with debouncing to all scoreboard components. Now, whenever an admin changes the score:

1. **Local state updates** immediately (instant UI feedback for admin)
2. **Database persistence** happens automatically after 500ms of inactivity (debounced)
3. **PostgreSQL trigger fires** when the database is updated
4. **NOTIFY event broadcasts** the change to all listening clients
5. **Server-Sent Events (SSE)** deliver the update to all connected browsers
6. **All users see the update** in real-time via the sync `useEffect` hooks

## Architecture Flow

```
Admin changes score
    ↓
Local state updates (immediate)
    ↓
Debounced API call (500ms)
    ↓
PUT /api/matches/{id} with new score
    ↓
UPDATE matches SET score = ... (SQL)
    ↓
score_update_trigger fires (PostgreSQL)
    ↓
NOTIFY 'score_updates' (PostgreSQL)
    ↓
subscribeToScoreUpdates receives event (Node.js)
    ↓
SSE broadcasts to all connected clients
    ↓
EventSource.onmessage fires (Browser)
    ↓
setMatch updates with new score
    ↓
Sync useEffect in scoreboards updates local state
    ↓
All users see the updated score
```

## Files Modified

### 1. Table Tennis Scoreboard
**File:** `components/scoreboards/table-tennis-scoreboard.tsx`

**Changes:**
- Added `useRef` import for timeout management
- Added `updateMatchScore` import from `@/lib/client-api`
- Added persistence `useEffect` hook with 500ms debouncing
- Auto-saves score whenever: sets, currentSet, servingPlayer, pointsToWin, setsToWin, or isDoubles changes
- Only runs when `isAdmin` and `canScore` are true

### 2. Volleyball Scoreboard
**File:** `components/scoreboards/volleyball-scoreboard.tsx`

**Changes:**
- Added `useRef` import for timeout management
- Added `updateMatchScore` import from `@/lib/client-api`
- Added `useAuth` import and extracted `isAdmin`
- Added persistence `useEffect` hook with 500ms debouncing
- Auto-saves the entire `score` object whenever it changes
- Only runs when match is live/started and config is completed

### 3. Badminton Scoreboard
**File:** `components/scoreboards/badminton-scoreboard.tsx`

**Changes:**
- Added `useRef` import for timeout management
- Added `updateMatchScore` import from `@/lib/client-api`
- Added persistence `useEffect` hook with 500ms debouncing
- Auto-saves score whenever: games, currentGame, servingPlayer, pointsToWin, gamesToWin, or isDoubles changes
- Only runs when `isAdmin` and `canScore` are true

### 4. Cricket Scoreboard
**File:** `components/scoreboards/cricket-scoreboard-enhanced.tsx`

**Changes:**
- Added `useRef` import for timeout management
- Added `updateMatchScore` import from `@/lib/client-api`
- Added persistence `useEffect` hook with 500ms debouncing
- Auto-saves the entire `score` object whenever it or `currentInnings` changes
- Only runs when admin is actively scoring and config is completed

### 5. Futsal Scoreboard
**File:** `components/scoreboards/futsal-scoreboard.tsx`

**Changes:**
- Added `useRef` import for timeout management
- Already had `updateMatchScore` imported
- Added persistence `useEffect` hook with 500ms debouncing
- Auto-saves the entire `score` object whenever it changes
- Only runs when match is live/started and config is completed

### 6. Chess Scoreboard
**File:** `components/scoreboards/chess-scoreboard.tsx`

**Changes:**
- Added `useRef` import for timeout management
- Added `updateMatchScore` import from `@/lib/client-api`
- Added persistence `useEffect` hook with 500ms debouncing
- Auto-saves games and teamScore whenever they change
- Only runs when match is live/started and config is completed

## Key Implementation Details

### Debouncing (500ms)
- Prevents excessive API calls when admins rapidly update scores
- Balances responsiveness with server load
- Last change triggers the save after 500ms of inactivity

### Conditional Persistence
Each scoreboard only saves when:
- Match is in an active state (`live` or `started`)
- Configuration is completed (where applicable)
- User has admin privileges (for sports with admin checks)

### Error Handling
- Errors are logged to console
- No error toasts shown to avoid spam during rapid scoring
- Failed saves don't block UI updates (optimistic updates)

### Cleanup
- Timeouts are properly cleared on component unmount
- Prevents memory leaks and stale updates

## Existing Infrastructure Used

### Database Trigger
Already existed: `score_update_trigger` on `matches` table
- Fires on UPDATE when `score` or `status` changes
- Increments `version` column
- Updates `updated_at` timestamp
- Sends NOTIFY to `score_updates` channel

### Server-Sent Events (SSE)
Already existed: `/api/stream/match/[matchId]/route.ts`
- Subscribes to PostgreSQL NOTIFY events
- Maintains persistent HTTP connection
- Broadcasts updates to connected clients
- Sends keep-alive messages every 25 seconds

### Client-Side SSE Listener
Already existed: `app/matches/[id]/page.tsx`
- Creates EventSource connection
- Listens for score updates
- Uses version control to prevent duplicate updates
- Updates match state reactively

### Sync Logic
Already existed: All scoreboards had `useEffect` hooks that sync local state with match prop changes
- These hooks now receive the updates from SSE
- Local state updates automatically when match prop changes

## Testing Checklist

To verify the fix works:

1. **Setup:**
   - Open match page as admin in one browser/tab
   - Open same match page as non-admin in another browser/tab
   - Ensure match is in "live" or "started" status

2. **Test Score Updates:**
   - As admin: Change score (add points, change set/game)
   - As non-admin: Verify score updates within 1 second
   - Check browser console for "Error auto-saving score" (should not appear)

3. **Test Rapid Changes:**
   - As admin: Rapidly click score buttons
   - Verify no excessive API calls (check Network tab)
   - Verify final score is correct on both screens

4. **Test Multiple Users:**
   - Open match on 3+ devices/browsers
   - Change score on one
   - Verify all others update simultaneously

5. **Test Network Issues:**
   - Throttle network in DevTools
   - Change score as admin
   - Verify updates still arrive (may be delayed)

6. **Test All Sports:**
   - Table Tennis
   - Volleyball
   - Badminton
   - Cricket
   - Futsal
   - Chess

## Performance Considerations

### Database Load
- Each score change triggers one UPDATE query after 500ms
- Trigger logic is minimal (version increment + NOTIFY)
- Indexes on `matches.id` ensure fast updates

### Network Load
- SSE connections are persistent but lightweight
- Keep-alive messages every 25 seconds
- Actual updates only sent when scores change

### Client Load
- Debounced saves prevent excessive re-renders
- Version control prevents duplicate state updates
- Sync logic only runs when props actually change

## Rollback Plan

If issues arise, you can:

1. **Disable auto-save in specific sport:**
   - Comment out the persistence `useEffect` in that scoreboard
   - Scores will still save on match completion

2. **Increase debounce time:**
   - Change `500` to `1000` or higher for less frequent saves

3. **Disable real-time updates entirely:**
   - Stop the SSE connection in `app/matches/[id]/page.tsx`
   - Users will need to refresh to see updates

## Future Enhancements

1. **Visual Indicator:** Show "Saving..." or "Synced" indicator
2. **Offline Support:** Queue updates when offline, sync when back online
3. **Conflict Resolution:** Handle concurrent edits by multiple admins
4. **Compression:** Use binary format for score updates to reduce bandwidth
5. **WebSockets:** Consider WebSocket alternative for bidirectional communication

## Related Files

- `lib/scoreEvents.ts` - PostgreSQL LISTEN/NOTIFY management
- `app/api/stream/match/[matchId]/route.ts` - SSE endpoint
- `app/api/matches/[id]/route.ts` - Score update API
- `lib/server-data.ts` - Database operations
- `lib/client-api.ts` - Client-side API wrapper
- `scripts/migration-realtime-scoring.sql` - Database trigger setup

All changes are backward compatible and use existing infrastructure.

