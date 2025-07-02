import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Users, Clock, Trophy, LogOut, Crown, Zap, Gamepad2, Sparkles, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSoundManager } from "@/components/SoundManager";
import { useChaosEventHandler } from "@/hooks/useChaosEventHandler";
import ChaoticBackground from "@/components/ChaoticBackground";
import GameTimer from "@/components/GameTimer";
import ChaosEventDisplay from "@/components/ChaosEventDisplay";
import GameNotification from "@/components/GameNotification";
import PlayerEmotes from "@/components/PlayerEmotes";
import Dice3D from "@/components/Dice3D";
import ChaosEvents from "@/components/ChaosEvents";

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
  const [notification, setNotification] = useState<{
    id: string;
    type: 'score' | 'chaos' | 'win' | 'turn' | 'achievement';
    title: string;
    message: string;
    points?: number;
    player?: string;
  } | null>(null);
  const [currentPlayerUsername, setCurrentPlayerUsername] = useState<string>('');
  const [isRolling, setIsRolling] = useState(false);
  const [wildNumberSelection, setWildNumberSelection] = useState<number | null>(null);
  const [showWildNumberDialog, setShowWildNumberDialog] = useState(false);

  // Initialize chaos event handler
  const chaosHandler = useChaosEventHandler(gameId || '', user?.id || '');

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
    if (!isMyTurn) return;
    
    setIsRolling(true);
    
    // Use chaos-modified dice rolling
    const newDice = chaosHandler.rollWithChaosModifications(5);
    
    // Apply selection logic for rerolls
    const finalDice = rerollCount > 0 ? 
      dice.map((die, index) => selectedDice[index] ? die : newDice[index]) : 
      newDice;
    
    // Simulate rolling animation
    setTimeout(() => {
      const modifiedDice = chaosHandler.modifyDiceRoll(finalDice);
      setDice(modifiedDice);
      setRerollCount(prev => prev + 1);
      setIsRolling(false);
      soundManager.play('roll');
      
      // Store last die for Time Warp Token effect
      if (modifiedDice.length > 0) {
        chaosHandler.setPreviousPlayerDie(modifiedDice[modifiedDice.length - 1]);
      }
    }, 1000);
  };

  const toggleDiceSelection = (index: number) => {
    if (rerollCount === 0 || isRolling) return; // Can't select dice before first roll or while rolling
    
    const newSelected = [...selectedDice];
    newSelected[index] = !newSelected[index];
    setSelectedDice(newSelected);
  };

  const handleChaosEventTriggered = (event: ChaosEvent) => {
    chaosHandler.applyChaosEvent(event);
    
    // Handle special chaos events that need immediate action
    if (event.effect.type === 'wild_number') {
      setShowWildNumberDialog(true);
    }
    
    setNotification({
      id: `chaos-${Date.now()}`,
      type: 'chaos',
      title: '🌀 CHAOS EVENT!',
      message: event.name,
    });
  };

  const selectWildNumber = (number: number) => {
    setWildNumberSelection(number);
    chaosHandler.setWildNumber(number);
    setShowWildNumberDialog(false);
    toast({
      title: "Wild Number Selected!",
      description: `You chose ${number} as your wild number. Remember: -5 points penalty!`,
    });
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

  const handleEmote = (emote: string) => {
    console.log('Emote sent:', emote);
    // TODO: Implement emote sending to other players
  };

  if (isLoading) {
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

  if (!gameState) {
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
      
      {/* Wild Number Selection Dialog */}
      {showWildNumberDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-purple-900/90 border-purple-400 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white font-bangers text-center">
                🎲 NUMERICAL ANARCHY! 🎲
              </CardTitle>
              <CardDescription className="text-purple-200 text-center">
                Choose your wild number (1-6). Remember: -5 points penalty!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <Button
                    key={num}
                    onClick={() => selectWildNumber(num)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bangers text-lg"
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className="relative z-10 p-2 sm:p-4 max-w-7xl mx-auto">
        {/* Mobile-optimized Game Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Card className="bg-black/60 border-purple-400/60 backdrop-blur-md shadow-2xl">
            <CardHeader className="pb-3 px-3 sm:px-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-white font-bangers text-xl sm:text-2xl flex items-center gap-2 truncate">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <Gamepad2 className="text-purple-400 h-5 w-5 sm:h-6 sm:w-6" />
                    </motion.div>
                    <span className="truncate">{gameState.name}</span>
                  </CardTitle>
                  <CardDescription className="text-purple-200 font-quicksand text-sm">
                    Round {gameState.current_round} of {gameState.max_rounds} • {players.length} players
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-quicksand border-0 shadow-lg">
                    {gameState.status}
                  </Badge>
                  <Button
                    onClick={leaveGame}
                    variant="outline"
                    size="sm"
                    className="border-red-400/60 text-red-300 hover:bg-red-800/50 font-quicksand backdrop-blur-sm"
                  >
                    <LogOut className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Leave</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Main Game Area - Takes most space on large screens */}
          <div className="lg:col-span-8 space-y-4">
            {/* Current Turn & Timer */}
            <Card className="bg-black/60 border-yellow-400/60 backdrop-blur-md shadow-2xl overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <motion.h3 
                      animate={isMyTurn ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-xl sm:text-2xl font-bangers text-white mb-2"
                    >
                      {isMyTurn ? (
                        <span className="text-yellow-300 drop-shadow-lg">🎲 Your Turn! 🎲</span>
                      ) : (
                        <span>{currentPlayerUsername}'s Turn</span>
                      )}
                    </motion.h3>
                    <p className="text-yellow-200 font-quicksand text-sm sm:text-base">
                      {isMyTurn ? "Roll the dice and make your mark!" : "Waiting for player..."}
                    </p>
                    
                    {isMyTurn && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-4">
                          <span className="text-white font-quicksand text-sm">
                            Rerolls: {rerollCount}/3
                          </span>
                          <PlayerEmotes onEmote={handleEmote} disabled={!isMyTurn} />
                          {wildNumberSelection && (
                            <Badge className="bg-purple-600 text-white">
                              Wild: {wildNumberSelection}
                            </Badge>
                          )}
                        </div>
                        <Progress value={(rerollCount / 3) * 100} className="w-full h-2" />
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <GameTimer
                      isActive={gameState.status === 'active' && isMyTurn}
                      onTimeUp={handleTimeUp}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dice Display - The Star of the Show */}
            <Card className="bg-gradient-to-br from-black/70 to-purple-900/30 border-2 border-pink-400/60 backdrop-blur-md shadow-2xl">
              <CardContent className="p-6">
                <motion.h3 
                  className="text-2xl sm:text-3xl font-bangers text-white mb-6 text-center"
                  animate={{ 
                    textShadow: [
                      "0 0 10px #ff0080",
                      "0 0 20px #8000ff",
                      "0 0 30px #00ff80",
                      "0 0 20px #8000ff",
                      "0 0 10px #ff0080"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  ✨ CHAOTIC DICE ✨
                </motion.h3>
                
                <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-8">
                  {dice.map((value, index) => (
                    <motion.div
                      key={index}
                      whileHover={!isRolling && isMyTurn ? { scale: 1.1, rotate: 5 } : {}}
                      whileTap={!isRolling && isMyTurn ? { scale: 0.95 } : {}}
                      className="relative"
                    >
                      <Dice3D
                        value={value}
                        isRolling={isRolling}
                        isSelected={selectedDice[index]}
                        onClick={() => toggleDiceSelection(index)}
                        size="lg"
                      />
                      {selectedDice[index] && !isRolling && (
                        <motion.div
                          className="absolute -top-2 -right-2"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Star className="h-4 w-4 text-yellow-400" />
                        </motion.div>
                      )}
                      {chaosHandler.chaosState.activeDiceModifications.binaryDice?.index === index && (
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-red-600 text-white text-xs">Binary!</Badge>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
                
                {/* Chaos Status Indicators */}
                {(chaosHandler.chaosState.activeDiceModifications.minValue !== undefined || 
                  chaosHandler.chaosState.activeDiceModifications.maxValue !== undefined) && (
                  <div className="text-center mb-4">
                    <Badge className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
                      Dice Range: {chaosHandler.chaosState.activeDiceModifications.minValue}-{chaosHandler.chaosState.activeDiceModifications.maxValue}
                    </Badge>
                  </div>
                )}
                
                {isMyTurn && rerollCount < 3 && (
                  <div className="text-center">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={rollDice}
                        disabled={isRolling}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-bangers text-lg px-8 py-4 rounded-xl shadow-lg border-2 border-green-400/50"
                      >
                        {isRolling ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                            className="flex items-center gap-2"
                          >
                            <Sparkles className="h-5 w-5" />
                            Rolling...
                          </motion.div>
                        ) : (
                          rerollCount === 0 ? '🎲 ROLL DICE! 🎲' : '🔄 REROLL SELECTED'
                        )}
                      </Button>
                    </motion.div>
                    
                    {rerollCount > 0 && (
                      <p className="text-purple-200 font-quicksand mt-2 text-sm">
                        Click dice to select/deselect before rerolling
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Game Info */}
          <div className="lg:col-span-4 space-y-4">
            {/* Players */}
            <Card className="bg-black/60 border-blue-400/60 backdrop-blur-md shadow-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white font-bangers flex items-center gap-2 text-lg">
                  <Users className="text-blue-400 h-5 w-5" />
                  Players
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {players.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
                      flex items-center justify-between p-3 rounded-lg transition-all
                      ${gameState.current_player_turn === index 
                        ? 'bg-gradient-to-r from-yellow-600/30 to-orange-600/30 border border-yellow-500/60 shadow-lg' 
                        : 'bg-blue-600/20 border border-blue-500/40'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-bangers text-sm
                          ${gameState.current_player_turn === index 
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-lg' 
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                          }
                        `}
                        animate={gameState.current_player_turn === index ? { 
                          boxShadow: [
                            "0 0 0 0 rgba(255, 193, 7, 0.7)",
                            "0 0 0 10px rgba(255, 193, 7, 0)",
                          ]
                        } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {player.username[0]?.toUpperCase()}
                      </motion.div>
                      <span className="text-white font-quicksand font-medium text-sm">
                        {player.username}
                        {player.id === user?.id && ' (You)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-400" />
                      <span className="text-white font-bangers text-sm">{player.score}</span>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Chaos Events */}
            <ChaosEvents 
              gameId={gameId || ''} 
              currentTurn={gameState.current_round}
              onChaosTriggered={handleChaosEventTriggered}
            />
          </div>
        </div>
      </div>

      {/* Game Notifications */}
      <AnimatePresence>
        {notification && (
          <GameNotification
            notification={notification}
            onClose={() => setNotification(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Game;
