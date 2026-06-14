-- ============================================
-- SPORTS SCORING APP - FULL DATABASE SETUP
-- Schema + Dummy Data
-- ============================================

-- ============================================
-- 1. TABLES
-- ============================================

-- Users
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
);

-- User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sports
CREATE TABLE IF NOT EXISTS sports (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  sport VARCHAR(100) NOT NULL,
  logo TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Team Memberships
CREATE TABLE IF NOT EXISTS user_team_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  position VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Players
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  number INTEGER,
  position VARCHAR(100),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport VARCHAR(100) NOT NULL,
  home_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  match_date TIMESTAMP NOT NULL,
  venue VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  score JSONB,
  version INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Match Participation
CREATE TABLE IF NOT EXISTS user_match_participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  performance_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Sports Stats
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
);

-- Tournaments
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
);

-- Tournament Sports
CREATE TABLE IF NOT EXISTS tournament_sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  sport VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tournament_id, sport)
);

-- Tournament Groups
CREATE TABLE IF NOT EXISTS tournament_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  tournament_sport_id UUID REFERENCES tournament_sports(id) ON DELETE CASCADE,
  group_name VARCHAR(255) NOT NULL,
  sport VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group Teams
CREATE TABLE IF NOT EXISTS group_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES tournament_groups(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, team_id)
);

-- Tournament Bracket Nodes
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
);

-- Group Matches
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
);

-- ============================================
-- SPORT-SPECIFIC CONFIG TABLES
-- ============================================

-- Cricket Match Config
CREATE TABLE IF NOT EXISTS cricket_match_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  total_overs INTEGER DEFAULT 20,
  max_overs_per_bowler INTEGER DEFAULT 4,
  toss_winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  toss_decision VARCHAR(50),
  elected_to_bat_first_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  config_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cricket_config_match_id ON cricket_match_config(match_id);

-- Badminton Match Config
CREATE TABLE IF NOT EXISTS badminton_match_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  games_to_win INTEGER DEFAULT 2,
  points_to_win_per_game INTEGER DEFAULT 21,
  number_of_matches INTEGER DEFAULT 3,
  sets_per_match INTEGER DEFAULT 2,
  match_types JSONB,
  toss_winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  toss_decision VARCHAR(50),
  selected_court_side VARCHAR(50),
  serving_team VARCHAR(50),
  config_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_badminton_config_match_id ON badminton_match_config(match_id);

-- Table Tennis Match Config
CREATE TABLE IF NOT EXISTS table_tennis_match_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  sets_to_win INTEGER DEFAULT 2,
  points_to_win_per_set INTEGER DEFAULT 11,
  number_of_matches INTEGER DEFAULT 3,
  sets_per_match INTEGER DEFAULT 2,
  match_types JSONB,
  toss_winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  toss_decision VARCHAR(50),
  selected_table_side VARCHAR(50),
  serving_team VARCHAR(50),
  config_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_table_tennis_config_match_id ON table_tennis_match_config(match_id);

-- Volleyball Match Config
CREATE TABLE IF NOT EXISTS volleyball_match_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  number_of_sets INTEGER DEFAULT 5,
  toss_winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  toss_decision VARCHAR(50),
  selected_court_side VARCHAR(50),
  serving_team VARCHAR(50),
  config_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_volleyball_config_match_id ON volleyball_match_config(match_id);

-- Chess Match Config
CREATE TABLE IF NOT EXISTS chess_match_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  toss_winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  toss_decision VARCHAR(50),
  selected_color VARCHAR(50),
  white_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  number_of_games INTEGER DEFAULT 1,
  config_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chess_config_match_id ON chess_match_config(match_id);

