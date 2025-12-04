# Cricket Advanced Scoring System - Setup and Testing Guide

## Database Migration

### Step 1: Run the Migration

Execute the SQL migration to create all required tables:

```bash
# For PostgreSQL
psql $DATABASE_URL -f scripts/add-cricket-advanced-scoring.sql

# Or if you have the connection details
psql -h hostname -U username -d database_name -f scripts/add-cricket-advanced-scoring.sql
```

### Step 2: Verify Tables Created

Check that all tables were created successfully:

```sql
-- List all cricket tables
\dt cricket_*

-- Expected output:
-- cricket_match_config
-- cricket_ball_by_ball
-- cricket_player_innings
-- cricket_player_bowling
-- cricket_match_summary
```

### Step 3: Verify Indexes

```sql
-- Check indexes
\di cricket_*
```

## Testing the Complete Match Flow

### 1. Create a Cricket Match

1. Navigate to "Create Match" page
2. Select "Cricket" as the sport
3. Select two teams (ensure both teams have at least 11 players)
4. Configure cricket-specific settings:
   - **Total Overs**: Choose 5, 10, 20, or 50 overs
   - **Max Overs per Bowler**: Set appropriate limit (recommended: 20% of total overs)
5. Set venue, date, and time
6. Click "Create Match"

**Note**: The match configuration (overs and bowler limits) is saved automatically and will be used for toss configuration.

### 2. Start the Match

1. Go to the Matches page
2. Find your scheduled cricket match
3. Click "Start Match" button
4. The match status will change to "Live"

### 3. Conduct the Toss (First Time Only)

When you open the live match scoring page for the first time:

1. **Toss Configuration Dialog** will appear automatically
2. Select which team won the toss
3. Choose what they elected to do:
   - **Bat First**: Toss winner will bat in first innings
   - **Bowl First**: Toss winner will bowl, opposition bats first
4. Click "Start Match"

**Important**: This dialog appears only once per match. If you close the scoring page and return, the toss is already recorded.

### 4. Live Scoring - First Innings

#### Select Players
1. **Striker**: Choose the batsman on strike (must not be out)
2. **Non-Striker**: Choose the other batsman
3. **Bowler**: Choose the current bowler (must be under over limit)

#### Record Each Ball
- **Runs**: Click 0, 1, 2, 3, 4, or 6 buttons
  - Strike rotates automatically for odd runs
  - Strike rotates at end of over (6 legal balls)
  - Boundaries trigger animations
- **Wicket**: Click "OUT!" button
  - Batsman is marked as out and cannot bat again
  - Select a new batsman to continue
- **Extras**: Click Wide, No Ball, Bye, or Leg Bye
  - Wides and No Balls don't count as legal deliveries
  - Byes and Leg Byes count as legal deliveries

#### Ball-by-Ball Tracking
Every ball is automatically saved to the database with:
- Bowler, striker, non-striker
- Runs scored and extras
- Wicket information if applicable
- Over and ball number

#### Automatic Innings Completion
The system automatically detects and switches innings when:
- **10 wickets fall**: All out
- **Overs complete**: Total overs bowled
- **Target chased** (2nd innings): Runs exceed first innings total

### 5. Second Innings

After first innings completes:
1. Teams swap roles automatically
2. All previous restrictions apply:
   - Out batsmen cannot bat
   - Bowler over limits enforced
3. **Additional tracking**:
   - Required run rate displayed
   - Runs needed to win shown
   - Target chase status

#### Automatic Match Completion
Match completes when:
- **Target chased**: Batting team exceeds target
- **All out**: 10 wickets fall
- **Overs complete**: All overs bowled
- **Target impossible**: Not enough balls remaining

### 6. Man of the Match Selection

When match completes:
1. **Auto-suggestion**: System analyzes all performances and suggests best player
2. **Suggestion criteria**:
   - Batting: High runs + good strike rate
   - Bowling: Most wickets + good economy
3. **Manual override**: Admin can select any player from dropdown
4. **Candidates shown**:
   - Top 5 batsmen (with runs, balls, strike rate)
   - Top 5 bowlers (with wickets, runs, economy)

### 7. View Complete Scorecard

Switch to the "Scorecard" tab to see:

#### Match Information
- Format (overs), Toss details, Result, Man of the Match

#### First Innings
- **Batting Card**: Player | Runs | Balls | 4s | 6s | Strike Rate | Dismissal
- **Bowling Card**: Bowler | Overs | Maidens | Runs | Wickets | Economy
- **Extras**: Breakdown of wides, no balls, byes, leg byes
- **Fall of Wickets**: Score at which each wicket fell

#### Second Innings
- Same detailed statistics as first innings

#### Live Updates
- Scorecard refreshes automatically every 5 seconds
- Shows real-time statistics during match

## Feature Highlights

### Validations Implemented

1. **Player Restrictions**
   - Out batsmen cannot bat again in same innings
   - Players automatically filtered from selection
   
