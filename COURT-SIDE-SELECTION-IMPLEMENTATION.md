# Court/Side Selection Implementation - Phase 1 Complete

## ✅ Completed: Toss Dialog Updates

I've successfully updated all four sports to ask the opposite team which side/court they want when the toss winner chooses to serve/kick off first.

### Changes Made:

1. **Table Tennis** (`components/table-tennis/toss-configuration-dialog.tsx`)
   - Added `oppositeTeamSideChoice` state
   - When toss winner chooses "serve", now asks the opposite team which table side they want
   - Updated validation and save logic

2. **Volleyball** (`components/volleyball/toss-configuration-dialog.tsx`)
   - Added `oppositeTeamCourtSideChoice` state
   - When toss winner chooses "serve", now asks the opposite team which court side they want
   - Updated validation and save logic

3. **Badminton** (`components/badminton/toss-configuration-dialog.tsx`)
   - Added `oppositeTeamCourtSideChoice` state
   - When toss winner chooses "serve", now asks the opposite team which court side they want
   - Updated validation and save logic

4. **Futsal** (`components/futsal/toss-configuration-dialog.tsx`)
   - Added `oppositeTeamSideChoice` state
   - When toss winner chooses "kick off", now asks the opposite team which side they want
   - Updated validation and save logic

### How It Works Now:

**Scenario 1: Toss Winner Chooses Side/Court**
- Toss winner selects which side/court they want
- Opposite team automatically serves/kicks off first
- Flow: Toss Winner → Side Selection → Opposite Team Serves

**Scenario 2: Toss Winner Chooses Serve/Kick Off** (NEW)
- Toss winner chooses to serve/kick off first
- System now asks: "Which side does [Opposite Team] want?"
- Opposite team selects their preferred side
- Flow: Toss Winner → Serve Choice → Opposite Team Side Selection → Game Starts

## 📋 Remaining Tasks

### Task 1: Automatic Side Switching After Sets/Games

**Requirement:** After each set/game finishes, teams should automatically switch sides.

**Implementation Needed:**
- Store current side assignment in match config/score
- Detect when a set/game is completed
- Automatically switch sides for the next set/game
- Update the court/court component to reflect new side positions

**Files to Modify:**
- Scoreboard components for each sport (detect set/game completion)
- Match config storage (store current side)
- Court components (visual side switching)

### Task 2: Player Positioning Based on Selected Side

**Requirement:** Players should be positioned on the court according to the selected side.

**Implementation Needed:**
- Update court components to accept side configuration
- Position home/away teams on left/right based on selected side
- Update player positions when sides switch
- Ensure visual representation matches actual court positions

**Files to Modify:**
- `components/table-tennis-court.tsx`
- `components/volleyball-court.tsx`
- `components/badminton-court.tsx`
- `components/futsal-court.tsx` (if applicable)

## Next Steps

Would you like me to continue with:
1. Automatic side switching after each set/game?
2. Player positioning based on selected side?
3. Both?

These are more complex changes that will require:
- Modifying scoreboard logic to detect set/game completion
- Storing and tracking current side assignment
- Updating court visual components
- Testing the side switching flow

