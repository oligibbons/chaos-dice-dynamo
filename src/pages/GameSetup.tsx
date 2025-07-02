
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Copy, Play, Crown, UserCheck, Clock, Settings, LogOut, AlertTriangle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useGameData } from "@/hooks/useGameData";

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

const GameSetup = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentGame, loading, error, setupRealtimeSubscription, refetch } = useGameData(gameId);
  
  const [isHost, setIsHost] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [maxRounds, setMaxRounds] = useState(7);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (gameId && user) {
      const cleanup = setupRealtimeSubscription(() => {
        console.log('Game updated via realtime');
      });
      return cleanup;
    }
  }, [gameId, user, setupRealtimeSubscription]);

  useEffect(() => {
    if (currentGame && user) {
      setIsHost(currentGame.host_id === user.id);
      setGameCode(currentGame.game_code || '');
      setMaxRounds(currentGame.max_rounds || 7);
      
      // Set current user's ready status
      const currentPlayer = currentGame.players.find(p => p.id === user.id);
      if (currentPlayer) {
        setIsReady(currentPlayer.is_ready);
      }

      // If game is active, redirect to game screen
      if (currentGame.status === 'active') {
        navigate(`/game/${currentGame.id}`);
      }
    }
  }, [currentGame, user, navigate]);

  const generateGameCode = () => {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  };

  const ensureGameCode = async () => {
    if (!gameId || !isHost || gameCode) return gameCode;
    
    try {
      const newGameCode = generateGameCode();
      const { error } = await supabase
        .from('games')
        .update({ game_code: newGameCode })
        .eq('id', gameId);

      if (error) throw error;
      
      setGameCode(newGameCode);
      return newGameCode;
    } catch (error) {
      console.error('Error generating game code:', error);
      return null;
    }
  };

  const copyGameCode = async () => {
    const codeToUse = gameCode || await ensureGameCode();
    if (codeToUse) {
      await navigator.clipboard.writeText(codeToUse);
      toast({
        title: "Copied!",
        description: "Game code copied to clipboard",
      });
    }
  };

  const toggleReady = async () => {
    if (!user || !gameId || actionLoading) return;
    
    setActionLoading('ready');
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
    } catch (error: any) {
      console.error('Error updating ready status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update ready status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const startGame = async () => {
    if (!isHost || !gameId || actionLoading) return;
    
    setActionLoading('start');
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
    } catch (error: any) {
      console.error('Error starting game:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start game",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const updateMaxRounds = async (rounds: number) => {
    if (!isHost || !gameId || actionLoading) return;
    
    try {
      const { error } = await supabase
        .from('games')
        .update({ max_rounds: rounds })
        .eq('id', gameId);

      if (error) throw error;
      
      setMaxRounds(rounds);
    } catch (error: any) {
      console.error('Error updating max rounds:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update game settings",
        variant: "destructive",
      });
    }
  };

  const leaveGame = async () => {
    if (!user || !gameId || actionLoading) return;
    
    setActionLoading('leave');
    try {
      // Delete player record (trigger will update current_players automatically)
      const { error } = await supabase
        .from('game_players')
        .delete()
        .eq('game_id', gameId)
        .eq('player_id', user.id);

      if (error) throw error;

      navigate('/lobby');
      toast({
        title: "Left Game",
        description: "You have left the game setup",
      });
    } catch (error: any) {
      console.error('Error leaving game:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to leave game",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !currentGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl font-quicksand">Loading game setup...</p>
        </div>
      </div>
    );
  }

  if (error || !currentGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-white text-2xl font-bangers mb-2">Game Not Found</h2>
          <p className="text-red-200 font-quicksand mb-4">{error || 'This game may have been deleted or is no longer available.'}</p>
          <Button onClick={() => navigate('/lobby')} className="bg-blue-600 hover:bg-blue-700">
            Return to Lobby
          </Button>
        </div>
      </div>
    );
  }

  const allPlayersReady = currentGame.players.length > 1 && currentGame.players.every(p => p.is_ready || p.is_host);
  const canStartGame = isHost && currentGame.players.length >= 2 && (allPlayersReady || isHost);

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
            <h1 className="font-bangers text-4xl sm:text-5xl text-white mb-2">{currentGame.name}</h1>
            <p className="text-purple-200 font-quicksand">Game Setup & Player Lobby</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={refetch}
              disabled={loading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 font-quicksand"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={leaveGame}
              disabled={actionLoading === 'leave'}
              variant="outline"
              size="sm"
              className="border-red-400/60 text-red-300 hover:bg-red-800/50 hover:text-red-200 font-quicksand"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {actionLoading === 'leave' ? 'Leaving...' : 'Leave'}
            </Button>
          </div>
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
                        {gameCode || 'LOADING...'}
                      </div>
                    </div>
                    <Button
                      onClick={copyGameCode}
                      size="sm"
                      disabled={!gameCode}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white font-quicksand"
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
                          disabled={actionLoading !== null}
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
                        disabled={!canStartGame || actionLoading === 'start'}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:text-gray-300 text-white font-bangers text-xl px-8 py-4 rounded-xl"
                      >
                        <Play className="h-6 w-6 mr-2" />
                        {actionLoading === 'start' ? 'STARTING...' : 'START GAME!'}
                      </Button>
                      <p className="text-green-200 text-sm mt-2 font-quicksand">
                        {currentGame.players.length < 2 ? 'Need at least 2 players' : 
                         !allPlayersReady ? 'Waiting for players to ready up' : 
                         'Ready to start!'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Button
                        onClick={toggleReady}
                        disabled={actionLoading === 'ready'}
                        className={`font-bangers text-xl px-8 py-4 rounded-xl text-white ${
                          isReady 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        <UserCheck className="h-6 w-6 mr-2" />
                        {actionLoading === 'ready' ? 'UPDATING...' : 
                         isReady ? 'READY!' : 'NOT READY'}
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
                  Players ({currentGame.current_players}/{currentGame.max_players})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentGame.players.map((player, index) => (
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
                              className={`font-quicksand text-xs text-white ${
                                player.is_ready || player.is_host
                                  ? 'bg-green-600' 
                                  : 'bg-gray-600'
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
                  {Array.from({ length: currentGame.max_players - currentGame.players.length }).map((_, index) => (
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
