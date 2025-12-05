# Real-Time Scoring Implementation Documentation

## Overview

This document describes the implementation of real-time score updates using PostgreSQL LISTEN/NOTIFY triggers and Server-Sent Events (SSE). This system enables live score synchronization across all sports scoreboards without requiring page refreshes.

## Architecture

The real-time scoring system consists of three main components:

1. **Database Layer**: PostgreSQL triggers that detect score changes and send notifications
2. **Server Layer**: Node.js/Next.js backend that listens to database notifications and streams updates via SSE
3. **Client Layer**: React components that receive updates via EventSource and update the UI

### Flow Diagram

```
Admin Updates Score
    ↓
API Endpoint (PUT /api/matches/[id])
    ↓
Database UPDATE matches SET score = ...
    ↓
PostgreSQL Trigger (notify_score_update)
    ↓
NOTIFY score_updates channel
    ↓
Postgres LISTEN Client (lib/scoreEvents.ts)
    ↓
Subscriber Callbacks
    ↓
SSE Stream (/api/stream/match/[id])
    ↓
EventSource (Client Browser)
    ↓
React State Update
    ↓
Scoreboard UI Updates
```

## Before vs After

### Before Implementation

**Previous Behavior:**
- Users had to manually refresh the page to see score updates
- No real-time synchronization between multiple viewers
- Score updates were only visible after page reload
- Poor user experience during live matches

**Technical Limitations:**
- Client-side state was isolated
- No mechanism for server-to-client push updates
- Each user had independent state that could become stale

### After Implementation

**New Behavior:**
- Scores update automatically in real-time without page refresh
- All viewers see updates simultaneously
- Version-based conflict resolution prevents out-of-order updates
- Seamless live match viewing experience

**Technical Improvements:**
- Server-pushed updates via SSE
- Database-level change detection via triggers
- Efficient event distribution to multiple clients
- Automatic reconnection on connection loss

## Database Schema Changes

### New Columns Added to `matches` Table