2. **Bowler Restrictions**
   - Maximum overs per bowler enforced
   - Bowlers exceeding limit removed from selection
   
3. **Match Flow**
   - Automatic innings detection and switching
   - Winner determination based on match situation
   - Tie detection if scores equal

4. **Data Integrity**
   - Every ball saved to database
   - Complete audit trail maintained
   - Player statistics calculated real-time

### Real-Time Statistics

- **Strike Rate**: (Runs / Balls) × 100
- **Economy Rate**: Runs / Overs
- **Run Rate**: Current run rate
- **Required Run Rate**: For chasing team

### UI Enhancements

- Boundary animations (FOUR! / SIX!)
- Wicket animations (WICKET!)
- Color-coded teams (batting team highlighted)
- Current over ball tracker
- Player performance indicators

## Troubleshooting

### Toss Dialog Not Appearing
- Ensure match status is "live"
- Check that cricket_match_config exists with config_completed = false
- Refresh the page

### Players Not Showing in Dropdown
- Verify teams have players in database
- Check that players belong to correct team
- Ensure player hasn't been marked as out (for batsmen)

### Bowler Limit Not Working
- Verify max_overs_per_bowler set correctly in match creation
- Check cricket_match_config table for correct value

### Stats Not Updating
- Check browser console for API errors
- Verify all API routes are accessible
- Check database connectivity

### Scorecard Empty
- Ensure balls have been recorded
- Check cricket_ball_by_ball table has data
- Verify innings_number is correct (1 or 2)

## Database Queries for Verification

### Check Match Configuration
```sql
SELECT * FROM cricket_match_config WHERE match_id = 'your-match-id';
```

### Check Ball-by-Ball Data
```sql
SELECT COUNT(*) FROM cricket_ball_by_ball WHERE match_id = 'your-match-id';
```

### Check Player Batting Stats
```sql
SELECT p.name, cpi.* 
FROM cricket_player_innings cpi
JOIN players p ON cpi.player_id = p.id
WHERE cpi.match_id = 'your-match-id'
ORDER BY cpi.runs_scored DESC;
```

### Check Player Bowling Stats
```sql
SELECT p.name, cpb.* 
FROM cricket_player_bowling cpb
JOIN players p ON cpb.player_id = p.id
WHERE cpb.match_id = 'your-match-id'
ORDER BY cpb.wickets_taken DESC, cpb.economy_rate ASC;
```

### Check Match Summary
```sql
SELECT cms.*, t.name as winner_name, p.name as motm_name
FROM cricket_match_summary cms
LEFT JOIN teams t ON cms.winner_team_id = t.id
LEFT JOIN players p ON cms.man_of_match_player_id = p.id
WHERE cms.match_id = 'your-match-id';
```

## System Architecture

### Database Tables
1. **cricket_match_config**: Match format and toss details
2. **cricket_ball_by_ball**: Complete ball-by-ball record
3. **cricket_player_innings**: Batting performance statistics
4. **cricket_player_bowling**: Bowling performance statistics
5. **cricket_match_summary**: Final result and awards

### API Endpoints
- `POST /api/matches/[id]/cricket/config`: Save/update match configuration
- `GET /api/matches/[id]/cricket/config`: Fetch match configuration
- `POST /api/matches/[id]/cricket/ball`: Record a single ball
- `GET /api/matches/[id]/cricket/ball`: Fetch all balls for match
- `GET /api/matches/[id]/cricket/scorecard`: Get complete scorecard
- `GET /api/matches/[id]/cricket/man-of-match`: Get suggestion
- `PUT /api/matches/[id]/cricket/man-of-match`: Update man of match

### React Components
- `TossConfigurationDialog`: One-time toss setup
- `CricketScorecardEnhanced`: Main scoring interface with tabs
- `CricketScorecardTab`: Detailed scorecard display
- `ManOfMatchSelector`: MOTM selection with auto-suggestion

### Utility Functions (lib/cricket-match-logic.ts)
- Match flow calculations
- Innings completion checks
- Winner determination
- Over/ball conversions
- Statistics calculations

## Success Criteria

A complete test should verify:

- [x] Match creation with cricket config
- [x] Toss configuration saves correctly
- [x] Ball-by-ball recording works
- [x] Player out restriction enforced
- [x] Bowler over limit enforced
- [x] Automatic innings switch
- [x] Second innings target tracking
- [x] Match completion detection
- [x] Winner calculation correct
- [x] Man of match suggestion works
- [x] Complete scorecard displays
- [x] All statistics calculated correctly

## Next Steps

After successful testing:
1. Create sample matches with different formats (5, 10, 20, 50 overs)
2. Test edge cases (tie, all out, target chase)
3. Verify scorecard accuracy against real matches
4. Gather user feedback on UI/UX
5. Consider additional features (bowling analysis, partnerships, etc.)

