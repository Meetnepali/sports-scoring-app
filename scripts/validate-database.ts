/**
 * Database Validation Script
 * Checks database structure and integrity
 */

import { query } from "../lib/database"

interface TableInfo {
  table_name: string
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

interface ForeignKeyInfo {
  constraint_name: string
  table_name: string
  column_name: string
  foreign_table_name: string
  foreign_column_name: string
  delete_rule: string
}

interface TableCount {
  table_name: string
  count: number
}

async function validateDatabaseStructure() {
  console.log("🔍 Starting Database Validation...\n")

  try {
    // 1. Check if all required tables exist
    console.log("📋 Checking Tables...")
    const tables = await query<{ tablename: string }>(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `)

    const requiredTables = [
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
      'tournament_bracket_nodes'
    ]

    const existingTables = tables.map(t => t.tablename)
    const missingTables = requiredTables.filter(t => !existingTables.includes(t))

    if (missingTables.length > 0) {
      console.log("❌ Missing tables:", missingTables.join(", "))
    } else {
      console.log("✅ All required tables exist")
    }

    console.log("\n📊 Tables found:", existingTables.length)
    existingTables.forEach(table => console.log(`   - ${table}`))

    // 2. Check table structure
    console.log("\n\n🏗️  Checking Table Structure...")
    for (const table of requiredTables) {
      if (existingTables.includes(table)) {
        const columns = await query<TableInfo>(`
          SELECT 
            column_name, 
            data_type, 
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' 
            AND table_name = $1
          ORDER BY ordinal_position
        `, [table])

        console.log(`\n   ${table}:`)
        columns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : ''
          console.log(`      - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`)
        })
      }
    }

    // 3. Check Foreign Keys
    console.log("\n\n🔗 Checking Foreign Key Constraints...")
    const foreignKeys = await query<ForeignKeyInfo>(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
        AND rc.constraint_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_name
    `)

    const fksByTable: Record<string, ForeignKeyInfo[]> = {}
    foreignKeys.forEach(fk => {
      if (!fksByTable[fk.table_name]) {
        fksByTable[fk.table_name] = []
      }
      fksByTable[fk.table_name].push(fk)
    })

    Object.entries(fksByTable).forEach(([table, fks]) => {
      console.log(`\n   ${table}:`)
      fks.forEach(fk => {
        const cascadeInfo = fk.delete_rule === 'CASCADE' ? '🔄 CASCADE' : '⚠️  NO CASCADE'
        console.log(`      - ${fk.column_name} → ${fk.foreign_table_name}(${fk.foreign_column_name}) ${cascadeInfo}`)
      })
    })

    // 4. Check data counts
    console.log("\n\n📊 Checking Data Counts...")
    const counts: TableCount[] = []
    
    for (const table of existingTables) {
      try {
        const result = await query<{ count: string }>(`
          SELECT COUNT(*)::text as count FROM ${table}
        `)
        counts.push({
          table_name: table,
          count: parseInt(result[0].count)
        })
      } catch (error) {
        console.log(`   ⚠️  Could not count ${table}:`, error)
      }
    }

    counts.sort((a, b) => b.count - a.count)
    counts.forEach(({ table_name, count }) => {
      const icon = count > 0 ? '📦' : '📭'
      console.log(`   ${icon} ${table_name}: ${count} records`)
    })

    // 5. Check for orphaned records
    console.log("\n\n🔍 Checking for Orphaned Records...")
    
    // Check for teams without valid sport
    const teamsWithoutSport = await query<{ count: string }>(`
      SELECT COUNT(*)::text as count
      FROM teams t
      WHERE NOT EXISTS (
        SELECT 1 FROM sports s WHERE s.name = t.sport
      )
    `)
    const orphanedTeams = parseInt(teamsWithoutSport[0].count)
    if (orphanedTeams > 0) {
      console.log(`   ⚠️  Found ${orphanedTeams} teams with invalid sport references`)
    } else {
      console.log(`   ✅ No teams with invalid sport references`)
    }

    // Check for matches without valid teams
    const matchesWithoutTeams = await query<{ count: string }>(`
      SELECT COUNT(*)::text as count
      FROM matches m
      WHERE NOT EXISTS (SELECT 1 FROM teams t WHERE t.id = m.home_team_id)
         OR NOT EXISTS (SELECT 1 FROM teams t WHERE t.id = m.away_team_id)
    `)
    const orphanedMatches = parseInt(matchesWithoutTeams[0].count)
    if (orphanedMatches > 0) {
      console.log(`   ⚠️  Found ${orphanedMatches} matches with invalid team references`)
    } else {
      console.log(`   ✅ No matches with invalid team references`)
    }

    // Check for players without valid teams
    const playersWithoutTeams = await query<{ count: string }>(`
      SELECT COUNT(*)::text as count
      FROM players p
      WHERE NOT EXISTS (SELECT 1 FROM teams t WHERE t.id = p.team_id)
    `)
    const orphanedPlayers = parseInt(playersWithoutTeams[0].count)
    if (orphanedPlayers > 0) {
      console.log(`   ⚠️  Found ${orphanedPlayers} players with invalid team references`)
    } else {
      console.log(`   ✅ No players with invalid team references`)
    }

    // 6. Check for duplicate records
    console.log("\n\n🔍 Checking for Duplicate Records...")
    
    // Check for duplicate team names in same sport
    const duplicateTeams = await query<{ name: string; sport: string; count: string }>(`
      SELECT name, sport, COUNT(*)::text as count
      FROM teams
      GROUP BY name, sport
      HAVING COUNT(*) > 1
    `)
    if (duplicateTeams.length > 0) {
      console.log(`   ⚠️  Found duplicate teams:`)
      duplicateTeams.forEach(team => {
        console.log(`      - ${team.name} (${team.sport}): ${team.count} occurrences`)
      })
    } else {
      console.log(`   ✅ No duplicate teams found`)
    }

    // Check for duplicate user emails
    const duplicateEmails = await query<{ email: string; count: string }>(`
      SELECT email, COUNT(*)::text as count
      FROM users
      GROUP BY email
      HAVING COUNT(*) > 1
    `)
    if (duplicateEmails.length > 0) {
      console.log(`   ⚠️  Found duplicate user emails:`)
      duplicateEmails.forEach(user => {
        console.log(`      - ${user.email}: ${user.count} occurrences`)
      })
    } else {
      console.log(`   ✅ No duplicate user emails found`)
    }

    console.log("\n\n✅ Database Validation Complete!")

  } catch (error) {
    console.error("❌ Error during validation:", error)
    throw error
  }
}

// Run validation if called directly
if (require.main === module) {
  validateDatabaseStructure()
    .then(() => {
      console.log("\n✅ Validation finished successfully")
      process.exit(0)
    })
    .catch(error => {
      console.error("\n❌ Validation failed:", error)
      process.exit(1)
    })
}

export { validateDatabaseStructure }