```sql
ALTER TABLE matches 
ADD COLUMN version INTEGER DEFAULT 0,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

**Purpose:**
- `version`: Increments on each score/status change to track update order
- `updated_at`: Timestamp of the last update for debugging and auditing

### Trigger Function

**File**: `lib/init-db.ts`

The trigger function `notify_score_update()` is created to:

1. Detect changes to `score` or `status` columns
2. Increment the `version` column
3. Update the `updated_at` timestamp
4. Build a JSON payload with match information
5. Send a NOTIFY event to the `score_updates` channel

```sql
CREATE OR REPLACE FUNCTION notify_score_update()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
BEGIN
  -- Check if score or status changed
  IF (OLD.score IS DISTINCT FROM NEW.score) OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Increment version
    NEW.version := COALESCE(OLD.version, 0) + 1;
    NEW.updated_at := CURRENT_TIMESTAMP;
    
    -- Build JSON payload
    payload := jsonb_build_object(
      'matchId', NEW.id::text,
      'score', NEW.score,
      'status', NEW.status,
      'version', NEW.version,
      'updatedAt', NEW.updated_at
    );
    
    -- Send NOTIFY
    PERFORM pg_notify('score_updates', payload::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Trigger Definition

```sql
CREATE TRIGGER score_update_trigger
BEFORE UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION notify_score_update();
```

**Key Points:**
- Trigger fires BEFORE UPDATE to allow version increment
- Only triggers on actual changes to score or status
- Uses `pg_notify()` to send notifications to listening clients

## Server-Side Implementation

### Score Events Module

**File**: `lib/scoreEvents.ts`

This module manages the Postgres LISTEN connection and subscriber management.

#### Key Components

1. **Dedicated LISTEN Connection**
   - Separate from the connection pool
   - Maintains persistent connection for notifications
   - Handles reconnection on errors

2. **Subscriber Map**
   ```typescript
   const subscribers = new Map<string, Set<(data: any) => void>>()
   ```
   - Maps matchId to a set of callback functions
   - Each callback represents one client connection

3. **Subscribe Function**
   ```typescript
   subscribeToScoreUpdates(matchId, callback)
   ```
   - Adds callback to subscriber set for a match
   - Ensures LISTEN connection is established
   - Returns unsubscribe function

4. **Notification Handler**
   - Parses JSON payload from NOTIFY
   - Forwards update to all subscribers for that match
   - Handles errors gracefully

#### Connection Management

- Single connection shared across all matches
- Automatic reconnection on connection loss
- Cleanup function for graceful shutdown

### SSE API Route

**File**: `app/api/stream/match/[matchId]/route.ts`

This route provides Server-Sent Events streaming for score updates.

#### Implementation Details

1. **Response Setup**
   - Content-Type: `text/event-stream`
   - Cache-Control: `no-cache, no-transform`
   - Connection: `keep-alive`

2. **Stream Creation**
   - Uses ReadableStream for SSE
   - Subscribes to score updates for the match
   - Sends keep-alive comments every 25 seconds

3. **Message Format**
   ```
   data: {"matchId":"...","score":{...},"status":"live","version":5,"updatedAt":"..."}
   
   ```

4. **Error Handling**
   - Catches subscription errors
   - Sends error events to client
   - Handles client disconnection gracefully

5. **Cleanup**
   - Unsubscribes on client disconnect
   - Clears keep-alive interval
   - Closes stream properly

## Client-Side Implementation

### Match Detail Page

**File**: `app/matches/[id]/page.tsx`

#### EventSource Integration

```typescript
useEffect(() => {
  if (!match || loading) return

  const eventSource = new EventSource(`/api/stream/match/${id}`)

  eventSource.onmessage = (event) => {
    const updateData = JSON.parse(event.data)
    const { version, score, status } = updateData

    // Only update if version is newer
    if (version > currentVersion) {
      setCurrentVersion(version)
      setMatch((prevMatch) => ({
        ...prevMatch,
        score: score,
        status: status,
      }))
    }
  }

  return () => {
    eventSource.close()
  }
}, [id, match, loading, currentVersion])
```

#### Key Features

1. **Version Comparison**
   - Tracks current version in state
   - Only applies updates with higher version numbers
   - Prevents out-of-order or duplicate updates

2. **State Updates**
   - Updates match state with new score/status
   - Triggers re-render of scoreboard components
   - Preserves other match data

3. **Connection Management**
   - Creates connection on mount
   - Closes on unmount
   - EventSource handles automatic reconnection

### Scoreboard Components

All scoreboard components have been updated to sync with match prop changes:

- `components/scoreboards/badminton-scoreboard.tsx`
- `components/scoreboards/table-tennis-scoreboard.tsx`
- `components/scoreboards/cricket-scoreboard-enhanced.tsx`
- `components/scoreboards/volleyball-scoreboard.tsx`
- `components/scoreboards/chess-scoreboard.tsx`
- `components/scoreboards/futsal-scoreboard.tsx`

#### Sync Pattern

Each scoreboard includes a useEffect hook that:

1. Watches for changes to `match.score` and `match.status`
2. Parses the new score data
3. Updates local state only if data actually changed
4. Preserves existing scoring logic and admin controls

**Example (Badminton):**

```typescript
useEffect(() => {
  if (match.score) {
    const newScore = {
      games: Array.isArray(match.score.games) ? match.score.games.map(...) : score.games,
      currentGame: Number(match.score.currentGame) ?? score.currentGame,
      servingPlayer: match.score.servingPlayer || score.servingPlayer,
      // ... other fields
    }
    
    // Only update if score actually changed
    if (JSON.stringify(newScore.games) !== JSON.stringify(score.games) ||
        newScore.currentGame !== score.currentGame) {
      setScore(newScore)
      setCurrentGame(newScore.currentGame)
      setServingPlayer(newScore.servingPlayer)
    }
  }
}, [match.score, match.status])
```

## Data Flow

### Score Update Flow

1. **Admin Action**
   - Admin clicks score button in scoreboard
   - Scoreboard component calls update function
   - API request sent to `/api/matches/[id]`

2. **API Processing**
   - `updateMatchScore()` or `updateMatchStatus()` called
   - Database UPDATE executed
   - Trigger fires automatically

3. **Trigger Execution**
   - Detects score/status change
   - Increments version
   - Builds JSON payload
   - Sends NOTIFY to `score_updates` channel

4. **Event Distribution**
   - Postgres LISTEN client receives notification
   - Parses JSON payload
   - Finds all subscribers for matchId
   - Calls each subscriber callback

5. **SSE Streaming**
   - Callback writes to SSE stream
   - Message sent to client browser
   - EventSource receives message

6. **Client Update**
   - EventSource `onmessage` handler fires
   - Version compared with current version
   - Match state updated if version is newer
   - Scoreboard components re-render with new data

### Connection Flow

1. **Client Connects**
   - User navigates to match page
   - EventSource created
   - GET request to `/api/stream/match/[id]`

2. **Server Setup**
   - SSE route handler executes
   - Subscribes to score updates
   - Stream created and returned

3. **Keep-Alive**
   - Server sends comment every 25 seconds
   - Prevents connection timeout
   - Maintains active connection

4. **Client Disconnect**
   - User navigates away
   - EventSource.close() called
   - Unsubscribe callback executed
   - Stream closed

## Error Handling

### Database Level

- Trigger errors are logged but don't block updates
- NOTIFY failures are silent (non-blocking)

### Server Level

- LISTEN connection errors trigger reconnection
- Subscriber callback errors are caught and logged
- SSE stream errors are handled gracefully

### Client Level

- EventSource automatically reconnects on errors
- Parse errors are caught and logged
- Version comparison prevents invalid updates

## Performance Considerations

### Database

- Trigger is lightweight (only fires on actual changes)
- NOTIFY is asynchronous and non-blocking
- Version increment is atomic

### Server

- Single LISTEN connection shared across all matches
- In-memory subscriber map (fast lookups)
- Efficient event distribution

### Client

- EventSource uses HTTP/1.1 long polling (browser-native)
- Version comparison prevents unnecessary updates
- Selective state updates (only changed fields)

### Scalability

- Supports multiple concurrent viewers per match
- Single LISTEN connection handles all matches
- Subscriber map scales with number of active viewers
- Keep-alive prevents connection exhaustion

## Testing Guide

### Manual Testing Steps

1. **Basic Score Update**
   - Open match page in two browser windows
   - Update score in one window (as admin)
   - Verify score updates in second window automatically

2. **Version Comparison**
   - Simulate out-of-order update (modify version manually)
   - Verify older updates are ignored

3. **Connection Loss**
   - Disconnect network temporarily
   - Verify automatic reconnection
   - Verify updates resume after reconnection

4. **Multiple Matches**
   - Open multiple match pages
   - Update scores on different matches
   - Verify each page only receives its own updates

5. **All Sports**
   - Test with each sport type:
     - Cricket
     - Volleyball
     - Chess
     - Futsal
     - Table Tennis
     - Badminton

### Automated Testing (Future)

- Unit tests for trigger function
- Integration tests for SSE route
- E2E tests for client updates

## Troubleshooting

### Common Issues

1. **Updates Not Appearing**
   - Check browser console for EventSource errors
   - Verify SSE route is accessible
   - Check database trigger is active
   - Verify LISTEN connection is established

2. **Connection Drops**
   - Check network stability
   - Verify keep-alive is working
   - Check server logs for errors
   - EventSource should auto-reconnect

3. **Out-of-Order Updates**
   - Verify version comparison logic
   - Check version column is incrementing
   - Ensure trigger is firing correctly

4. **Performance Issues**
   - Check number of active connections
   - Monitor LISTEN connection health
   - Verify subscriber cleanup on disconnect

### Debugging

**Server Logs:**
- LISTEN connection status
- Subscriber counts
- Notification delivery

**Client Logs:**
- EventSource connection status
- Received messages
- Version comparisons

**Database:**
- Check trigger is active: `SELECT * FROM pg_trigger WHERE tgname = 'score_update_trigger';`
- Verify version increments: `SELECT id, version, updated_at FROM matches WHERE id = '...';`

## Future Enhancements

1. **WebSocket Support**
   - Replace SSE with WebSocket for bidirectional communication
   - Enable real-time chat or comments

2. **Optimistic Updates**
   - Update UI immediately on admin action
   - Revert if server update fails

3. **Batch Updates**
   - Group multiple score changes
   - Reduce notification frequency

4. **Presence Indicators**
   - Show who is currently viewing match
   - Display active viewer count

5. **Historical Updates**
   - Store update history
   - Allow replay of match progression

## Conclusion

The real-time scoring implementation provides a seamless live viewing experience for all sports. The architecture is scalable, efficient, and maintains data consistency through version-based conflict resolution. The system works transparently with existing scoring logic while adding real-time synchronization capabilities.

