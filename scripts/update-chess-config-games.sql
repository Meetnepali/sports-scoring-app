-- Add number_of_games column to chess_match_config
ALTER TABLE chess_match_config 
ADD COLUMN IF NOT EXISTS number_of_games INTEGER DEFAULT 1;

