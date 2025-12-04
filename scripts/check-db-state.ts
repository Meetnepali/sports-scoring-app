#!/usr/bin/env tsx

/**
 * Quick Database State Checker
 * Shows counts of all main tables and checks for issues
 */

import { query } from "../lib/database"

async function checkDatabaseState() {
  console.log("📊 Database State Check\n")
  console.log("=" .repeat(60))

  try {
    // Get counts for all main tables
    const tables = [
      'users',
      'user_sessions', 
      'sports',
      'teams',
      'players',
      'user_team_memberships',
      'matches',
      'user_match_participation',
      'user_sports_stats',
      'tournaments',
      'tournament_sports',
      'tournament_groups',
      'group_teams',
      'tournament_bracket_nodes',
      'group_matches'
    ]

    console.log("\n📦 Table Record Counts:\n")
    
    for (const table of tables) {
      try {
        const result = await query<{ count: string }>(`
          SELECT COUNT(*)::text as count FROM ${table}
        `)
        const count = parseInt(result[0].count)
        const icon = count > 0 ? '✓' : '○'
        console.log(`   ${icon} ${table.padEnd(30)} ${count.toString().padStart(5)} records`)
      } catch (error) {
        console.log(`   ✗ ${table.padEnd(30)} ERROR: Table may not exist`)
      }
    }

    // Check for teams with matches
    console.log("\n\n🏆 Teams with Match Counts:\n")
    const teamsWithMatches = await query<{ 
      team_name: string
      sport: string
      match_count: string 
    }>(`
      SELECT 
        t.name as team_name,
        t.sport,
        COUNT(m.id)::text as match_count
      FROM teams t
      LEFT JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id)
      GROUP BY t.id, t.name, t.sport
      ORDER BY COUNT(m.id) DESC
      LIMIT 10
    `)

    if (teamsWithMatches.length > 0) {
      teamsWithMatches.forEach(team => {
        const matches = parseInt(team.match_count)
        console.log(`   ${team.team_name.padEnd(30)} (${team.sport.padEnd(12)}) - ${matches} matches`)
      })
    } else {
      console.log("   No teams found")
    }

    // Check for potential orphaned records
    console.log("\n\n⚠️  Potential Issues:\n")
    
    // Matches without valid teams
    const orphanedMatches = await query<{ count: string }>(`
      SELECT COUNT(*)::text as count
      FROM matches m
      WHERE NOT EXISTS (SELECT 1 FROM teams t WHERE t.id = m.home_team_id)
         OR NOT EXISTS (SELECT 1 FROM teams t WHERE t.id = m.away_team_id)
    `)
    const orphanedMatchCount = parseInt(orphanedMatches[0].count)
    if (orphanedMatchCount > 0) {
      console.log(`   ⚠️  ${orphanedMatchCount} matches with invalid team references`)
    } else {
      console.log(`   ✓ No orphaned matches`)
    }

    // Players without valid teams
    const orphanedPlayers = await query<{ count: string }>(`
      SELECT COUNT(*)::text as count
      FROM players p
      WHERE NOT EXISTS (SELECT 1 FROM teams t WHERE t.id = p.team_id)
    `)
    const orphanedPlayerCount = parseInt(orphanedPlayers[0].count)
    if (orphanedPlayerCount > 0) {
      console.log(`   ⚠️  ${orphanedPlayerCount} players with invalid team references`)
    } else {
      console.log(`   ✓ No orphaned players`)
    }

    // Check foreign key constraints on matches table
    console.log("\n\n🔗 Foreign Key Constraints on matches table:\n")
    const matchConstraints = await query<{
      constraint_name: string
      column_name: string
      foreign_table: string
      delete_rule: string
    }>(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'matches'
    `)

    if (matchConstraints.length > 0) {
      matchConstraints.forEach(constraint => {
        const cascadeIcon = constraint.delete_rule === 'CASCADE' ? '✓' : '⚠️ '
        console.log(`   ${cascadeIcon} ${constraint.column_name.padEnd(20)} → ${constraint.foreign_table.padEnd(15)} (${constraint.delete_rule})`)
      })
    } else {
      console.log("   No foreign key constraints found")
    }

    console.log("\n" + "=".repeat(60))
    console.log("✅ Database state check completed!\n")

  } catch (error) {
    console.error("\n❌ Error checking database state:", error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  checkDatabaseState()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

export { checkDatabaseState }

