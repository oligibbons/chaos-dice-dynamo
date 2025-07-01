
-- Add game_code column to games table
ALTER TABLE public.games ADD COLUMN game_code TEXT;

-- Add is_ready column to game_players table  
ALTER TABLE public.game_players ADD COLUMN is_ready BOOLEAN DEFAULT false;

-- Create index on game_code for faster lookups
CREATE INDEX idx_games_game_code ON public.games(game_code);
