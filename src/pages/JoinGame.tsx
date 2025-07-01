
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const JoinGame = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [gameCode, setGameCode] = useState('');
  const [loading, setLoading] = useState(false);

  const joinGameByCode = async () => {
    if (!gameCode.trim() || !user) return;
    
    setLoading(true);

    try {
      // Find game by code
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('game_code', gameCode.toUpperCase())
        .eq('status', 'waiting')
        .single();

      if (gameError || !game) {
        toast({
          title: "Invalid Code",
          description: "Game not found or no longer accepting players",
          variant: "destructive",
        });
        return;
      }

      // Check if user is already in the game
      const { data: existingPlayer } = await supabase
        .from('game_players')
        .select('id')
        .eq('game_id', game.id)
        .eq('player_id', user.id)
        .single();

      if (existingPlayer) {
        navigate(`/game/${game.id}/setup`);
        return;
      }

      // Check if game is full
      const { count } = await supabase
        .from('game_players')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', game.id);

      if ((count || 0) >= game.max_players) {
        toast({
          title: "Game Full",
          description: "This game is already full",
          variant: "destructive",
        });
        return;
      }

      // Add player to the game
      const { error } = await supabase
        .from('game_players')
        .insert({
          game_id: game.id,
          player_id: user.id,
          turn_order: count || 0,
          is_ready: false
        });

      if (error) throw error;

      // Update game player count
      await supabase
        .from('games')
        .update({ current_players: (count || 0) + 1 })
        .eq('id', game.id);

      navigate(`/game/${game.id}/setup`);
      toast({
        title: "Joined Game!",
        description: `Successfully joined ${game.name}`,
      });
    } catch (error: any) {
      console.error('Error joining game:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join game",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 font-quicksand">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <Button
            onClick={() => navigate('/lobby')}
            variant="outline"
            size="sm"
            className="border-purple-500/50 text-purple-200 font-quicksand"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-bangers text-4xl text-white">Join Game</h1>
        </motion.div>

        {/* Join by Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-black/50 border-blue-500/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="font-bangers text-white flex items-center justify-center gap-2 text-2xl">
                <Users className="h-6 w-6 text-blue-400" />
                Enter Game Code
              </CardTitle>
              <CardDescription className="text-blue-200 font-quicksand">
                Enter the 8-digit code shared by your friend
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Input
                  placeholder="Enter 8-digit code..."
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  className="bg-blue-900/30 border-blue-500/50 text-white text-center font-bangers text-2xl tracking-wider"
                  maxLength={8}
                  onKeyPress={(e) => e.key === 'Enter' && joinGameByCode()}
                />
              </div>
              
              <Button 
                onClick={joinGameByCode} 
                className="w-full bg-blue-600 hover:bg-blue-700 font-bangers text-xl py-6"
                disabled={loading || gameCode.length < 8}
              >
                {loading ? 'Joining...' : 'JOIN GAME'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <Card className="bg-black/30 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <p className="text-purple-200 text-sm font-quicksand">
                Ask your friend for their game code and enter it above to join their game lobby.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default JoinGame;
