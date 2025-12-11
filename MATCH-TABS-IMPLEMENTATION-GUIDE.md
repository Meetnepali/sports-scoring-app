# Database Migration and Scoreboard Update - Summary

## What Was Done

### 1. **Scoreboard Updates** ✅
Both badminton and table tennis scoreboards have been updated to show match-level tabs with sets nested inside:

- **Match Tabs**: When you have 3 matches configured, you'll see "Match 1", "Match 2", "Match 3" tabs
- **Inside Each Match Tab**: Shows the current set score and a table of all sets for that specific match
- **Match Wins Summary**: Overall match wins display at the bottom

#### Files Modified:
- `components/scoreboards/badminton-scoreboard.tsx` - Added nested match/set structure
- `components/scoreboards/table-tennis-scoreboard.tsx` - Added nested match/set structure

### 2. **Database Tables Created** ✅

Created two new configuration tables that are required for the multi-match structure:

#### `badminton_match_config` table:
- Stores match configuration (number of matches, sets per match, points to win)
- Stores match types (singles/doubles for each match)
- Stores toss configuration (winner, decision, serving team, court side)

#### `table_tennis_match_config` table:
- Stores match configuration (number of matches, sets per match, points to win)
- Stores match types (singles/doubles for each match)
- Stores toss configuration (winner, decision, serving team, table side)

#### Files Created/Modified:
- `lib/init-db.ts` - Added table creation SQL for both config tables
- `migration-add-config-tables.sql` - Standalone SQL migration script

## What You Need to Do

### **IMPORTANT: Run Database Migration**

You need to run the database initialization to create the config tables:

#### Option 1: Using the init-db script (Recommended)
```bash
# Make sure dev server is running on port 3001
pnpm dev

# In another terminal, run:
node init-db.js
```

#### Option 2: Run SQL directly in your PostgreSQL database
```bash
# Connect to your PostgreSQL database and run:
psql -U your_username -d your_database_name -f migration-add-config-tables.sql

# Or copy the SQL from migration-add-config-tables.sql and paste it into your database client
```

#### Option 3: Use the Next.js API endpoint
Open your browser and navigate to: `http://localhost:3001/api/init-db` (POST request)

## How to Test

### 1. **Create a New Match**
1. Go to Matches → Create Match
2. Select "Badminton" or "Table Tennis"
3. Configure:
   - **Number of Matches**: 3, 5, or 7
   - **Sets Per Match**: 1, 3, 5, or 7
   - **Match Types**: Select singles or doubles for each match
4. Fill in other details and create the match

### 2. **Start the Match and Complete Toss**
1. Open the match detail page
2. Admin: Click "Start Match"
3. Complete the toss configuration dialog
4. The match will transition to "Live" status

### 3. **Verify Match Tabs**
1. Click on the "Scorecard" tab
2. You should now see **Match 1, Match 2, Match 3** tabs at the top
3. Click each match tab to see its sets
4. Inside each match tab you'll see:
   - Match type badge (Singles/Doubles)
   - Sets per match badge (e.g., "3 sets")
   - Current set score (if match is active)
   - Set history table
5. At the bottom, you'll see the **Match Wins** summary

## How It Works

### Data Structure
```json
{
  "matches": [
    {
      "matchNumber": 1,
      "type": "singles",
      "sets": [
        { "home": 11, "away": 8 },
        { "home": 9, "away": 11 },
        { "home": 11, "away": 5 }
      ],
      "winner": "home"
    },
    {
      "matchNumber": 2,
      "type": "doubles",
      "sets": [
        { "home": 0, "away": 0 },
        { "home": 0, "away": 0 },
        { "home": 0, "away": 0 }
      ],
      "winner": null
    },
    {
      "matchNumber": 3,
      "type": "singles",
      "sets": [
        { "home": 0, "away": 0 },
        { "home": 0, "away": 0 },
        { "home": 0, "away": 0 }
      ],
      "winner": null
    }
  ],
  "currentMatch": 1,
  "matchWins": { "home": 1, "away": 0 },
  "servingTeam": "away",
  "pointsToWin": 11
}
```

### Flow
1. **Match Creation**: Stores `numberOfMatches`, `setsPerMatch`, `matchTypes` in config table
2. **Toss Configuration**: Initializes the score structure with empty sets for each match
3. **Scoring**: Updates the current match's current set scores
4. **Set Completion**: Moves to next set within the match
5. **Match Completion**: Awards match win and moves to next match
6. **Overall Winner**: Team with most match wins

## Troubleshooting

### If Match Tabs Don't Appear:

1. **Check Database Tables Exist**:
   ```sql
   -- Run in PostgreSQL:
   SELECT * FROM information_schema.tables 
   WHERE table_name IN ('badminton_match_config', 'table_tennis_match_config');
   ```

2. **Check Match Configuration**:
   ```sql
   -- For badminton:
   SELECT * FROM badminton_match_config WHERE match_id = 'your_match_id';
   
   -- For table tennis:
   SELECT * FROM table_tennis_match_config WHERE match_id = 'your_match_id';
   ```

3. **Check Match Score Structure**:
   - Open browser developer console (F12)
   - Go to the match page
   - Check console logs for the match data
   - Verify `match.score.matches` exists and is an array

4. **Common Issues**:
   - **Old matches**: Matches created before the update use the old structure (score.sets or score.games)
   - **Missing config**: Create a new match after running the database migration
   - **Cache**: Clear browser cache and refresh the page

### If Database Migration Fails:

The most likely cause is the tables already exist but with missing columns. You can:

1. **Drop and recreate** (⚠️ This will delete all toss configurations):
   ```sql
   DROP TABLE IF EXISTS badminton_match_config CASCADE;
   DROP TABLE IF EXISTS table_tennis_match_config CASCADE;
   ```
   Then run the migration script again.

2. **Add missing columns** (safer):
   ```sql
   -- For badminton:
   ALTER TABLE badminton_match_config 
   ADD COLUMN IF NOT EXISTS number_of_matches INTEGER DEFAULT 3,
   ADD COLUMN IF NOT EXISTS sets_per_match INTEGER DEFAULT 2,
   ADD COLUMN IF NOT EXISTS match_types JSONB;

   -- For table tennis:
   ALTER TABLE table_tennis_match_config 
   ADD COLUMN IF NOT EXISTS number_of_matches INTEGER DEFAULT 3,
   ADD COLUMN IF NOT EXISTS sets_per_match INTEGER DEFAULT 2,
   ADD COLUMN IF NOT EXISTS match_types JSONB;
   ```

## Files Modified Summary

### Component Files:
1. `components/scoreboards/badminton-scoreboard.tsx` - Match-level tabs in scorecard
2. `components/scoreboards/table-tennis-scoreboard.tsx` - Match-level tabs in scorecard

### Database Files:
3. `lib/init-db.ts` - Added config table creation
4. `migration-add-config-tables.sql` - SQL migration script (NEW)

### Configuration Files:
5. `init-db.js` - Updated port to 3001

## Next Steps

1. ✅ Run the database migration (see "What You Need to Do" section above)
2. ✅ Create a new match with 3 matches × 3 sets configuration
3. ✅ Start the match and complete toss
4. ✅ Verify match tabs appear in the Scorecard tab
5. ✅ Test scoring across multiple matches and sets

If you encounter any issues, check the Troubleshooting section above or let me know!
