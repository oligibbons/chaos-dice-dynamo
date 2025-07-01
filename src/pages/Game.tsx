import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Users, Clock, Trophy, LogOut, Crown, Zap, Gamepad2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSoundManager } from "@/components/SoundManager";
import ChaoticBackground from "@/components/ChaoticBackground";
import GameTimer from "@/components/GameTimer";
import ChaosEventDisplay from "@/components/ChaosEventDisplay";
import GameNotification from "@/components/GameNotification";
import PlayerEmotes from "@/components/PlayerEmotes";

interface ChaosEvent {
  id: string;
  name: string;
  description: string;
  effect: any;
  rarity: 'common' | 'rare' | 'legendary';
  trigger_condition: string;
}

interface GameState {
  id: string;
  name: string;
  status: string;
  current_round: number;
  max_rounds: number;
  current_player_turn: number;
  chaos_events: ChaosEvent[];
  host_id: string;
  current_players: number;
  max_players: number;
  turn_start_time: string | null;
}

interface Player {
  id: string;
  username: string;
  score: number;
  turn_order: number;
  scorecard: any;
}

const Game = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const soundManager = useSoundManager();
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [dice, setDice] = useState<number[]>([1, 2, 3, 4, 5]);
  const [rerollCount, setRerollCount] = useState(0);
  const [selectedDice, setSelectedDice] = useState<boolean[]>([false, false, false, false, false]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [currentPlayerUsername, setCurrentPlayerUsername] = useState<string>('');

  useEffect(() => {
    if (gameId && user) {
      fetchGameData();
      fetchPlayers();
      
      // Subscribe to real-time updates
      const gameChannel = supabase
        .channel(`game-${gameId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        }, (payload) => {
          const newGameState = payload.new as GameState;
          // Properly type the chaos_events field
          if (newGameState.chaos_events && Array.isArray(newGameState.chaos_events)) {
            newGameState.chaos_events = newGameState.chaos_events.map((event: any) => ({
              id: event.id || '',
              name: event.name || '',
              description: event.description || '',
              effect: event.effect || {},
              rarity: event.rarity || 'common',
              trigger_condition: event.trigger_condition || 'turn_start'
            } as ChaosEvent));
          } else {
            newGameState.chaos_events = [];
          }
          setGameState(newGameState);
          checkIfMyTurn(newGameState);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(gameChannel);
      };
    }
  }, [gameId, user]);

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
        // Properly handle chaos_events JSON field
        const chaosEvents: ChaosEvent[] = Array.isArray(game.chaos_events) 
          ? game.chaos_events.map((event: any) => ({
              id: event.id || '',
              name: event.name || '',
              description: event.description || '',
              effect: event.effect || {},
              rarity: event.rarity || 'common',
              trigger_condition: event.trigger_condition || 'turn_start'
            }))
          : [];

        const gameState: GameState = {
          ...game,
          chaos_events: chaosEvents
        };
        
        setGameState(gameState);
        checkIfMyTurn(gameState);
      }
    } catch (error) {
      console.error('Error fetching game:', error);
      toast({
        title: "Error",
        description: "Failed to load game data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
        .order('turn_order');

      if (error) throw error;
      
      if (gamePlayers) {
        const playersData = gamePlayers.map(gp => ({
          id: gp.player_id,
          username: (gp.profiles as any)?.username || 'Unknown',
          score: gp.score || 0,
          turn_order: gp.turn_order,
          scorecard: gp.scorecard || {}
        }));
        
        setPlayers(playersData);
        
        // Set current player username
        if (gameState && playersData[gameState.current_player_turn]) {
          setCurrentPlayerUsername(playersData[gameState.current_player_turn].username);
        }
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const checkIfMyTurn = (game: GameState) => {
    if (!user || !players.length) return;
    
    const currentPlayer = players[game.current_player_turn];
    setIsMyTurn(currentPlayer?.id === user.id);
    
    if (currentPlayer) {
      setCurrentPlayerUsername(currentPlayer.username);
    }
  };

  const rollDice = () => {
    const newDice = dice.map((die, index) => 
      selectedDice[index] ? die : Math.floor(Math.random() * 6) + 1
    );
    setDice(newDice);
    setRerollCount(prev => prev + 1);
    soundManager.play('roll');
  };

  const toggleDiceSelection = (index: number) => {
    if (rerollCount === 0) return; // Can't select dice before first roll
    
    const newSelected = [...selectedDice];
    newSelected[index] = !newSelected[index];
    setSelectedDice(newSelected);
  };

  const leaveGame = async () => {
    try {
      // Remove player from game
      await supabase
        .from('game_players')
        .delete()
        .eq('game_id', gameId)
        .eq('player_id', user?.id);

      // Update game player count
      if (gameState) {
        await supabase
          .from('games')
          .update({ current_players: gameState.current_players - 1 })
          .eq('id', gameId);
      }

      navigate('/lobby');
      toast({
        title: "Left Game",
        description: "You have left the game",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to leave game",
        variant: "destructive",
      });
    }
  };

  const handleTimeUp = () => {
    if (isMyTurn) {
      // Auto-skip turn when time is up
      toast({
        title: "Time's Up!",
        description: "Your turn has been skipped",
        variant: "destructive",
      });
      // Here you would implement the auto-skip logic
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <ChaoticBackground />
        <div className="text-white text-xl font-quicksand relative z-10">Loading game...</div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <ChaoticBackground />
        <div className="text-white text-xl font-quicksand relative z-10">Game not found</div>
      </div>
    );
  }

  const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

  return (
    <div className="min-h-screen font-quicksand relative overflow-hidden p-4">
      <ChaoticBackground />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Game Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white font-bangers text-2xl flex items-center gap-2">
                    <Gamepad2 className="text-purple-400" />
                    {gameState.name}
                  </CardTitle>
                  <CardDescription className="text-purple-200 font-quicksand">
                    Round {gameState.current_round} of {gameState.max_rounds} • {players.length} players
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-600 text-white font-quicksand">
                    {gameState.status}
                  </Badge>
                  <Button
                    onClick={leaveGame}
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 text-red-300 hover:bg-red-800/50 font-quicksand"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Game Board */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Turn & Timer */}
            <Card className="bg-black/40 border-yellow-500/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bangers text-white">
                      {isMyTurn ? "Your Turn!" : `${currentPlayerUsername}'s Turn`}
                    </h3>
                    <p className="text-yellow-200 font-quicksand">
                      {isMyTurn ? "Roll the dice and score!" : "Waiting for player..."}
                    </p>
                  </div>
                  <GameTimer
                    isActive={gameState.status === 'active'}
                    onTimeUp={handleTimeUp}
                    startTime={gameState.turn_start_time}
                  />
                </div>
                
                {isMyTurn && (
                  <div className="space-y-4">
                    <div className="text-white font-quicksand">
                      Rerolls: {rerollCount}/3
                    </div>
                    <Progress value={(rerollCount / 3) * 100} className="w-full" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dice Display */}
            <Card className="bg-black/40 border-green-500/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-bangers text-white mb-4">Dice</h3>
                <div className="flex justify-center gap-4 mb-6">
                  {dice.map((value, index) => {
                    const DiceIcon = diceIcons[value - 1];
                    return (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleDiceSelection(index)}
                        className={`
                          w-16 h-16 rounded-lg border-2 cursor-pointer flex items-center justify-center
                          ${selectedDice[index] 
                            ? 'border-yellow-400 bg-yellow-400/20' 
                            : 'border-green-400/50 bg-green-400/10'
                          }
                          ${!isMyTurn ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <DiceIcon className={`h-8 w-8 ${selectedDice[index] ? 'text-yellow-300' : 'text-green-300'}`} />
                      </motion.div>
                    );
                  })}
                </div>
                
                {isMyTurn && rerollCount < 3 && (
                  <div className="text-center">
                    <Button
                      onClick={rollDice}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-bangers text-lg px-8 py-3"
                    >
                      {rerollCount === 0 ? 'Roll Dice!' : 'Reroll Selected'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Player Emotes */}
            <PlayerEmotes gameId={gameId!} />
          </div>

          {/* Right Column - Game Info */}
          <div className="space-y-6">
            {/* Players */}
            <Card className="bg-black/40 border-blue-500/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white font-bangers flex items-center gap-2">
                  <Users className="text-blue-400" />
                  Players
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {players.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
                      flex items-center justify-between p-3 rounded-lg
                      ${gameState.current_player_turn === index 
                        ? 'bg-yellow-600/20 border border-yellow-500/50' 
                        : 'bg-blue-600/10 border border-blue-500/30'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bangers text-sm
                        ${gameState.current_player_turn === index 
                          ? 'bg-yellow-500 text-black' 
                          : 'bg-blue-500 text-white'
                        }
                      `}>
                        {player.username[0]?.toUpperCase()}
                      </div>
                      <span className="text-white font-quicksand font-medium">
                        {player.username}
                        {player.id === user?.id && ' (You)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-400" />
                      <span className="text-white font-bangers">{player.score}</span>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Chaos Events */}
            <ChaosEventDisplay events={gameState.chaos_events} />
          </div>
        </div>
      </div>

      {/* Game Notifications */}
      <AnimatePresence>
        {notification && (
          <GameNotification
            message={notification}
            onClose={() => setNotification(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Game;
