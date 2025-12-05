# Database Migration for Real-Time Scoring

## Overview

This migration adds real-time score update capabilities to the matches table using PostgreSQL triggers and NOTIFY functionality.

## Files

- `migration-realtime-scoring.sql` - Main migration script

## Prerequisites

- PostgreSQL database (version 9.5 or higher)
- Access to the `sports_scoring_db` database (or your configured database)
- Sufficient privileges to create triggers and functions

## Migration Steps

### Option 1: Using psql Command Line

```bash
psql -U postgres -d sports_scoring_db -f scripts/migration-realtime-scoring.sql
```

### Option 2: Using pgAdmin or Database GUI

1. Open your database management tool (pgAdmin, DBeaver, etc.)
2. Connect to your database
3. Open the SQL editor
4. Copy and paste the contents of `migration-realtime-scoring.sql`
5. Execute the script

### Option 3: Using Node.js Script

If you have a database initialization script, you can add this migration there.

## What This Migration Does

### 1. Adds New Columns

- **`version`** (INTEGER, DEFAULT 0)
  - Tracks the number of times a match's score or status has been updated
  - Increments automatically on each change
  - Used for conflict resolution on the client side

- **`updated_at`** (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
  - Records when the match was last updated
  - Automatically set to current timestamp on updates
  - Useful for auditing and debugging

### 2. Creates Trigger Function

The `notify_score_update()` function:
- Detects changes to `score` or `status` columns
- Increments the `version` column
- Updates the `updated_at` timestamp
- Builds a JSON payload with match information
- Sends a NOTIFY event to the `score_updates` channel

### 3. Creates Trigger

The `score_update_trigger` trigger:
- Fires BEFORE UPDATE on the matches table
- Executes the `notify_score_update()` function
- Ensures version and timestamp are updated before the row is saved

## Verification

After running the migration, verify it worked:

```sql
-- Check columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'matches' 
AND column_name IN ('version', 'updated_at');

-- Check trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'score_update_trigger';

-- Check function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'notify_score_update';
```

## Testing the Trigger

To test that the trigger works:

1. **Open a psql session and listen for notifications:**
   ```sql
   LISTEN score_updates;
   ```

2. **In another session, update a match:**
   ```sql
   UPDATE matches 
   SET score = '{"test": "value"}' 
   WHERE id = (SELECT id FROM matches LIMIT 1);
   ```

3. **You should see a notification in the first session:**
   ```
   Asynchronous notification "score_updates" with payload "{"matchId":"...","score":{...},"status":"...","version":1,"updatedAt":"..."}" received from server process...
   ```

## Rollback

If you need to rollback this migration:

```sql
DROP TRIGGER IF EXISTS score_update_trigger ON matches;
DROP FUNCTION IF EXISTS notify_score_update();
ALTER TABLE matches DROP COLUMN IF EXISTS version;
ALTER TABLE matches DROP COLUMN IF EXISTS updated_at;
```

**Warning:** Rolling back will remove real-time update functionality. Make sure to backup your data first.

## Impact on Existing Data

- Existing matches will have `version = 0` and `updated_at = created_at` (or current timestamp)
- No data loss occurs
- All existing functionality continues to work
- New updates will automatically use the trigger

## Performance Considerations

- The trigger is lightweight and only fires on actual changes
- NOTIFY is asynchronous and non-blocking
- Version increment is atomic
- Minimal performance impact on UPDATE operations

## Troubleshooting

### Error: "permission denied for schema public"

**Solution:** Grant necessary privileges:
```sql
GRANT CREATE ON SCHEMA public TO your_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO your_user;
```

### Error: "function already exists"

**Solution:** The migration script uses `CREATE OR REPLACE`, so this shouldn't happen. If it does, the function will be replaced.

### Trigger not firing

**Check:**
1. Trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'score_update_trigger';`
2. Function exists: `SELECT * FROM pg_proc WHERE proname = 'notify_score_update';`
3. Test with a manual UPDATE statement

### Notifications not received

**Check:**
1. LISTEN connection is active
2. Trigger is firing (check version increments)
3. No errors in PostgreSQL logs
4. Network/firewall allows connections

## Next Steps

After running this migration:

1. Restart your Next.js application
2. The server will automatically establish a LISTEN connection
3. Test real-time updates by:
   - Opening a match page in multiple browser windows
   - Updating a score as admin
   - Verifying all windows update automatically

## Support

If you encounter issues:
1. Check PostgreSQL logs for errors
2. Verify all migration steps completed successfully
3. Test the trigger manually using the testing steps above
4. Ensure your application has proper database connection configuration

