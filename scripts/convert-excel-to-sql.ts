#!/usr/bin/env tsx

/**
 * Convert Excel Player List to SQL INSERT statements
 * Reads the player list.xlsx file and generates SQL
 */

import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

interface PlayerRow {
  Name?: string
  'Team Name'?: string
  'Jersey Number'?: number | string
  Position?: string
  Sport?: string
  [key: string]: any
}

async function convertExcelToSQL() {
  console.log("📊 Converting Excel Player List to SQL...\n")
  console.log("=" .repeat(60))

  try {
    // Read the Excel file
    const excelPath = path.join(process.cwd(), 'public', 'player list.xlsx')
    
    if (!fs.existsSync(excelPath)) {
      console.error("❌ Error: player list.xlsx not found in public folder")
      process.exit(1)
    }

    console.log(`\n📂 Reading file: ${excelPath}`)
    
    const workbook = XLSX.readFile(excelPath)
    const sheetName = workbook.SheetNames[0]
    console.log(`📄 Sheet: ${sheetName}`)
    
    const worksheet = workbook.Sheets[sheetName]
    const data: PlayerRow[] = XLSX.utils.sheet_to_json(worksheet)

    console.log(`\n✓ Found ${data.length} player records\n`)

    // Group players by team and sport
    const teamGroups = new Map<string, PlayerRow[]>()
    
    data.forEach(row => {
      const teamKey = `${row['Team Name'] || 'Unknown Team'}_${row.Sport || 'Unknown Sport'}`
      if (!teamGroups.has(teamKey)) {
        teamGroups.set(teamKey, [])
      }
      teamGroups.get(teamKey)!.push(row)
    })

    // Generate SQL
    let sqlOutput = `-- Generated SQL for Player Import
-- Generated on: ${new Date().toISOString()}
-- Source: player list.xlsx
-- Total Players: ${data.length}

BEGIN;

-- ============================================================================
-- STEP 1: Ensure Sports Exist
-- ============================================================================

`

    // Get unique sports
    const sports = [...new Set(data.map(row => row.Sport).filter(Boolean))]
    sports.forEach(sport => {
      sqlOutput += `INSERT INTO sports (name) VALUES ('${sport}') ON CONFLICT (name) DO NOTHING;\n`
    })

    sqlOutput += `
-- ============================================================================
-- STEP 2: Create Teams (if they don't exist)
-- ============================================================================

`

    // Create teams
    const teams = [...new Set(data.map(row => {
      return JSON.stringify({ name: row['Team Name'], sport: row.Sport })
    }).filter(Boolean))]

    teams.forEach(teamJson => {
      const team = JSON.parse(teamJson)
      if (team.name && team.sport) {
        sqlOutput += `INSERT INTO teams (name, sport) 
VALUES ('${team.name}', '${team.sport}')
ON CONFLICT DO NOTHING;\n`
      }
    })

    sqlOutput += `
-- ============================================================================
-- STEP 3: Insert Players
-- ============================================================================

-- First, let's create a temporary mapping table for team references
CREATE TEMP TABLE IF NOT EXISTS temp_team_ids AS
SELECT id, name, sport FROM teams;

`

    // Group players by team for better organization
    teamGroups.forEach((players, teamKey) => {
      const [teamName, sport] = teamKey.split('_')
      
      sqlOutput += `\n-- Players for: ${teamName} (${sport})\n`
      
      players.forEach(player => {
        const name = player.Name || 'Unknown Player'
        const number = player['Jersey Number'] || 'NULL'
        const position = player.Position ? `'${player.Position}'` : 'NULL'
        const teamNameSql = player['Team Name'] || teamName
        const sportSql = player.Sport || sport

        sqlOutput += `
INSERT INTO players (team_id, name, number, position)
SELECT id, '${name.replace(/'/g, "''")}', ${number}, ${position}
FROM teams
WHERE name = '${teamNameSql.replace(/'/g, "''")}' AND sport = '${sportSql}'
ON CONFLICT DO NOTHING;
`
      })
    })

    sqlOutput += `
-- ============================================================================
-- STEP 4: Verify the Import
-- ============================================================================

-- Count players by team
SELECT 
  t.name as team_name,
  t.sport,
  COUNT(p.id) as player_count
FROM teams t
LEFT JOIN players p ON p.team_id = t.id
GROUP BY t.id, t.name, t.sport
ORDER BY t.sport, t.name;

-- Display all imported players
SELECT 
  t.name as team_name,
  t.sport,
  p.name as player_name,
  p.number as jersey_number,
  p.position
FROM players p
JOIN teams t ON p.team_id = t.id
ORDER BY t.sport, t.name, p.number NULLS LAST;

-- Summary
SELECT 
  'Total Sports' as metric, COUNT(DISTINCT sport)::text as count FROM teams
UNION ALL
SELECT 
  'Total Teams' as metric, COUNT(*)::text as count FROM teams
UNION ALL
SELECT 
  'Total Players' as metric, COUNT(*)::text as count FROM players;

COMMIT;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. This script uses ON CONFLICT DO NOTHING to prevent duplicate entries
-- 2. Teams are matched by both name AND sport
-- 3. Player names with apostrophes are properly escaped
-- 4. NULL values are used for missing jersey numbers or positions
-- 5. Run this script after ensuring the database structure is correct
-- ============================================================================
`

    // Write SQL file
    const outputPath = path.join(process.cwd(), 'scripts', 'insert-players-from-excel.sql')
    fs.writeFileSync(outputPath, sqlOutput)

    console.log("=" .repeat(60))
    console.log(`\n✅ SQL file generated successfully!`)
    console.log(`\n📁 Output: ${outputPath}`)
    console.log(`\n📊 Summary:`)
    console.log(`   - ${sports.length} unique sports`)
    console.log(`   - ${teams.length} unique teams`)
    console.log(`   - ${data.length} players`)
    
    console.log(`\n🎯 Next steps:`)
    console.log(`   1. Review the generated SQL file`)
    console.log(`   2. Run: psql $DATABASE_URL -f scripts/insert-players-from-excel.sql`)
    console.log(`   3. Or use your database management tool to execute the SQL\n`)

    // Also print a preview
    console.log("\n📋 Preview of teams and player counts:")
    teamGroups.forEach((players, teamKey) => {
      const [teamName, sport] = teamKey.split('_')
      console.log(`   - ${teamName} (${sport}): ${players.length} players`)
    })

    console.log("\n")

  } catch (error) {
    console.error("\n❌ Error converting Excel to SQL:", error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  convertExcelToSQL()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

export { convertExcelToSQL }

