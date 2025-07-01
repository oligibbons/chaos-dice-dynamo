
-- Add UPDATE and DELETE policies for game_players table
CREATE POLICY "Players can update their own game status" 
  ON public.game_players 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = player_id);

CREATE POLICY "Players can leave games" 
  ON public.game_players 
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = player_id);

-- Add policy to allow viewing profiles of players in the same game
CREATE POLICY "Users can view profiles of players in same game" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.game_players gp1
      JOIN public.game_players gp2 ON gp1.game_id = gp2.game_id
      WHERE gp1.player_id = auth.uid() AND gp2.player_id = profiles.id
    )
  );

-- Create trigger function to automatically maintain current_players count
CREATE OR REPLACE FUNCTION public.update_game_player_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    UPDATE public.games 
    SET current_players = (
      SELECT COUNT(*) FROM public.game_players WHERE game_id = NEW.game_id
    )
    WHERE id = NEW.game_id;
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    UPDATE public.games 
    SET current_players = (
      SELECT COUNT(*) FROM public.game_players WHERE game_id = OLD.game_id
    )
    WHERE id = OLD.game_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create triggers for automatic player count management
DROP TRIGGER IF EXISTS trigger_update_player_count_insert ON public.game_players;
DROP TRIGGER IF EXISTS trigger_update_player_count_delete ON public.game_players;

CREATE TRIGGER trigger_update_player_count_insert
  AFTER INSERT ON public.game_players
  FOR EACH ROW EXECUTE FUNCTION public.update_game_player_count();

CREATE TRIGGER trigger_update_player_count_delete
  AFTER DELETE ON public.game_players
  FOR EACH ROW EXECUTE FUNCTION public.update_game_player_count();

-- Function to cleanup disconnected players (optional, for future use)
CREATE OR REPLACE FUNCTION public.cleanup_inactive_players()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remove players from games that have been waiting too long
  -- This can be called periodically or triggered by game events
  DELETE FROM public.game_players 
  WHERE game_id IN (
    SELECT id FROM public.games 
    WHERE status = 'waiting' 
    AND created_at < NOW() - INTERVAL '2 hours'
  );
END;
$$;
