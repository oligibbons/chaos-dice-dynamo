
-- Add missing columns to games table for turn management
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS current_player_turn INTEGER DEFAULT 0;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS turn_start_time TIMESTAMP WITH TIME ZONE;

-- Create game_turns table to track individual turns
CREATE TABLE IF NOT EXISTS public.game_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  turn_number INTEGER NOT NULL,
  dice_rolls JSONB DEFAULT '[]',
  selected_category TEXT,
  score_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create game_scorecards table for detailed scoring
CREATE TABLE IF NOT EXISTS public.game_scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  score INTEGER NOT NULL,
  round_scored INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(game_id, player_id, category)
);

-- Create chaos_events table for game events
CREATE TABLE IF NOT EXISTS public.chaos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  effect JSONB NOT NULL,
  trigger_condition TEXT,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'legendary')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert some default chaos events
INSERT INTO public.chaos_events (name, description, effect, trigger_condition, rarity) VALUES
('Double Trouble', 'All dice show doubles this round!', '{"type": "force_doubles", "duration": 1}', 'any_roll', 'rare'),
('Swap Scores', 'Players swap their highest and lowest scores!', '{"type": "swap_scores", "target": "high_low"}', 'round_end', 'legendary'),
('Bonus Round', 'Everyone gets an extra roll this turn!', '{"type": "extra_roll", "count": 1}', 'any_roll', 'common'),
('Chaos Dice', 'One random die becomes a wild card!', '{"type": "wild_die", "count": 1}', 'any_roll', 'rare'),
('Score Freeze', 'Lowest scoring player is protected from negative events!', '{"type": "protection", "target": "lowest_scorer"}', 'round_start', 'common')
ON CONFLICT DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.game_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chaos_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for game_turns
CREATE POLICY "Players can view game turns" ON public.game_turns
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Players can insert their own turns" ON public.game_turns
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = player_id);

-- RLS policies for game_scorecards
CREATE POLICY "Players can view game scorecards" ON public.game_scorecards
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Players can insert their own scores" ON public.game_scorecards
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can update their own scores" ON public.game_scorecards
  FOR UPDATE TO authenticated
  USING (auth.uid() = player_id);

-- RLS policies for chaos_events
CREATE POLICY "Anyone can view active chaos events" ON public.chaos_events
  FOR SELECT TO authenticated
  USING (active = true);

CREATE POLICY "Admins can manage chaos events" ON public.chaos_events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for all game tables
ALTER TABLE public.games REPLICA IDENTITY FULL;
ALTER TABLE public.game_players REPLICA IDENTITY FULL;
ALTER TABLE public.game_turns REPLICA IDENTITY FULL;
ALTER TABLE public.game_scorecards REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_turns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_scorecards;

-- Update games table policies to allow updates for turn management
CREATE POLICY "Players in game can update game state" ON public.games
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.game_players 
      WHERE game_id = games.id AND player_id = auth.uid()
    )
  );

-- Function to advance game turn
CREATE OR REPLACE FUNCTION public.advance_game_turn(game_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_turn INTEGER;
  player_count INTEGER;
  next_turn INTEGER;
  next_round INTEGER;
BEGIN
  -- Get current game state
  SELECT current_player_turn, current_round INTO current_turn, next_round
  FROM public.games WHERE id = game_uuid;
  
  -- Get player count
  SELECT COUNT(*) INTO player_count
  FROM public.game_players WHERE game_id = game_uuid;
  
  -- Calculate next turn
  next_turn := (current_turn + 1) % player_count;
  
  -- If we've completed a full round, increment round number
  IF next_turn = 0 AND current_turn > 0 THEN
    next_round := next_round + 1;
  END IF;
  
  -- Update game state
  UPDATE public.games 
  SET 
    current_player_turn = next_turn,
    current_round = next_round,
    turn_start_time = now()
  WHERE id = game_uuid;
END;
$$;

-- Function to check game completion
CREATE OR REPLACE FUNCTION public.check_game_completion(game_uuid UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_rounds INTEGER;
  current_round INTEGER;
  is_complete BOOLEAN := false;
BEGIN
  SELECT max_rounds, current_round INTO max_rounds, current_round
  FROM public.games WHERE id = game_uuid;
  
  IF current_round >= max_rounds THEN
    UPDATE public.games 
    SET status = 'finished', finished_at = now()
    WHERE id = game_uuid;
    is_complete := true;
  END IF;
  
  RETURN is_complete;
END;
$$;
