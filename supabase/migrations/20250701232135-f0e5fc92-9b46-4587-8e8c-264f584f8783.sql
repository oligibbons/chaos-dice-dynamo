
-- Add is_private column to games table to support private games
ALTER TABLE public.games ADD COLUMN is_private BOOLEAN DEFAULT false;

-- Create index on is_private for faster filtering
CREATE INDEX idx_games_is_private ON public.games(is_private);
