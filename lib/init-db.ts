import { query } from "./database"

export async function initializeDatabase() {
  try {
    // Create users table first
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        full_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        avatar_url TEXT,
        profile_photo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create user_sessions table
    await query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create sports table
    await query(`
      CREATE TABLE IF NOT EXISTS sports (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create teams table
    await query(`
      CREATE TABLE IF NOT EXISTS teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        sport VARCHAR(100) NOT NULL,
        logo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create user_team_memberships table
    await query(`
      CREATE TABLE IF NOT EXISTS user_team_memberships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        position VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create players table
    await query(`
      CREATE TABLE IF NOT EXISTS players (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        number INTEGER,
        position VARCHAR(100),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    await query(`CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id)`)

    // Create matches table
    await query(`
      CREATE TABLE IF NOT EXISTS matches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sport VARCHAR(100) NOT NULL,
        home_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        away_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        match_date TIMESTAMP NOT NULL,
        venue VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        score JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create user_match_participation table
    await query(`
      CREATE TABLE IF NOT EXISTS user_match_participation (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        performance_score DECIMAL(3,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create user_sports_stats table
    await query(`
      CREATE TABLE IF NOT EXISTS user_sports_stats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        sport VARCHAR(100) NOT NULL,
        total_matches INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        draws INTEGER DEFAULT 0,
        performance_rating DECIMAL(3,2) DEFAULT 0.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create tournaments table
    await query(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        sport VARCHAR(100) NOT NULL,
        format VARCHAR(100) NOT NULL,
        bracket_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'upcoming',
        start_date DATE,
        teams JSONB,
        matches JSONB,
        team_logos JSONB,
        sports_count INTEGER DEFAULT 1,
        bracket_config JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create tournament_sports table (multiple sports per tournament)
    await query(`
      CREATE TABLE IF NOT EXISTS tournament_sports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
        sport VARCHAR(100) NOT NULL,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tournament_id, sport)
      )
    `)

    // Create tournament_groups table (groups for each sport)
    await query(`
      CREATE TABLE IF NOT EXISTS tournament_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
        tournament_sport_id UUID REFERENCES tournament_sports(id) ON DELETE CASCADE,
        group_name VARCHAR(255) NOT NULL,
        sport VARCHAR(100) NOT NULL,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create group_teams table (teams in groups)
    await query(`
      CREATE TABLE IF NOT EXISTS group_teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID REFERENCES tournament_groups(id) ON DELETE CASCADE,
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(group_id, team_id)
      )
    `)

    // Create tournament_bracket_nodes table (bracket structure with visual data)
    await query(`
      CREATE TABLE IF NOT EXISTS tournament_bracket_nodes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
        group_id UUID REFERENCES tournament_groups(id) ON DELETE SET NULL,
        node_type VARCHAR(50) NOT NULL,
        round_number INTEGER,
        match_number INTEGER,
        position INTEGER,
        team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
        parent_node_id UUID REFERENCES tournament_bracket_nodes(id) ON DELETE CASCADE,
        next_match_id UUID REFERENCES tournament_bracket_nodes(id) ON DELETE SET NULL,
        winner_id UUID REFERENCES teams(id) ON DELETE SET NULL,
        score JSONB,
        match_date TIMESTAMP,
        node_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create group_matches table (matches within groups)
    await query(`
      CREATE TABLE IF NOT EXISTS group_matches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID REFERENCES tournament_groups(id) ON DELETE CASCADE,
        team1_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        team2_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        team1_score JSONB,
        team2_score JSONB,
        winner_id UUID REFERENCES teams(id),
        match_date TIMESTAMP,
        status VARCHAR(50) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create indexes for performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_tournament_sports_tournament_id ON tournament_sports(tournament_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_tournament_sports_sport ON tournament_sports(sport)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_tournament_groups_tournament_id ON tournament_groups(tournament_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_tournament_groups_sport_id ON tournament_groups(tournament_sport_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_tournament_groups_sport ON tournament_groups(sport)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_group_teams_group_id ON group_teams(group_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_group_teams_team_id ON group_teams(team_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_bracket_nodes_tournament_id ON tournament_bracket_nodes(tournament_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_bracket_nodes_group_id ON tournament_bracket_nodes(group_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_bracket_nodes_round_match ON tournament_bracket_nodes(round_number, match_number)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_bracket_nodes_team_id ON tournament_bracket_nodes(team_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_group_matches_group_id ON group_matches(group_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_group_matches_team1_id ON group_matches(team1_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_group_matches_team2_id ON group_matches(team2_id)
    `)

    // Insert default sports
    const sports = ["cricket", "volleyball", "chess", "futsal", "table-tennis", "badminton"]
    for (const sport of sports) {
      await query(
        `
        INSERT INTO sports (name) VALUES ($1) ON CONFLICT (name) DO NOTHING
      `,
        [sport],
      )
    }

    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Error initializing database:", error)
    throw error
  }
}