-- Futsal Match Config
CREATE TABLE IF NOT EXISTS futsal_match_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  toss_winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  toss_decision VARCHAR(50),
  selected_side VARCHAR(50),
  kicking_off_team VARCHAR(50),
  config_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_futsal_config_match_id ON futsal_match_config(match_id);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tournament_sports_tournament_id ON tournament_sports(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_sports_sport ON tournament_sports(sport);
CREATE INDEX IF NOT EXISTS idx_tournament_groups_tournament_id ON tournament_groups(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_groups_sport_id ON tournament_groups(tournament_sport_id);
CREATE INDEX IF NOT EXISTS idx_tournament_groups_sport ON tournament_groups(sport);
CREATE INDEX IF NOT EXISTS idx_group_teams_group_id ON group_teams(group_id);
CREATE INDEX IF NOT EXISTS idx_group_teams_team_id ON group_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_bracket_nodes_tournament_id ON tournament_bracket_nodes(tournament_id);
CREATE INDEX IF NOT EXISTS idx_bracket_nodes_group_id ON tournament_bracket_nodes(group_id);
CREATE INDEX IF NOT EXISTS idx_bracket_nodes_round_match ON tournament_bracket_nodes(round_number, match_number);
CREATE INDEX IF NOT EXISTS idx_bracket_nodes_team_id ON tournament_bracket_nodes(team_id);
CREATE INDEX IF NOT EXISTS idx_group_matches_group_id ON group_matches(group_id);
CREATE INDEX IF NOT EXISTS idx_group_matches_team1_id ON group_matches(team1_id);
CREATE INDEX IF NOT EXISTS idx_group_matches_team2_id ON group_matches(team2_id);

-- ============================================
-- TRIGGER: Score Update Notification
-- ============================================
CREATE OR REPLACE FUNCTION notify_score_update()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
BEGIN
  IF (OLD.score IS DISTINCT FROM NEW.score) OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    NEW.version := COALESCE(OLD.version, 0) + 1;
    NEW.updated_at := CURRENT_TIMESTAMP;
    payload := jsonb_build_object(
      'matchId', NEW.id::text,
      'score', NEW.score,
      'status', NEW.status,
      'version', NEW.version,
      'updatedAt', NEW.updated_at
    );
    PERFORM pg_notify('score_updates', payload::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS score_update_trigger ON matches;
CREATE TRIGGER score_update_trigger
BEFORE UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION notify_score_update();

-- ============================================
-- 2. SEED SPORTS
-- ============================================
INSERT INTO sports (name) VALUES ('cricket') ON CONFLICT (name) DO NOTHING;
INSERT INTO sports (name) VALUES ('volleyball') ON CONFLICT (name) DO NOTHING;
INSERT INTO sports (name) VALUES ('chess') ON CONFLICT (name) DO NOTHING;
INSERT INTO sports (name) VALUES ('futsal') ON CONFLICT (name) DO NOTHING;
INSERT INTO sports (name) VALUES ('table-tennis') ON CONFLICT (name) DO NOTHING;
INSERT INTO sports (name) VALUES ('badminton') ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 3. SEED USERS (passwords are SHA-256 hashed)
-- SHA-256 of 'admin123' = 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
-- SHA-256 of 'user123'  = 96cae35ce8a9b0244178bf28e4966c2ce1b8385723a96a6b838858cdd6ca0a1e
-- SHA-256 of 'password' = 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8
-- ============================================

INSERT INTO users (id, username, email, full_name, phone_number, password, role) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin', 'admin@sportscoring.com', 'Admin User', '9876543210', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin'),
  ('a0000000-0000-0000-0000-000000000002', 'meet', 'meet@sportscoring.com', 'Meet Patel', '9876543211', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin'),
  ('a0000000-0000-0000-0000-000000000003', 'rahul', 'rahul@sportscoring.com', 'Rahul Sharma', '9876543212', '96cae35ce8a9b0244178bf28e4966c2ce1b8385723a96a6b838858cdd6ca0a1e', 'user'),
  ('a0000000-0000-0000-0000-000000000004', 'priya', 'priya@sportscoring.com', 'Priya Singh', '9876543213', '96cae35ce8a9b0244178bf28e4966c2ce1b8385723a96a6b838858cdd6ca0a1e', 'user'),
  ('a0000000-0000-0000-0000-000000000005', 'arjun', 'arjun@sportscoring.com', 'Arjun Verma', '9876543214', '96cae35ce8a9b0244178bf28e4966c2ce1b8385723a96a6b838858cdd6ca0a1e', 'user'),
  ('a0000000-0000-0000-0000-000000000006', 'sneha', 'sneha@sportscoring.com', 'Sneha Gupta', '9876543215', '96cae35ce8a9b0244178bf28e4966c2ce1b8385723a96a6b838858cdd6ca0a1e', 'user'),
  ('a0000000-0000-0000-0000-000000000007', 'vikram', 'vikram@sportscoring.com', 'Vikram Reddy', '9876543216', '96cae35ce8a9b0244178bf28e4966c2ce1b8385723a96a6b838858cdd6ca0a1e', 'user'),
  ('a0000000-0000-0000-0000-000000000008', 'ananya', 'ananya@sportscoring.com', 'Ananya Iyer', '9876543217', '96cae35ce8a9b0244178bf28e4966c2ce1b8385723a96a6b838858cdd6ca0a1e', 'user');

-- ============================================
-- 4. SEED TEAMS (2 per sport = 12 teams)
-- ============================================

-- Cricket Teams
INSERT INTO teams (id, name, sport) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Royal Challengers', 'cricket'),
  ('b0000000-0000-0000-0000-000000000002', 'Mumbai Indians', 'cricket');

-- Volleyball Teams
INSERT INTO teams (id, name, sport) VALUES
  ('b0000000-0000-0000-0000-000000000003', 'Thunderbolts', 'volleyball'),
  ('b0000000-0000-0000-0000-000000000004', 'Skyliners', 'volleyball');

-- Chess Teams
INSERT INTO teams (id, name, sport) VALUES
  ('b0000000-0000-0000-0000-000000000005', 'Checkmate Kings', 'chess'),
  ('b0000000-0000-0000-0000-000000000006', 'Grandmaster Knights', 'chess');

-- Futsal Teams
INSERT INTO teams (id, name, sport) VALUES
  ('b0000000-0000-0000-0000-000000000007', 'Futsal Flames', 'futsal'),
  ('b0000000-0000-0000-0000-000000000008', 'Goal Strikers', 'futsal');

-- Table Tennis Teams
INSERT INTO teams (id, name, sport) VALUES
  ('b0000000-0000-0000-0000-000000000009', 'Spin Masters', 'table-tennis'),
  ('b0000000-0000-0000-0000-000000000010', 'Paddle Warriors', 'table-tennis');

-- Badminton Teams
INSERT INTO teams (id, name, sport) VALUES
  ('b0000000-0000-0000-0000-000000000011', 'Shuttle Stars', 'badminton'),
  ('b0000000-0000-0000-0000-000000000012', 'Smash Titans', 'badminton');

-- ============================================
-- 5. SEED PLAYERS
-- ============================================

-- Cricket: Royal Challengers (11 players)
INSERT INTO players (team_id, name, number, position) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Virat Kohli', 18, 'Batsman'),
  ('b0000000-0000-0000-0000-000000000001', 'AB de Villiers', 17, 'Batsman'),
  ('b0000000-0000-0000-0000-000000000001', 'Glenn Maxwell', 32, 'All-rounder'),
  ('b0000000-0000-0000-0000-000000000001', 'Mohammed Siraj', 73, 'Bowler'),
  ('b0000000-0000-0000-0000-000000000001', 'Yuzvendra Chahal', 3, 'Bowler'),
  ('b0000000-0000-0000-0000-000000000001', 'Devdutt Padikkal', 37, 'Batsman'),
  ('b0000000-0000-0000-0000-000000000001', 'Washington Sundar', 55, 'All-rounder'),
  ('b0000000-0000-0000-0000-000000000001', 'Navdeep Saini', 96, 'Bowler'),
  ('b0000000-0000-0000-0000-000000000001', 'Kane Richardson', 12, 'Bowler'),
  ('b0000000-0000-0000-0000-000000000001', 'Adam Zampa', 88, 'Bowler'),
  ('b0000000-0000-0000-0000-000000000001', 'Josh Philippe', 22, 'Wicketkeeper');

-- Cricket: Mumbai Indians (11 players)
INSERT INTO players (team_id, name, number, position) VALUES
  ('b0000000-0000-0000-0000-000000000002', 'Rohit Sharma', 45, 'Batsman'),
  ('b0000000-0000-0000-0000-000000000002', 'Jasprit Bumrah', 93, 'Bowler'),
  ('b0000000-0000-0000-0000-000000000002', 'Hardik Pandya', 33, 'All-rounder'),
  ('b0000000-0000-0000-0000-000000000002', 'Kieron Pollard', 55, 'All-rounder'),
  ('b0000000-0000-0000-0000-000000000002', 'Quinton de Kock', 12, 'Wicketkeeper'),
  ('b0000000-0000-0000-0000-000000000002', 'Suryakumar Yadav', 63, 'Batsman'),
  ('b0000000-0000-0000-0000-000000000002', 'Ishan Kishan', 32, 'Wicketkeeper'),
  ('b0000000-0000-0000-0000-000000000002', 'Trent Boult', 18, 'Bowler'),
  ('b0000000-0000-0000-0000-000000000002', 'Krunal Pandya', 24, 'All-rounder'),
  ('b0000000-0000-0000-0000-000000000002', 'Rahul Chahar', 1, 'Bowler'),
  ('b0000000-0000-0000-0000-000000000002', 'Anmolpreet Singh', 4, 'Batsman');

-- Volleyball: Thunderbolts (7 players)
INSERT INTO players (team_id, name, number, position) VALUES
  ('b0000000-0000-0000-0000-000000000003', 'John Smith', 1, 'Setter'),
  ('b0000000-0000-0000-0000-000000000003', 'Michael Johnson', 2, 'Outside Hitter'),
  ('b0000000-0000-0000-0000-000000000003', 'David Lee', 3, 'Middle Blocker'),
  ('b0000000-0000-0000-0000-000000000003', 'Robert Brown', 4, 'Opposite'),
  ('b0000000-0000-0000-0000-000000000003', 'James Wilson', 5, 'Outside Hitter'),
  ('b0000000-0000-0000-0000-000000000003', 'William Davis', 6, 'Middle Blocker'),
  ('b0000000-0000-0000-0000-000000000003', 'Richard Miller', 7, 'Libero');

-- Volleyball: Skyliners (7 players)
INSERT INTO players (team_id, name, number, position) VALUES
  ('b0000000-0000-0000-0000-000000000004', 'Thomas Moore', 8, 'Setter'),
  ('b0000000-0000-0000-0000-000000000004', 'Charles Taylor', 9, 'Outside Hitter'),
  ('b0000000-0000-0000-0000-000000000004', 'Daniel Anderson', 10, 'Middle Blocker'),
  ('b0000000-0000-0000-0000-000000000004', 'Matthew Jackson', 11, 'Opposite'),
  ('b0000000-0000-0000-0000-000000000004', 'Anthony White', 12, 'Outside Hitter'),
  ('b0000000-0000-0000-0000-000000000004', 'Mark Harris', 13, 'Middle Blocker'),
  ('b0000000-0000-0000-0000-000000000004', 'Paul Martin', 14, 'Libero');

-- Chess: Checkmate Kings (4 players)
INSERT INTO players (team_id, name, number, position) VALUES
  ('b0000000-0000-0000-0000-000000000005', 'Magnus Carlsen', 1, 'Board 1'),
  ('b0000000-0000-0000-0000-000000000005', 'Hikaru Nakamura', 2, 'Board 2'),
  ('b0000000-0000-0000-0000-000000000005', 'Fabiano Caruana', 3, 'Board 3'),
  ('b0000000-0000-0000-0000-000000000005', 'Anish Giri', 4, 'Board 4');

-- Chess: Grandmaster Knights (4 players)
INSERT INTO players (team_id, name, number, position) VALUES
  ('b0000000-0000-0000-0000-000000000006', 'Ding Liren', 1, 'Board 1'),
  ('b0000000-0000-0000-0000-000000000006', 'Ian Nepomniachtchi', 2, 'Board 2'),
  ('b0000000-0000-0000-0000-000000000006', 'Alireza Firouzja', 3, 'Board 3'),
  ('b0000000-0000-0000-0000-000000000006', 'Wesley So', 4, 'Board 4');

-- Futsal: Futsal Flames (7 players)
INSERT INTO players (team_id, name, number, position) VALUES
  ('b0000000-0000-0000-0000-000000000007', 'Ricardinho', 10, 'Pivot'),
  ('b0000000-0000-0000-0000-000000000007', 'Falcao', 9, 'Pivot'),
  ('b0000000-0000-0000-0000-000000000007', 'Sergio Lozano', 7, 'Winger'),
  ('b0000000-0000-0000-0000-000000000007', 'Pola', 5, 'Defender'),
  ('b0000000-0000-0000-0000-000000000007', 'Higuita', 1, 'Goalkeeper'),
  ('b0000000-0000-0000-0000-000000000007', 'Gadeia', 8, 'Winger'),
  ('b0000000-0000-0000-0000-000000000007', 'Ferrao', 11, 'Pivot');

-- Futsal: Goal Strikers (7 players)
INSERT INTO players (team_id, name, number, position) VALUES
  ('b0000000-0000-0000-0000-000000000008', 'Neto', 10, 'Pivot'),
  ('b0000000-0000-0000-0000-000000000008', 'Dyego', 9, 'Pivot'),
  ('b0000000-0000-0000-0000-000000000008', 'Pito', 7, 'Winger'),
  ('b0000000-0000-0000-0000-000000000008', 'Bruno Taffy', 5, 'Defender'),
  ('b0000000-0000-0000-0000-000000000008', 'Guitta', 1, 'Goalkeeper'),
  ('b0000000-0000-0000-0000-000000000008', 'Leandro Lino', 8, 'Winger'),
  ('b0000000-0000-0000-0000-000000000008', 'Arthur', 11, 'Pivot');

-- Table Tennis: Spin Masters (4 players)
INSERT INTO players (team_id, name, number, position) VALUES
  ('b0000000-0000-0000-0000-000000000009', 'Ma Long', 1, 'Singles'),
  ('b0000000-0000-0000-0000-000000000009', 'Fan Zhendong', 2, 'Singles'),
  ('b0000000-0000-0000-0000-000000000009', 'Xu Xin', 3, 'Doubles'),
  ('b0000000-0000-0000-0000-000000000009', 'Wang Chuqin', 4, 'Singles');

-- Table Tennis: Paddle Warriors (4 players)
INSERT INTO players (team_id, name, number, position) VALUES
  ('b0000000-0000-0000-0000-000000000010', 'Tomokazu Harimoto', 1, 'Singles'),
  ('b0000000-0000-0000-0000-000000000010', 'Hugo Calderano', 2, 'Singles'),
  ('b0000000-0000-0000-0000-000000000010', 'Liam Pitchford', 3, 'Doubles'),
  ('b0000000-0000-0000-0000-000000000010', 'Truls Moregard', 4, 'Singles');

-- Badminton: Shuttle Stars (4 players)
INSERT INTO players (team_id, name, number, position) VALUES
  ('b0000000-0000-0000-0000-000000000011', 'Viktor Axelsen', 1, 'Singles'),
  ('b0000000-0000-0000-0000-000000000011', 'Kento Momota', 2, 'Singles'),
  ('b0000000-0000-0000-0000-000000000011', 'Kevin Sanjaya', 3, 'Doubles'),
  ('b0000000-0000-0000-0000-000000000011', 'Marcus Gideon', 4, 'Doubles');

-- Badminton: Smash Titans (4 players)
INSERT INTO players (team_id, name, number, position) VALUES
  ('b0000000-0000-0000-0000-000000000012', 'Lee Zii Jia', 1, 'Singles'),
  ('b0000000-0000-0000-0000-000000000012', 'Anthony Ginting', 2, 'Singles'),
  ('b0000000-0000-0000-0000-000000000012', 'Mohammad Ahsan', 3, 'Doubles'),
  ('b0000000-0000-0000-0000-000000000012', 'Hendra Setiawan', 4, 'Doubles');

-- ============================================
-- 6. SEED USER-TEAM MEMBERSHIPS
-- ============================================
INSERT INTO user_team_memberships (user_id, team_id, position, status) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Captain', 'active'),
  ('a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'Vice Captain', 'active'),
  ('a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 'Captain', 'active'),
  ('a0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000004', 'Player', 'active'),
  ('a0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000005', 'Board 1', 'active'),
  ('a0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000007', 'Pivot', 'active');

-- ============================================
-- 7. SEED MATCHES (various statuses per sport)
-- ============================================

-- CRICKET MATCHES
-- Match 1: Completed match with full score
INSERT INTO matches (id, sport, home_team_id, away_team_id, match_date, venue, status, score, version) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'cricket',
   'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002',
   '2026-03-20T14:00:00', 'Chinnaswamy Stadium', 'completed',
   '{"innings": [{"teamId": "b0000000-0000-0000-0000-000000000001", "runs": 185, "wickets": 6, "overs": 20, "balls": 0, "extras": {"wides": 5, "noBalls": 2, "byes": 1, "legByes": 3}}, {"teamId": "b0000000-0000-0000-0000-000000000002", "runs": 172, "wickets": 8, "overs": 20, "balls": 0, "extras": {"wides": 3, "noBalls": 1, "byes": 2, "legByes": 0}}], "currentInnings": 1, "result": "Royal Challengers won by 13 runs"}',
   5);

-- Match 2: Scheduled upcoming match
INSERT INTO matches (id, sport, home_team_id, away_team_id, match_date, venue, status, version) VALUES
  ('c0000000-0000-0000-0000-000000000002', 'cricket',
   'b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
   '2026-04-05T18:00:00', 'Wankhede Stadium', 'scheduled', 0);

-- Match 3: Live match in progress
INSERT INTO matches (id, sport, home_team_id, away_team_id, match_date, venue, status, score, version) VALUES
  ('c0000000-0000-0000-0000-000000000003', 'cricket',
   'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002',
   '2026-03-25T14:00:00', 'M. Chinnaswamy Stadium', 'live',
   '{"innings": [{"teamId": "b0000000-0000-0000-0000-000000000001", "runs": 156, "wickets": 4, "overs": 16, "balls": 3, "extras": {"wides": 2, "noBalls": 1, "byes": 0, "legByes": 1}}], "currentInnings": 0}',
   12);

-- VOLLEYBALL MATCHES
-- Match 4: Completed volleyball
INSERT INTO matches (id, sport, home_team_id, away_team_id, match_date, venue, status, score, version) VALUES
  ('c0000000-0000-0000-0000-000000000004', 'volleyball',
   'b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004',
   '2026-03-18T16:00:00', 'Indoor Stadium A', 'completed',
   '{"sets": [{"home": 25, "away": 21}, {"home": 23, "away": 25}, {"home": 25, "away": 19}, {"home": 25, "away": 22}], "currentSet": 3, "setsWon": {"home": 3, "away": 1}, "numberOfSets": 5, "result": "Thunderbolts won 3-1"}',
   18);

-- Match 5: Scheduled volleyball
INSERT INTO matches (id, sport, home_team_id, away_team_id, match_date, venue, status, version) VALUES
  ('c0000000-0000-0000-0000-000000000005', 'volleyball',
   'b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003',
   '2026-04-10T17:00:00', 'Sports Complex B', 'scheduled', 0);

-- CHESS MATCHES
-- Match 6: Completed chess
INSERT INTO matches (id, sport, home_team_id, away_team_id, match_date, venue, status, score, version) VALUES
  ('c0000000-0000-0000-0000-000000000006', 'chess',
   'b0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000006',
   '2026-03-15T10:00:00', 'Chess Arena', 'completed',
   '{"games": [{"result": "white", "whiteTeamId": "b0000000-0000-0000-0000-000000000005"}, {"result": "draw", "whiteTeamId": "b0000000-0000-0000-0000-000000000006"}, {"result": "white", "whiteTeamId": "b0000000-0000-0000-0000-000000000005"}], "homeScore": 2.5, "awayScore": 0.5, "result": "Checkmate Kings won 2.5-0.5"}',
   3);

-- Match 7: Scheduled chess
INSERT INTO matches (id, sport, home_team_id, away_team_id, match_date, venue, status, version) VALUES
  ('c0000000-0000-0000-0000-000000000007', 'chess',
   'b0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000005',
   '2026-04-12T10:00:00', 'Grand Chess Hall', 'scheduled', 0);

-- FUTSAL MATCHES
-- Match 8: Completed futsal
INSERT INTO matches (id, sport, home_team_id, away_team_id, match_date, venue, status, score, version) VALUES
  ('c0000000-0000-0000-0000-000000000008', 'futsal',
   'b0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000008',
   '2026-03-19T19:00:00', 'Futsal Court 1', 'completed',
   '{"homeScore": 5, "awayScore": 3, "half": 2, "result": "Futsal Flames won 5-3"}',
   10);

-- Match 9: Live futsal
INSERT INTO matches (id, sport, home_team_id, away_team_id, match_date, venue, status, score, version) VALUES
  ('c0000000-0000-0000-0000-000000000009', 'futsal',
   'b0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000007',
   '2026-03-25T19:00:00', 'Futsal Arena', 'live',
   '{"homeScore": 2, "awayScore": 2, "half": 1}',
   6);

-- TABLE TENNIS MATCHES
-- Match 10: Completed table tennis
INSERT INTO matches (id, sport, home_team_id, away_team_id, match_date, venue, status, score, version) VALUES
  ('c0000000-0000-0000-0000-000000000010', 'table-tennis',
   'b0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000010',
   '2026-03-17T15:00:00', 'TT Hall', 'completed',
   '{"sets": [{"home": 11, "away": 8}, {"home": 9, "away": 11}, {"home": 11, "away": 6}, {"home": 11, "away": 9}], "setsWon": {"home": 3, "away": 1}, "result": "Spin Masters won 3-1"}',
   15);

-- Match 11: Scheduled table tennis
INSERT INTO matches (id, sport, home_team_id, away_team_id, match_date, venue, status, version) VALUES
  ('c0000000-0000-0000-0000-000000000011', 'table-tennis',
   'b0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000009',
   '2026-04-08T15:00:00', 'Table Tennis Center', 'scheduled', 0);

-- BADMINTON MATCHES
-- Match 12: Completed badminton
INSERT INTO matches (id, sport, home_team_id, away_team_id, match_date, venue, status, score, version) VALUES
  ('c0000000-0000-0000-0000-000000000012', 'badminton',
   'b0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000012',
   '2026-03-16T14:00:00', 'Badminton Court 1', 'completed',
   '{"games": [{"home": 21, "away": 18}, {"home": 19, "away": 21}, {"home": 21, "away": 15}], "gamesWon": {"home": 2, "away": 1}, "result": "Shuttle Stars won 2-1"}',
   9);

-- Match 13: Scheduled badminton
INSERT INTO matches (id, sport, home_team_id, away_team_id, match_date, venue, status, version) VALUES
  ('c0000000-0000-0000-0000-000000000013', 'badminton',
   'b0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000011',
   '2026-04-15T14:00:00', 'Shuttle Arena', 'scheduled', 0);

-- ============================================
-- 8. SEED SPORT-SPECIFIC CONFIGS
-- ============================================

-- Cricket config for completed match
INSERT INTO cricket_match_config (match_id, total_overs, max_overs_per_bowler, toss_winner_team_id, toss_decision, elected_to_bat_first_team_id, config_completed) VALUES
  ('c0000000-0000-0000-0000-000000000001', 20, 4, 'b0000000-0000-0000-0000-000000000001', 'bat', 'b0000000-0000-0000-0000-000000000001', true);

-- Cricket config for live match
INSERT INTO cricket_match_config (match_id, total_overs, max_overs_per_bowler, toss_winner_team_id, toss_decision, elected_to_bat_first_team_id, config_completed) VALUES
  ('c0000000-0000-0000-0000-000000000003', 20, 4, 'b0000000-0000-0000-0000-000000000002', 'bowl', 'b0000000-0000-0000-0000-000000000001', true);

-- Volleyball config for completed match
INSERT INTO volleyball_match_config (match_id, number_of_sets, toss_winner_team_id, toss_decision, selected_court_side, serving_team, config_completed) VALUES
  ('c0000000-0000-0000-0000-000000000004', 5, 'b0000000-0000-0000-0000-000000000003', 'serve', 'left', 'home', true);

-- Chess config for completed match
INSERT INTO chess_match_config (match_id, toss_winner_team_id, toss_decision, selected_color, white_team_id, number_of_games, config_completed) VALUES
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000005', 'white', 'white', 'b0000000-0000-0000-0000-000000000005', 3, true);

-- Futsal config for completed match
INSERT INTO futsal_match_config (match_id, toss_winner_team_id, toss_decision, selected_side, kicking_off_team, config_completed) VALUES
  ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000007', 'kick-off', 'left', 'home', true);

-- Futsal config for live match
INSERT INTO futsal_match_config (match_id, toss_winner_team_id, toss_decision, selected_side, kicking_off_team, config_completed) VALUES
  ('c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000008', 'side', 'right', 'home', true);

-- Table Tennis config for completed match
INSERT INTO table_tennis_match_config (match_id, sets_to_win, points_to_win_per_set, toss_winner_team_id, toss_decision, selected_table_side, serving_team, config_completed) VALUES
  ('c0000000-0000-0000-0000-000000000010', 3, 11, 'b0000000-0000-0000-0000-000000000009', 'serve', 'near', 'home', true);

-- Badminton config for completed match
INSERT INTO badminton_match_config (match_id, games_to_win, points_to_win_per_game, toss_winner_team_id, toss_decision, selected_court_side, serving_team, config_completed) VALUES
  ('c0000000-0000-0000-0000-000000000012', 2, 21, 'b0000000-0000-0000-0000-000000000011', 'serve', 'left', 'home', true);

-- ============================================
-- 9. SEED USER MATCH PARTICIPATION
-- ============================================
INSERT INTO user_match_participation (user_id, match_id, team_id, performance_score) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 8.50),
  ('a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 7.20),
  ('a0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 9.00),
  ('a0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 7.80),
  ('a0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000005', 9.50);

-- ============================================
-- 10. SEED USER SPORTS STATS
-- ============================================
INSERT INTO user_sports_stats (user_id, sport, total_matches, wins, losses, draws, performance_rating) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'cricket', 5, 3, 2, 0, 7.80),
  ('a0000000-0000-0000-0000-000000000004', 'cricket', 5, 2, 3, 0, 6.50),
  ('a0000000-0000-0000-0000-000000000005', 'volleyball', 4, 3, 1, 0, 8.20),
  ('a0000000-0000-0000-0000-000000000006', 'volleyball', 4, 1, 3, 0, 6.80),
  ('a0000000-0000-0000-0000-000000000007', 'chess', 3, 2, 0, 1, 9.00),
  ('a0000000-0000-0000-0000-000000000008', 'futsal', 3, 2, 1, 0, 7.50);

-- ============================================
-- 11. SEED TOURNAMENT
-- ============================================
INSERT INTO tournaments (id, name, sport, format, bracket_type, status, start_date, sports_count) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Spring Championship 2026', 'cricket', 'group_stage', 'single_elimination', 'upcoming', '2026-04-20', 2);

-- Tournament sports
INSERT INTO tournament_sports (id, tournament_id, sport, display_order) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'cricket', 0),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'volleyball', 1);

-- Tournament groups
INSERT INTO tournament_groups (id, tournament_id, tournament_sport_id, group_name, sport, display_order) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Group A - Cricket', 'cricket', 0),
  ('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'Group A - Volleyball', 'volleyball', 1);

-- Group teams
INSERT INTO group_teams (group_id, team_id, display_order) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 0),
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 1),
  ('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 0),
  ('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 1);

-- Group matches
INSERT INTO group_matches (group_id, team1_id, team2_id, match_date, status) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', '2026-04-20T14:00:00', 'scheduled'),
  ('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', '2026-04-21T16:00:00', 'scheduled');

-- ============================================
-- DONE
-- ============================================
