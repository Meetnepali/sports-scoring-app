// Test database connection and check for existing teams
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'scoring_app',
  user: 'postgres',
  password: '123',
});

async function testDatabase() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Check if teams table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'teams'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Teams table exists');
      
      // Count teams
      const countResult = await client.query('SELECT COUNT(*) FROM teams');
      console.log(`📊 Found ${countResult.rows[0].count} teams in database`);
      
      // List teams
      const teamsResult = await client.query('SELECT id, name, sport FROM teams LIMIT 10');
      if (teamsResult.rows.length > 0) {
        console.log('\n📋 Teams:');
        teamsResult.rows.forEach(team => {
          console.log(`  - ${team.name} (${team.sport}) [ID: ${team.id}]`);
        });
      } else {
        console.log('\n⚠️  No teams found. Run database seeding.');
      }
    } else {
      console.log('❌ Teams table does not exist. Need to run init-db.');
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    await pool.end();
  }
}

testDatabase();
