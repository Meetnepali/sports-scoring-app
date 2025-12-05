# Match Deletion and Cascading Deletes - Database Changes

## Overview

This document describes the database changes required to support match deletion with proper cascading deletes and tournament cleanup.

## Features Implemented

1. **Match Deletion**
   - Matches can be deleted via API endpoint
   - Only scheduled or completed matches can be deleted
   - Live or started matches cannot be deleted (prevents data loss during active matches)

2. **Cascading Deletes**
   - When a match is deleted, related records are automatically cleaned up:
     - User match participation records
     - Sport-specific configuration records (cricket, volleyball, chess, etc.)
   - Group matches reference is set to NULL (preserves tournament structure)

3. **Tournament Deletion**
   - When a tournament is deleted, related matches are also deleted
   - Only non-live/non-started matches are deleted
   - Tournament structure (groups, bracket nodes) is preserved until matches are cleaned up

## Database Migration Files

### 1. `migration-cascade-deletes.sql`

This migration ensures proper foreign key constraints for cascading deletes:

**Changes:**
- `user_match_participation.match_id`: ON DELETE CASCADE
- `group_matches.match_id`: ON DELETE SET NULL
- `matches.tournament_id`: ON DELETE SET NULL
- All sport config tables: ON DELETE CASCADE

**To Run:**
```bash
psql -U postgres -d sports_scoring_db -f scripts/migration-cascade-deletes.sql
```

## API Endpoints

### DELETE /api/matches/[id]

Deletes a match with the following validations:

**Requirements:**
- Admin authentication required
- Match must exist
- Match status must NOT be "live" or "started"

**Response:**
- Success: `{ success: true, message: "Match deleted successfully" }`
- Error: `{ error: "Cannot delete a match that is currently live or started..." }`

**What Gets Deleted:**
1. User match participation records
2. Sport-specific configuration records:
   - `cricket_match_config`
   - `volleyball_match_config`
   - `chess_match_config`
   - `futsal_match_config`
   - `table_tennis_match_config`
   - `badminton_match_config`
3. The match record itself

**What Gets Preserved:**
- `group_matches` records (match_id set to NULL)
- Tournament structure
- Team records

## Tournament Deletion Behavior

When a tournament is deleted:

1. **Find Related Matches**
   - Matches linked via `group_matches.match_id`
   - Matches linked via `matches.tournament_id`

2. **Delete Non-Live Matches**
   - Only matches with status "scheduled" or "completed" are deleted
   - Live or started matches are preserved

3. **Delete Tournament**
   - Tournament record is deleted
   - Cascading deletes handle:
     - `tournament_sports`
     - `tournament_groups`
     - `group_teams`
     - `tournament_bracket_nodes`
     - `group_matches` (when match is deleted)

## Chess Scoreboard Updates

The chess scoreboard now includes:

1. **Save Functionality**
   - Game results are automatically saved to database
   - Team scores are calculated and saved
   - Real-time updates work with the save functionality

2. **Score Structure**
   ```json
   {
     "games": [
       {
         "player1": "player-id",
         "player2": "player-id",
         "result": "1-0" | "0-1" | "½-½" | "ongoing"
       }
     ],
     "teamScore": {
       "home": 2.5,
       "away": 1.5
     }
   }
   ```

## Database Schema Changes

### Foreign Key Constraints Updated

| Table | Column | References | On Delete |
|-------|--------|------------|-----------|
| `user_match_participation` | `match_id` | `matches.id` | CASCADE |
| `group_matches` | `match_id` | `matches.id` | SET NULL |
| `matches` | `tournament_id` | `tournaments.id` | SET NULL |
| `cricket_match_config` | `match_id` | `matches.id` | CASCADE |
| `volleyball_match_config` | `match_id` | `matches.id` | CASCADE |
| `chess_match_config` | `match_id` | `matches.id` | CASCADE |
| `futsal_match_config` | `match_id` | `matches.id` | CASCADE |
| `table_tennis_match_config` | `match_id` | `matches.id` | CASCADE |
| `badminton_match_config` | `match_id` | `matches.id` | CASCADE |

## Testing

### Test Match Deletion

1. **Create a scheduled match**
2. **Try to delete it** - Should succeed
3. **Start the match** (status = "started")
4. **Try to delete it** - Should fail with error message
5. **Complete the match** (status = "completed")
6. **Try to delete it** - Should succeed

### Test Tournament Deletion

1. **Create a tournament with matches**
2. **Start one match** (status = "started")
3. **Delete the tournament**
4. **Verify:**
   - Tournament is deleted
   - Scheduled/completed matches are deleted
   - Started match is preserved (orphaned)

### Test Chess Scoreboard

1. **Open a chess match**
2. **Update game results**
3. **Verify scores are saved**
4. **Refresh page** - Scores should persist
5. **Open in another browser** - Should see live updates

## Error Handling

### Match Deletion Errors

- **Match not found**: Returns 404
- **Match is live/started**: Returns 400 with descriptive message
- **Database error**: Returns 500

### Tournament Deletion Errors

- **Tournament not found**: Throws error
- **Database constraint violation**: Throws error with details

## Rollback

If you need to rollback the cascading delete changes:

1. Manually adjust foreign key constraints
2. Remove DELETE endpoint from API
3. Restore original tournament deletion logic

**Note:** This is generally not recommended as it reduces data integrity.

## Security Considerations

1. **Admin-Only Access**: Match deletion requires admin authentication
2. **Status Validation**: Prevents deletion of active matches
3. **Cascade Protection**: Database constraints prevent orphaned records

## Performance Considerations

- Deletion operations are fast (indexed foreign keys)
- Cascade operations are atomic (single transaction)
- No impact on read operations

## Future Enhancements

1. **Soft Deletes**: Mark matches as deleted instead of hard delete
2. **Audit Trail**: Log who deleted what and when
3. **Bulk Deletion**: Delete multiple matches at once
4. **Recovery**: Restore deleted matches from backup

