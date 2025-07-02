
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Gamepad2, Users, Plus, Search, Clock, Crown, RefreshCw, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useGameData } from "@/hooks/useGameData";

const Lobby = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { games, loading, error, setupRealtimeSubscription, refetch } = useGameData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [isPrivateGame, setIsPrivateGame] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [user, setupRealtimeSubscription]);

  const createGame = async () => {
    if (!newGameName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a game name",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a game",
        variant: "destructive",
      });
      return;
    }

    setCreateLoading(true);
    try {
      const gameCode = Math.random().toString(36).substr(2, 8).toUpperCase();
      
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          name: newGameName,
          host_id: user.id,
          is_private: isPrivateGame,
          game_code: gameCode,
          status: 'waiting',
          current_players: 0, // Will be updated by trigger
          max_players: 4
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Add the host as the first player
      const { error: playerError } = await supabase
        .from('game_players')
        .insert({
          game_id: game.id,
          player_id: user.id,
          turn_order: 0,
          is_ready: false
        });

      if (playerError) throw playerError;

      toast({
        title: "Game Created!",
        description: `Game "${newGameName}" has been created with code: ${gameCode}`,
      });

      setNewGameName('');
      setShowCreateGame(false);
      navigate(`/game/${game.id}/setup`);
    } catch (error: any) {
      console.error('Error creating game:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create game. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const joinGame = async (gameId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to join a game",
        variant: "destructive",
      });
      return;
    }

    setJoinLoading(gameId);
    try {
      console.log('Joining game:', gameId);
      
      // Check if user is already in this game
      const { data: existingPlayer } = await supabase
        .from('game_players')
        .select('id')
        .eq('game_id', gameId)
        .eq('player_id', user.id)
        .maybeSingle();

      if (existingPlayer) {
        navigate(`/game/${gameId}/setup`);
        return;
      }

      // Get current game info
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('current_players, max_players, status')
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;
      
      if (!game) {
        throw new Error('Game not found');
      }

      if (game.status !== 'waiting') {
        toast({
          title: "Game Unavailable",
          description: "This game is no longer accepting players",
          variant: "destructive",
        });
        return;
      }

      if (game.current_players >= game.max_players) {
        toast({
          title: "Game Full",
          description: "This game is already full",
          variant: "destructive",
        });
        return;
      }

      // Add player to game
      const { error: joinError } = await supabase
        .from('game_players')
        .insert({
          game_id: gameId,
          player_id: user.id,
          turn_order: game.current_players,
          is_ready: false
        });

      if (joinError) throw joinError;

      toast({
        title: "Joined Game!",
        description: "You have successfully joined the game",
      });

      navigate(`/game/${gameId}/setup`);
    } catch (error: any) {
      console.error('Error joining game:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join game. Please try again.",
        variant: "destructive",
      });
    } finally {
      setJoinLoading(null);
    }
  };

  const filteredGames = games.filter(game =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && games.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 font-quicksand flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading games...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 font-quicksand">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <Gamepad2 className="text-blue-400 h-8 w-8" />
            <h1 className="font-bangers text-5xl text-white">Game Lobby</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={refetch}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 font-quicksand font-semibold"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowCreateGame(!showCreateGame)}
              className="bg-green-600 hover:bg-green-700 font-quicksand font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Game
            </Button>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-red-900/50 border-red-500/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-red-200 font-quicksand font-medium">Error loading games</p>
                    <p className="text-red-300 text-sm font-quicksand">{error}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={refetch}
                    className="ml-auto bg-red-600 hover:bg-red-700"
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Create Game Form */}
        {showCreateGame && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card className="bg-black/50 border-green-500/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-bangers text-white text-2xl">Create New Game</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Game name..."
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  className="bg-green-900/30 border-green-500/50 text-white font-quicksand"
                  disabled={createLoading}
                />
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-white font-quicksand">
                    <input
                      type="checkbox"
                      checked={isPrivateGame}
                      onChange={(e) => setIsPrivateGame(e.target.checked)}
                      className="rounded"
                      disabled={createLoading}
                    />
                    Private Game
                  </label>
                  <Button
                    onClick={createGame}
                    disabled={createLoading || !newGameName.trim()}
                    className="bg-green-600 hover:bg-green-700 font-quicksand font-semibold"
                  >
                    {createLoading ? 'Creating...' : 'Create Game'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
            <Input
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-blue-900/30 border-blue-500/50 text-white pl-10 font-quicksand"
            />
          </div>
        </motion.div>

        {/* Games Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredGames.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Gamepad2 className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <p className="text-blue-200 text-lg mb-2 font-quicksand">
                {error ? 'Unable to load games' : 'No games available'}
              </p>
              <p className="text-blue-300 font-quicksand">Create a new game to get started!</p>
            </div>
          ) : (
            filteredGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className="bg-black/50 border-blue-500/50 backdrop-blur-sm hover:border-blue-400/70 transition-all group">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-bangers text-white text-xl group-hover:text-blue-300 transition-colors">
                        {game.name}
                      </CardTitle>
                      {game.is_private && (
                        <Badge className="bg-purple-600 text-white font-quicksand text-xs">
                          Private
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-blue-200 font-quicksand">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {game.current_players}/{game.max_players} players
                        </span>
                        <span className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {new Date(game.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Players List */}
                      <div className="space-y-2">
                        <h4 className="text-white font-quicksand font-medium text-sm">Players:</h4>
                        {game.players.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {game.players.map((player) => (
                              <div key={player.id} className="flex items-center gap-2 bg-blue-900/30 rounded-lg px-2 py-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bangers text-xs">
                                    {player.username[0]?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-white text-xs font-quicksand">{player.username}</span>
                                {player.is_host && <Crown className="h-3 w-3 text-yellow-400" />}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-blue-300 text-sm font-quicksand">Loading players...</p>
                        )}
                      </div>

                      <Button
                        onClick={() => joinGame(game.id)}
                        disabled={game.current_players >= game.max_players || joinLoading === game.id}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-quicksand font-semibold"
                      >
                        {joinLoading === game.id ? 'Joining...' : 
                         game.current_players >= game.max_players ? 'Game Full' : 
                         'Join Game'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Lobby;
