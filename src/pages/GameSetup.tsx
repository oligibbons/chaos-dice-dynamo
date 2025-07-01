
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Copy, Play, Crown, UserCheck, Clock, Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface GameRoom {
  id: string;
  name: string;
  host_id: string;
  current_players: number;
  max_players: number;
  status: 'waiting' | 'active' | 'finished';
  game_code?: string;
  max_rounds: number;
}

interface Player {
  id: string;
  username: string;
  is_ready: boolean;
  is_host: boolean;
  joined_at: string;
}

const GameSetup = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gameCode, setGameCode] = useState('');
  const [maxRounds, setMaxRounds] = useState(7);

  useEffect(() => {
    if (gameId && user) {
      fetchGameData();
      
      // Subscribe to real-time updates
      const gameChannel = supabase
        .channel(`game-setup-${gameId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        }, () => {
          fetchGameData();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `game_id=eq.${gameId}`
        }, () => {
          fetchPlayers();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(gameChannel);
      };
    }
  }, [gameId, user]);

  const generateGameCode = () => {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  };

  const fetchGameData = async () => {
    if (!gameId) return;
    
    try {
      const { data: game, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (error) throw error;
      
      if (game) {
        // Generate game code if it doesn't exist
        let currentGameCode = game.game_code;
        if (!currentGameCode) {
          currentGameCode = generateGameCode();
          await supabase
            .from('games')
            .update({ game_code: currentGameCode })
            .eq('id', gameId);
        }
        
        setGameRoom({
          ...game,
          game_code: currentGameCode
        });
        setGameCode(currentGameCode);
        setIsHost(game.host_id === user?.id);
        setMaxRounds(game.max_rounds || 7);
        
        // If game is active, redirect to game screen
        if (game.status === 'active') {
          navigate(`/game/${gameId}`);
        }
      }
      
      fetchPlayers();
    } catch (error) {
      console.error('Error fetching game:', error);
      toast({
        title: "Error",
        description: "Failed to load game data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayers = async () => {
    if (!gameId) return;
    
    try {
      const { data: gamePlayers, error } = await supabase
        .from('game_players')
        .select(`
          *,
          profiles:player_id (username)
        `)
        .eq('game_id', gameId)
        .order('joined_at');

      if (error) throw error;
      
      if (gamePlayers) {
        const playersData = gamePlayers.map(gp => ({
          id: gp.player_id,
          username: (gp.profiles as any)?.username || 'Unknown',
          is_ready: gp.is_ready || false,
          is_host: gp.player_id === gameRoom?.host_id,
          joined_at: gp.joined_at
        }));
        
        setPlayers(playersData);
        
        // Set current user's ready status
        const currentPlayer = playersData.find(p => p.id === user?.id);
        if (currentPlayer) {
          setIsReady(currentPlayer.is_ready);
        }
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const copyGameCode = async () => {
    if (gameCode) {
      await navigator.clipboard.writeText(gameCode);
      toast({
        title: "Copied!",
        description: "Game code copied to clipboard",
      });
    }
  };

  const toggleReady = async () => {
    if (!user || !gameId) return;
    
    const newReadyStatus = !isReady;
    
    try {
      const { error } = await supabase
        .from('game_players')
        .update({ is_ready: newReadyStatus })
        .eq('game_id', gameId)
        .eq('player_id', user.id);

      if (error) throw error;
      
      setIsReady(newReadyStatus);
      toast({
        title: newReadyStatus ? "Ready!" : "Not Ready",
        description: newReadyStatus ? "You're ready to play!" : "You're no longer ready",
      });
    } catch (error) {
      console.error('Error updating ready status:', error);
      toast({
        title: "Error",
        description: "Failed to update ready status",
        variant: "destructive",
      });
    }
  };

  const startGame = async () => {
    if (!isHost || !gameId) return;
    
    try {
      // Start the game
      const { error } = await supabase
        .from('games')
        .update({ 
          status: 'active',
          started_at: new Date().toISOString(),
          current_round: 1,
          current_player_turn: 0,
          turn_start_time: new Date().toISOString()
        })
        .eq('id', gameId);

      if (error) throw error;
      
      toast({
        title: "Game Started!",
        description: "Let the chaos begin!",
      });
      
      navigate(`/game/${gameId}`);
    } catch (error) {
      console.error('Error starting game:', error);
      toast({
        title: "Error",
        description: "Failed to start game",
        variant: "destructive",
      });
    }
  };

  const updateMaxRounds = async (rounds: number) => {
    if (!isHost || !gameId) return;
    
    try {
      const { error } = await supabase
        .from('games')
        .update({ max_rounds: rounds })
        .eq('id', gameId);

      if (error) throw error;
      
      setMaxRounds(rounds);
    } catch (error) {
      console.error('Error updating max rounds:', error);
    }
  };

  const leaveGame = async () => {
    if (!user || !gameId) return;
    
    try {
      await supabase
        .from('game_players')
        .delete()
        .eq('game_id', gameId)
        .eq('player_id', user.id);

      navigate('/lobby');
      toast({
        title: "Left Game",
        description: "You have left the game setup",
      });
    } catch (error) {
      console.error('Error leaving game:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl font-quicksand">Loading game setup...</div>
      </div>
    );
  }

  if (!gameRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl font-quicksand">Game not found</div>
      </div>
    );
  }

  const allPlayersReady = players.length > 1 && players.every(p => p.is_ready || p.is_host);
  const canStartGame = isHost && players.length >= 2 && (allPlayersReady || isHost);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 font-quicksand">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="font-bangers text-4xl sm:text-5xl text-white mb-2">{gameRoom.name}</h1>
            <p className="text-purple-200 font-quicksand">Game Setup & Player Lobby</p>
          </div>
          <Button
            onClick={leaveGame}
            variant="outline"
            size="sm"
            className="border-red-400/60 text-red-300 hover:bg-red-800/50 font-quicksand"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Leave
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Game Info & Controls */}
          <div className="space-y-6">
            {/* Game Code */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-black/50 border-yellow-400/60 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="font-bangers text-white flex items-center gap-2 text-2xl">
                    <Crown className="h-5 w-5 text-yellow-400" />
                    Game Code
                  </CardTitle>
                  <CardDescription className="text-yellow-200 font-quicksand">
                    Share this code with friends to join
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg px-4 py-3 flex-1">
                      <div className="font-bangers text-3xl text-yellow-300 text-center tracking-wider">
                        {gameCode}
                      </div>
                    </div>
                    <Button
                      onClick={copyGameCode}
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-700 font-quicksand"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Game Settings */}
            {isHost && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-black/50 border-purple-400/60 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="font-bangers text-white flex items-center gap-2 text-xl">
                      <Settings className="h-5 w-5" />
                      Game Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-white font-quicksand mb-2 block">Max Rounds: {maxRounds}</label>
                        <Input
                          type="range"
                          min="3"
                          max="15"
                          value={maxRounds}
                          onChange={(e) => updateMaxRounds(parseInt(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-purple-300 text-sm mt-1 font-quicksand">
                          <span>Quick (3)</span>
                          <span>Standard (7)</span>
                          <span>Epic (15)</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Ready Up / Start Game */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-black/50 border-green-400/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  {isHost ? (
                    <div className="text-center">
                      <Button
                        onClick={startGame}
                        disabled={!canStartGame}
                        className="bg-green-600 hover:bg-green-700 font-bangers text-xl px-8 py-4 rounded-xl"
                      >
                        <Play className="h-6 w-6 mr-2" />
                        START GAME!
                      </Button>
                      <p className="text-green-200 text-sm mt-2 font-quicksand">
                        {players.length < 2 ? 'Need at least 2 players' : 
                         !allPlayersReady ? 'Waiting for players to ready up' : 
                         'Ready to start!'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Button
                        onClick={toggleReady}
                        className={`font-bangers text-xl px-8 py-4 rounded-xl ${
                          isReady 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        <UserCheck className="h-6 w-6 mr-2" />
                        {isReady ? 'READY!' : 'NOT READY'}
                      </Button>
                      <p className="text-green-200 text-sm mt-2 font-quicksand">
                        {isReady ? 'Waiting for host to start...' : 'Click to ready up!'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Players List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-black/50 border-blue-400/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-bangers text-white flex items-center gap-2 text-2xl">
                  <Users className="h-5 w-5" />
                  Players ({players.length}/{gameRoom.max_players})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {players.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-blue-900/20 rounded-lg border border-blue-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bangers">
                            {player.username[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-quicksand font-medium">
                              {player.username}
                              {player.id === user?.id && ' (You)'}
                            </span>
                            {player.is_host && <Crown className="h-4 w-4 text-yellow-400" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={`font-quicksand text-xs ${
                                player.is_ready || player.is_host
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-gray-600 text-white'
                              }`}
                            >
                              {player.is_host ? 'Host' : player.is_ready ? 'Ready' : 'Not Ready'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        {(player.is_ready || player.is_host) ? (
                          <UserCheck className="h-5 w-5 text-green-400" />
                        ) : (
                          <Clock className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Empty slots */}
                  {Array.from({ length: gameRoom.max_players - players.length }).map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="flex items-center justify-between p-4 bg-gray-900/20 rounded-lg border border-gray-500/30 opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gray-600 text-gray-400">
                            ?
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-gray-400 font-quicksand">Waiting for player...</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GameSetup;
