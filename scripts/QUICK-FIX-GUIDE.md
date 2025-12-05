# Quick Fix Guide - Run These Commands

## If You're Getting NaN Errors or Undefined Errors

### Quick Database Fix (Run this now!)

```bash
# Option 1: Using psql command line
psql -U your_username -d your_database_name -f scripts/fix-all-sports-data.sql

# Option 2: From psql prompt
\i scripts/fix-all-sports-data.sql

# Then validate:
\i scripts/validate-all-sports.sql
```

### What This Fixes

- ✅ Table Tennis: Invalid `currentSet`, missing `sets[]`
- ✅ Volleyball: Invalid `currentSet`, missing `sets[]`
- ✅ Badminton: Invalid `currentGame`, missing `games[]`

### Expected Output

You should see:
```
NOTICE:  Fixing table tennis matches...
NOTICE:  Fixed X table tennis match(es)
NOTICE:  Fixing volleyball matches...
NOTICE:  Fixed X volleyball match(es)
NOTICE:  Fixing badminton matches...
NOTICE:  Fixed X badminton match(es)
```

## Verify the Fix

### Option 1: Run Validation SQL
```bash
psql -U your_username -d your_database_name -f scripts/validate-all-sports.sql
```

All counts should be **0** (zero).

### Option 2: Test in Browser

1. Open any Table Tennis/Volleyball/Badminton match
2. Click the +1 score button
3. **Should work without errors**
4. Check browser console - **no TypeError messages**

## If You Still Get Errors

1. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)
2. **Restart dev server**: Stop and `npm run dev` again
3. **Check console**: Look for which sport is failing
4. **Re-run database fix**: The SQL script is safe to run multiple times

## Database Connection Examples

### Local PostgreSQL
```bash
psql -U postgres -d sports_scoring_app -f scripts/fix-all-sports-data.sql
```

### Docker PostgreSQL
```bash
docker exec -i postgres_container psql -U postgres -d sports_scoring_app < scripts/fix-all-sports-data.sql
```

### Heroku PostgreSQL
```bash
heroku pg:psql -a your-app-name < scripts/fix-all-sports-data.sql
```

### Supabase
```bash
psql "postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?sslmode=require" -f scripts/fix-all-sports-data.sql
```

## Still Having Issues?

Check `CRITICAL-FIXES-APPLIED.md` for full details or `scripts/FIXES-SUMMARY.md` for technical explanation.

