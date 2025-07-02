
-- Phase 1: Database Schema Fixes

-- Add proper foreign key relationship between game_players and profiles
ALTER TABLE public.game_players 
ADD CONSTRAINT game_players_player_id_fkey 
FOREIGN KEY (player_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update RLS policy for profiles to allow viewing profiles of players in same game
DROP POLICY IF EXISTS "Users can view profiles of players in same game" ON public.profiles;

CREATE POLICY "Users can view profiles of players in same game" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 
    FROM game_players gp1 
    JOIN game_players gp2 ON gp1.game_id = gp2.game_id 
    WHERE gp1.player_id = auth.uid() 
    AND gp2.player_id = profiles.id
  ) OR
  EXISTS (
    SELECT 1 
    FROM friends f 
    WHERE ((f.requester_id = auth.uid() AND f.addressee_id = profiles.id) 
           OR (f.addressee_id = auth.uid() AND f.requester_id = profiles.id))
    AND f.status = 'accepted'
  )
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON public.game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_players_player_id ON public.game_players(player_id);
CREATE INDEX IF NOT EXISTS idx_friends_requester_addressee ON public.friends(requester_id, addressee_id);

-- Ensure the trigger for updating current_players is working
DROP TRIGGER IF EXISTS update_game_player_count_trigger ON public.game_players;

CREATE TRIGGER update_game_player_count_trigger
AFTER INSERT OR DELETE ON public.game_players
FOR EACH ROW
EXECUTE FUNCTION public.update_game_player_count();

-- Enable realtime for all game-related tables
ALTER TABLE public.games REPLICA IDENTITY FULL;
ALTER TABLE public.game_players REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.friends REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;
