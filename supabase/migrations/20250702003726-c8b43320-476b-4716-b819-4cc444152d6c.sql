
-- Add the new chaos events to the chaos_events table
INSERT INTO public.chaos_events (name, description, effect, trigger_condition, rarity) VALUES

-- Original chaos events
('The Upside-Down Scoreboard', 'Good is bad, and bad is... also bad, sometimes? For this round only, all positive scores become negative, and all negative scores become positive.', '{"type": "flip_scores", "duration": 1}', 'turn_start', 'legendary'),

('The Forced Gamble', 'Feeling lucky? You have no choice! After your final re-roll, you must attempt to score a "Chaos" (Five of a Kind) or "Large Straight." If you succeed, you get double points. If you fail, you score 0.', '{"type": "forced_gamble", "required_combos": ["five_of_kind", "large_straight"]}', 'turn_start', 'legendary'),

('The Midas Touch (of Failure)', 'Careful what you wish for! Some numbers just aren''t golden. This round, any "6" you roll immediately turns into a "1."', '{"type": "transform_dice", "from": 6, "to": 1}', 'turn_start', 'rare'),

('The Time Warp Token', 'Did you just roll... yesterday''s dice? For this round, everyone gets an extra, sixth die. However, this sixth die will always display the same number as the last die rolled by the previous player.', '{"type": "extra_die", "count": 1, "special": "previous_player_last_die"}', 'turn_start', 'rare'),

('Numerical Anarchy', 'Numbers are just suggestions now! Before your first roll, declare one number (1-6). For this round, that number is wild for everyone, but subtracts 5 points at the end.', '{"type": "wild_number", "penalty": 5}', 'turn_start', 'rare'),

('The Dice Jigsaw', 'Piece by piece, your roll will form. Instead of rolling all five dice at once, you roll them one at a time. After each roll, decide to keep or re-roll before the next die.', '{"type": "sequential_rolling"}', 'turn_start', 'rare'),

('The Forced Mulligan', 'No take-backs... unless we make you! If your final score is less than 10 points, you must immediately re-do your entire turn with a new random Chaos Event.', '{"type": "conditional_redo", "threshold": 10}', 'turn_end', 'common'),

('The Teleporting Die', 'Where did it go? One random die from your final roll magically appears in the next player''s hand, giving them six dice for their turn.', '{"type": "teleport_die"}', 'turn_end', 'rare'),

('Opponent''s Veto', 'Looks like someone doesn''t like your score. Any player can spend 5 points to force you to re-roll your entire final dice set one last time.', '{"type": "player_veto", "cost": 5}', 'turn_end', 'rare'),

('The Coughing Dice', 'Are they sick, or just trying to annoy you? If you roll three or more dice with the same number, they all "cough" and change to random new numbers.', '{"type": "coughing_dice", "threshold": 3}', 'any_roll', 'common'),

('The Unbearable Whiff', 'Ugh, what''s that smell? If you don''t score at least 20 points, your turn ends and you get "Stinky Dice" debuff for next round.', '{"type": "stinky_dice", "threshold": 20}', 'turn_end', 'common'),

('Diceception', 'A roll within a roll! Whenever you roll a "3," you must immediately roll that die again until it''s not a "3."', '{"type": "recursive_roll", "trigger_number": 3}', 'any_roll', 'common'),

('The "Oops, Wrong Game!" Die', 'Looks like one of your dice thinks it''s playing checkers. One randomly chosen die becomes a "two-sided" die (only rolls 1 or 6).', '{"type": "binary_die", "values": [1, 6]}', 'turn_start', 'rare'),

-- 6 additional dice modification events following the theme
('Dice Shrinkage Syndrome', 'Your dice are feeling a bit... inadequate. All dice lose one side this turn - they can only roll 1-5!', '{"type": "reduce_sides", "amount": -1, "min_value": 1, "max_value": 5}', 'turn_start', 'rare'),

('The Tiny Terror', 'Everything''s getting smaller! Your dice can only roll 1-4 this turn. Embrace the chaos of limited options!', '{"type": "reduce_sides", "amount": -2, "min_value": 1, "max_value": 4}', 'turn_start', 'rare'),

('Microscopic Madness', 'Your dice have shrunk to their absolute tiniest! They can only roll 1-3 this turn. Good luck with that!', '{"type": "reduce_sides", "amount": -3, "min_value": 1, "max_value": 3}', 'turn_start', 'legendary'),

('Dice Enhancement Potion', 'Someone slipped your dice a growth potion! They can now roll 1-7 this turn. New possibilities await!', '{"type": "increase_sides", "amount": 1, "min_value": 1, "max_value": 7}', 'turn_start', 'rare'),

('The Great Expansion', 'Your dice are feeling ambitious! They can roll 1-8 this turn. Time to think bigger!', '{"type": "increase_sides", "amount": 2, "min_value": 1, "max_value": 8}', 'turn_start', 'rare'),

('Dice Gigantism', 'Your dice have reached maximum size! They can roll 1-9 this turn. The ultimate chaos awaits!', '{"type": "increase_sides", "amount": 3, "min_value": 1, "max_value": 9}', 'turn_start', 'legendary');
