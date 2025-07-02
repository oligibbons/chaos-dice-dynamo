
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Users, Settings, Play, Crown, Gamepad2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useGameData } from "@/hooks/useGameData";
import ChaoticBackground from "@/components/ChaoticBackground";
import RoomInvite from "@/components/RoomInvite";

const GameSetup = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentGame, loading, setupRealtimeSubscription, refetch } = useGameData(gameId);
  
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [maxRounds, setMaxRounds] = useState(7);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Set up realtime subscription for game updates
  useEffect(() => {
    if (!gameId) return;
    
    console.log('Setting up realtime subscription for game:', gameId);
    
    const cleanup = setupRealtimeSubscription(() => {
      console.log('Game updated, refetching data...');
      refetch();
    });
    
    return cleanup;
  }, [gameId, setupRealtimeSubscription, refetch]);

  // Auto-navigate all players when game starts
  useEffect(() => {
    if (currentGame?.status === 'active') {
      console.log('Game is now active, navigating to game...');
      toast({
        title: "Game Started!",
        description: "Let the chaos begin!",
      });
      navigate(`/game/${gameId}`);
    }
  }, [currentGame?.status, gameId, navigate, toast]);

  // Initialize form values when game data loads
  useEffect(() => {
    if (currentGame) {
      setMaxPlayers(currentGame.max_players);
      setMaxRounds(currentGame.max_rounds);
      setIsPrivate(currentGame.is_private);
    }
  }, [currentGame]);

  const isHost = currentGame?.host_id === user?.id;
  // Host can start if there are at least 2 players and all NON-HOST players are ready
  const nonHostPlayers = currentGame?.players.filter(p => !p.is_host) || [];
  const canStart = currentGame?.players.length >= 2 && nonHostPlayers.every(p => p.is_ready);

  const updateGameSettings = async () => {
    if (!gameId || !isHost) return;

    try {
      console.log('Updating game settings...', { maxPlayers, maxRounds, isPrivate });
      
      const { error } = await supabase
        .from('games')
        .update({
          max_players: maxPlayers,
          max_rounds: maxRounds,
          is_private: isPrivate
        })
        .eq('id', gameId);

      if (error) throw error;

      toast({
        title: "Settings Updated",
        description: "Game settings have been saved",
      });
    } catch (error) {
      console.error('Error updating game settings:', error);
      toast({
        title: "Error",
        description: "Failed to update game settings",
        variant: "destructive",
      });
    }
  };

  const toggleReady = async () => {
    if (!gameId || !user) return;

    try {
      const currentPlayer = currentGame?.players.find(p => p.id === user.id);
      const newReadyState = !currentPlayer?.is_ready;

      console.log('Toggling ready state for player:', user.id, 'to:', newReadyState);

      const { error } = await supabase
        .from('game_players')
        .update({ is_ready: newReadyState })
        .eq('game_id', gameId)
        .eq('player_id', user.id);

      if (error) throw error;

      toast({
        title: newReadyState ? "Ready!" : "Not Ready",
        description: newReadyState ? "You are ready to start" : "You are not ready yet",
      });
    } catch (error) {
      console.error('Error toggling ready state:', error);
      toast({
        title: "Error",
        description: "Failed to update ready state",
        variant: "destructive",
      });
    }
  };

  const startGame = async () => {
    if (!gameId || !isHost || !canStart) return;

    setIsStarting(true);
    try {
      console.log('Starting game with players:', currentGame.players);
      
      // Clear all player scorecards for fresh game
      const playerIds = currentGame.players.map(p => p.id);
      await Promise.all(
        playerIds.map(playerId => 
          supabase
            .from('game_players')
            .update({ scorecard: {} })
            .eq('game_id', gameId)
            .eq('player_id', playerId)
        )
      );

      // Assign proper turn orders starting from 0
      const shuffledPlayers = [...currentGame.players].sort(() => Math.random() - 0.5);

      console.log('Assigning turn orders:', shuffledPlayers.map((p, i) => ({ player: p.username, order: i })));

      // Update each player's turn order
      for (let i = 0; i < shuffledPlayers.length; i++) {
        const { error: playerError } = await supabase
          .from('game_players')
          .update({ turn_order: i })
          .eq('game_id', gameId)
          .eq('player_id', shuffledPlayers[i].id);

        if (playerError) {
          console.error('Error updating player turn order:', playerError);
          throw playerError;
        }
      }

      // Start the game
      const { error } = await supabase
        .from('games')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
          current_player_turn: 0,
          current_round: 1,
          turn_start_time: new Date().toISOString()
        })
        .eq('id', gameId);

      if (error) throw error;

      console.log('Game started successfully!');
      
      // Success message and navigation handled by useEffect above
    } catch (error) {
      console.error('Error starting game:', error);
      toast({
        title: "Error",
        description: "Failed to start game. Please try again.",
        variant: "destructive",
      });
      setIsStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <ChaoticBackground />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-white text-xl font-quicksand relative z-10"
        >
          <Sparkles className="h-8 w-8" />
        </motion.div>
      </div>
    );
  }

  if (!currentGame) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <ChaoticBackground />
        <div className="text-white text-xl font-quicksand relative z-10">Game not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-quicksand relative overflow-hidden">
      <ChaoticBackground />
      
      <div className="relative z-10 p-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-black/60 border-purple-400/60 backdrop-blur-md shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white font-bangers text-2xl flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Gamepad2 className="text-purple-400 h-6 w-6" />
                </motion.div>
                {currentGame.name}
              </CardTitle>
              <CardDescription className="text-purple-200 font-quicksand">
                Game Setup & Player Lobby
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Game Settings */}
          {isHost && (
            <Card className="bg-black/60 border-blue-400/60 backdrop-blur-md shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white font-bangers flex items-center gap-2">
                  <Settings className="text-blue-400 h-5 w-5" />
                  Game Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxPlayers" className="text-white font-quicksand">
                    Max Players
                  </Label>
                  <Input
                    id="maxPlayers"
                    type="number"
                    min="2"
                    max="8"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                    onBlur={updateGameSettings}
                    className="bg-blue-900/30 border-blue-500/40 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxRounds" className="text-white font-quicksand">
                    Max Rounds
                  </Label>
                  <Input
                    id="maxRounds"
                    type="number"
                    min="5"
                    max="15"
                    value={maxRounds}
                    onChange={(e) => setMaxRounds(parseInt(e.target.value))}
                    onBlur={updateGameSettings}
                    className="bg-blue-900/30 border-blue-500/40 text-white"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="private"
                    checked={isPrivate}
                    onCheckedChange={(checked) => {
                      setIsPrivate(checked);
                      updateGameSettings();
                    }}
                  />
                  <Label htmlFor="private" className="text-white font-quicksand">
                    Private Game
                  </Label>
                </div>

                {/* Room Invite Component */}
                <RoomInvite 
                  gameId={gameId || ''} 
                  roomCode={currentGame.game_code} 
                  isHost={isHost} 
                />
              </CardContent>
            </Card>
          )}

          {/* Players */}
          <Card className="bg-black/60 border-green-400/60 backdrop-blur-md shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white font-bangers flex items-center gap-2">
                <Users className="text-green-400 h-5 w-5" />
                Players ({currentGame.players.length}/{maxPlayers})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AnimatePresence>
                {currentGame.players.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-green-600/20 border border-green-500/40 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center font-bangers text-sm text-black">
                        {player.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="text-white font-quicksand font-medium flex items-center gap-2">
                          {player.username || 'Unknown Player'}
                          {player.is_host && (
                            <Crown className="h-4 w-4 text-yellow-400" />
                          )}
                          {player.id === user?.id && ' (You)'}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      className={`${
                        player.is_host 
                          ? 'bg-yellow-600 text-white' 
                          : player.is_ready 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-600 text-gray-300'
                      } border-0`}
                    >
                      {player.is_host ? 'Host (Ready)' : player.is_ready ? 'Ready' : 'Not Ready'}
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4 justify-center">
          {!isHost && (
            <Button
              onClick={toggleReady}
              className={`font-bangers text-lg px-8 py-4 rounded-xl shadow-lg border-2 ${
                currentGame.players.find(p => p.id === user?.id)?.is_ready
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-red-400/50'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-green-400/50'
              }`}
            >
              {currentGame.players.find(p => p.id === user?.id)?.is_ready ? 'Not Ready' : 'Ready Up!'}
            </Button>
          )}

          {isHost && (
            <Button
              onClick={startGame}
              disabled={!canStart || isStarting}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 font-bangers text-lg px-8 py-4 rounded-xl shadow-lg border-2 border-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="mr-2 h-5 w-5" />
              {isStarting ? 'Starting Game...' : 'Start Game!'}
            </Button>
          )}
        </div>

        {!canStart && isHost && (
          <div className="mt-4 text-center">
            <p className="text-yellow-300 font-quicksand">
              {currentGame.players.length < 2 
                ? 'Need at least 2 players to start' 
                : nonHostPlayers.length > 0 && !nonHostPlayers.every(p => p.is_ready)
                  ? 'All non-host players must be ready to start'
                  : 'Ready to start!'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameSetup;
