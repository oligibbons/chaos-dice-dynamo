import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, Crown, Timer, Users, RotateCcw, Trophy, Sparkles, AlertTriangle, LogOut } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Dice3D from "@/components/Dice3D";
import ChaosEvents from "@/components/ChaosEvents";
import GameOver from "@/components/GameOver";
import GameTimer from "@/components/GameTimer";
import GameNotification from "@/components/GameNotification";
import PlayerEmotes from "@/components/PlayerEmotes";
import RoomInvite from "@/components/RoomInvite";
import ChaoticBackground from "@/components/ChaoticBackground";
import { useSoundManager } from "@/components/SoundManager";

interface GameState {
  id: string;
  name: string;
  current_round: number;
  max_rounds: number;
  status: string;
  chaos_events: any[];
  players: any[];
  current_player_turn: number;
  host_id: string;
}

interface GameNotificationData {
  id: string;
  type: 'score' | 'chaos' | 'win' | 'turn' | 'achievement';
  title: string;
  message: string;
  points?: number;
  player?: string;
}

interface ChaosEvent {
  id: string;
  name: string;
  description: string;
  effect: any;
  rarity: 'common' | 'rare' | 'legendary';
}

const Game = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const soundManager = useSoundManager();
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentDice, setCurrentDice] = useState([1, 2, 3, 4, 5]);
  const [selectedDice, setSelectedDice] = useState<boolean[]>([false, false, false, false, false]);
  const [isRolling, setIsRolling] = useState(false);
  const [rollsLeft, setRollsLeft] = useState(3);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [playerScorecard, setPlayerScorecard] = useState<Record<string, number>>({});
  const [gameFinished, setGameFinished] = useState(false);
  const [finalScores, setFinalScores] = useState<any[]>([]);
  const [notification, setNotification] = useState<GameNotificationData | null>(null);
  const [turnStartTime, setTurnStartTime] = useState<Date | null>(null);
  const [activeChaosEvents, setActiveChaosEvents] = useState<ChaosEvent[]>([]);

  const WIN_SCORE = 150;
  const MAX_TURNS = 5;

  const showNotification = useCallback((notif: Omit<GameNotificationData, 'id'>) => {
    const id = Date.now().toString();
    setNotification({ ...notif, id });
    
    // Auto-close after 4 seconds for better visibility
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);

  useEffect(() => {
    if (!gameId || !user) {
      navigate('/lobby');
      return;
    }

    fetchGameState();
    fetchPlayerScorecard();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('game-updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'games',
          filter: `id=eq.${gameId}`
        }, 
        () => {
          fetchGameState();
          soundManager.play('notification', 0.2);
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `game_id=eq.${gameId}`
        },
        () => fetchGameState()
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_scorecards',
          filter: `game_id=eq.${gameId}`
        },
        () => {
          fetchPlayerScorecard();
          soundManager.play('score', 0.3);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, navigate, user]);

  const fetchGameState = async () => {
    if (!gameId) return;

    try {
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError) {
        toast({
          title: "Error",
          description: "Failed to fetch game state",
          variant: "destructive",
        });
        return;
      }

      const { data: gamePlayers, error: playersError } = await supabase
        .from('game_players')
        .select('*')
        .eq('game_id', gameId)
        .order('turn_order');

      if (playersError) {
        console.error('Error fetching game players:', playersError);
        return;
      }

      const playerIds = gamePlayers?.map(p => p.player_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', playerIds);

      const playersWithUsernames = gamePlayers?.map(player => ({
        ...player,
        username: profiles?.find(p => p.id === player.player_id)?.username || 'Unknown'
      })) || [];

      // Check win condition
      const totalScore = Object.values(playerScorecard).reduce((sum, score) => sum + score, 0);
      if (totalScore >= WIN_SCORE && game.status !== 'finished') {
        await finishGameWithWinner();
        showNotification({
          type: 'win',
          title: '🏆 VICTORY! 🏆',
          message: `You reached ${WIN_SCORE} points and conquered the chaos!`,
          points: totalScore
        });
        return;
      }

      // Check if game should be finished (5 turns completed)
      if (game.current_round > MAX_TURNS && game.status !== 'finished') {
        await finishGame();
        return;
      }

      const chaosEvents = Array.isArray(game.chaos_events) ? game.chaos_events : [];
      setActiveChaosEvents(chaosEvents.slice(-4)); // Show last 4 active events

      const newGameState = {
        id: game.id,
        name: game.name,
        current_round: game.current_round || 1,
        max_rounds: MAX_TURNS,
        status: game.status || 'waiting',
        chaos_events: chaosEvents,
        players: playersWithUsernames,
        current_player_turn: game.current_player_turn || 0,
        host_id: game.host_id
      };

      setGameState(newGameState);

      // Check if it's the current user's turn
      const currentPlayer = playersWithUsernames[game.current_player_turn || 0];
      const newIsMyTurn = currentPlayer?.player_id === user?.id;
      
      if (newIsMyTurn && !isMyTurn) {
        setTurnStartTime(new Date());
        showNotification({
          type: 'turn',
          title: '🎲 YOUR TURN! 🎲',
          message: 'Time to roll the dice and embrace the chaos!'
        });
        soundManager.play('notification', 0.4);
      }
      
      setIsMyTurn(newIsMyTurn);

      // Check if game is finished
      if (game.status === 'finished') {
        await calculateFinalScores(playersWithUsernames);
      }

    } catch (error) {
      console.error('Error in fetchGameState:', error);
      toast({
        title: "Error",
        description: "Failed to load game",
        variant: "destructive",
      });
    }
  };

  const applyChaosEffects = (dice: number[], category: string) => {
    let modifiedDice = [...dice];
    let multiplier = 1;
    
    activeChaosEvents.forEach(event => {
      const effect = event.effect;
      
      switch (effect.type) {
        case 'wild_fours':
          // All 4s count as wild cards
          modifiedDice = modifiedDice.map(die => die === 4 ? (category.includes('straight') ? die : 6) : die);
          break;
        case 'double_threes':
          // Double the count of 3s
          if (category === 'threes') {
            multiplier *= 2;
          }
          break;
        case 'flipped_fives':
          // All 5s count as 2s
          modifiedDice = modifiedDice.map(die => die === 5 ? 2 : die);
          break;
        case 'score_multiplier':
          multiplier *= effect.value || 1;
          break;
        case 'bonus_straight':
          if (category.includes('straight')) {
            multiplier += 0.67; // +20 points bonus
          }
          break;
        case 'chaos_jackpot':
          if (category === 'chaos') {
            multiplier += 1.33; // +100 points bonus
          }
          break;
      }
    });
    
    return { modifiedDice, multiplier };
  };

  const calculateScore = (category: string) => {
    const { modifiedDice, multiplier } = applyChaosEffects(currentDice, category);
    const counts = modifiedDice.reduce((acc, die) => {
      acc[die] = (acc[die] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const sum = modifiedDice.reduce((a, b) => a + b, 0);
    const sortedDice = [...modifiedDice].sort();

    let baseScore = 0;
    switch (category) {
      case 'ones': baseScore = (counts[1] || 0) * 1; break;
      case 'twos': baseScore = (counts[2] || 0) * 2; break;
      case 'threes': baseScore = (counts[3] || 0) * 3; break;
      case 'fours': baseScore = (counts[4] || 0) * 4; break;
      case 'fives': baseScore = (counts[5] || 0) * 5; break;
      case 'sixes': baseScore = (counts[6] || 0) * 6; break;
      case 'threeOfKind': 
        baseScore = Object.values(counts).some(count => count >= 3) ? sum : 0; break;
      case 'fourOfKind': 
        baseScore = Object.values(counts).some(count => count >= 4) ? sum : 0; break;
      case 'fullHouse': 
        baseScore = Object.values(counts).includes(3) && Object.values(counts).includes(2) ? 25 : 0; break;
      case 'smallStraight': 
        baseScore = [1,2,3,4].every(n => sortedDice.includes(n)) || 
               [2,3,4,5].every(n => sortedDice.includes(n)) || 
               [3,4,5,6].every(n => sortedDice.includes(n)) ? 30 : 0; break;
      case 'largeStraight': 
        baseScore = [1,2,3,4,5].every(n => sortedDice.includes(n)) || 
               [2,3,4,5,6].every(n => sortedDice.includes(n)) ? 40 : 0; break;
      case 'chaos': 
        baseScore = Object.values(counts).some(count => count === 5) ? 75 : 0; break;
      case 'chance': 
        baseScore = sum; break;
      default: 
        baseScore = 0;
    }
    
    return Math.floor(baseScore * multiplier);
  };

  const finishGame = async () => {
    try {
      await supabase
        .from('games')
        .update({ 
          status: 'finished',
          finished_at: new Date().toISOString()
        })
        .eq('id', gameId);

      toast({
        title: "Game Finished!",
        description: "Calculating final scores...",
      });
      
      soundManager.play('win', 0.5);
    } catch (error) {
      console.error('Error finishing game:', error);
    }
  };

  const finishGameWithWinner = async () => {
    try {
      await supabase
        .from('games')
        .update({ 
          status: 'finished',
          finished_at: new Date().toISOString()
        })
        .eq('id', gameId);

      soundManager.play('win', 0.7);
    } catch (error) {
      console.error('Error finishing game with winner:', error);
    }
  };

  const calculateFinalScores = async (players: any[]) => {
    try {
      const scoresPromises = players.map(async (player) => {
        const { data: scorecard } = await supabase
          .from('game_scorecards')
          .select('score')
          .eq('game_id', gameId)
          .eq('player_id', player.player_id);

        const totalScore = scorecard?.reduce((sum, item) => sum + item.score, 0) || 0;

        return {
          ...player,
          total_score: totalScore
        };
      });

      const finalResults = await Promise.all(scoresPromises);
      setFinalScores(finalResults);
      setGameFinished(true);
    } catch (error) {
      console.error('Error calculating final scores:', error);
    }
  };

  const fetchPlayerScorecard = async () => {
    if (!gameId || !user) return;

    try {
      const { data: scorecard } = await supabase
        .from('game_scorecards')
        .select('category, score')
        .eq('game_id', gameId)
        .eq('player_id', user.id);

      const scorecardMap = scorecard?.reduce((acc, item) => {
        acc[item.category] = item.score;
        return acc;
      }, {} as Record<string, number>) || {};

      setPlayerScorecard(scorecardMap);
    } catch (error) {
      console.error('Error fetching scorecard:', error);
    }
  };

  const startGame = async () => {
    if (!gameState || gameState.host_id !== user?.id) return;

    try {
      await supabase
        .from('games')
        .update({ 
          status: 'active',
          started_at: new Date().toISOString(),
          current_player_turn: 0,
          current_round: 1
        })
        .eq('id', gameId);

      showNotification({
        type: 'achievement',
        title: '🌪️ CHAOS UNLEASHED! 🌪️',
        message: 'Let the madness begin!'
      });
      
      soundManager.play('chaos', 0.4);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to start game",
        variant: "destructive",
      });
    }
  };

  const rollDice = () => {
    if (rollsLeft <= 0 || isRolling || !isMyTurn) return;
    
    setIsRolling(true);
    setRollsLeft(prev => prev - 1);
    soundManager.play('roll', 0.4);

    // Animate dice rolling with multiple intermediate values
    const rollDuration = 1200;
    const rollInterval = 120;
    const rollSteps = rollDuration / rollInterval;
    
    let step = 0;
    const rollTimer = setInterval(() => {
      step++;
      setCurrentDice(dice => dice.map((_, index) => 
        selectedDice[index] ? dice[index] : Math.floor(Math.random() * 6) + 1
      ));

      if (step >= rollSteps) {
        clearInterval(rollTimer);
        setIsRolling(false);
        
        // Final roll with dramatic effect
        setTimeout(() => {
          setCurrentDice(dice => dice.map((_, index) => 
            selectedDice[index] ? dice[index] : Math.floor(Math.random() * 6) + 1
          ));
        }, 100);
      }
    }, rollInterval);
  };

  const toggleDiceSelection = (index: number) => {
    if (rollsLeft === 3 || !isMyTurn) return;
    
    setSelectedDice(prev => {
      const newSelected = [...prev];
      newSelected[index] = !newSelected[index];
      return newSelected;
    });
  };

  const scoreCategory = async (category: string) => {
    if (!gameState || !user || !isMyTurn || playerScorecard[category] !== undefined) return;

    const score = calculateScore(category);

    try {
      // Save the score
      await supabase
        .from('game_scorecards')
        .insert({
          game_id: gameId!,
          player_id: user.id,
          category,
          score,
          round_scored: gameState.current_round
        });

      // Record the turn
      await supabase
        .from('game_turns')
        .insert({
          game_id: gameId!,
          player_id: user.id,
          turn_number: gameState.current_round,
          dice_rolls: currentDice,
          selected_category: category,
          score_earned: score
        });

      // Show score notification
      if (score > 0) {
        showNotification({
          type: 'score',
          title: '🎯 SCORED! 🎯',
          message: `Fantastic ${category} for ${score} points!`,
          points: score
        });
        soundManager.play('score', 0.5);
      } else {
        showNotification({
          type: 'score',
          title: '💥 ZERO! 💥',
          message: `Better luck next time with ${category}!`,
          points: 0
        });
      }

      // Advance to next player's turn
      await supabase.rpc('advance_game_turn', { game_uuid: gameId });

      // Reset dice state
      setRollsLeft(3);
      setSelectedDice([false, false, false, false, false]);
      setCurrentDice([1, 2, 3, 4, 5]);
      setTurnStartTime(null);

    } catch (error: any) {
      console.error('Error scoring category:', error);
      toast({
        title: "Error",
        description: "Failed to record score",
        variant: "destructive",
      });
    }
  };

  const handleTimeUp = useCallback(() => {
    if (isMyTurn && rollsLeft < 3) {
      // Auto-score in chance category if no other category available
      const availableCategories = [
        'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
        'threeOfKind', 'fourOfKind', 'fullHouse', 'smallStraight', 
        'largeStraight', 'chaos', 'chance'
      ].filter(cat => playerScorecard[cat] === undefined);
      
      if (availableCategories.length > 0) {
        const bestCategory = availableCategories.reduce((best, current) => {
          return calculateScore(current) > calculateScore(best) ? current : best;
        });
        scoreCategory(bestCategory);
      }
    }
    
    soundManager.play('tick', 0.3);
    showNotification({
      type: 'turn',
      title: '⏰ TIME UP! ⏰',
      message: 'Your turn has been automatically completed.'
    });
  }, [isMyTurn, rollsLeft, playerScorecard]);

  const handleEmote = async (emote: string) => {
    // In a real implementation, you'd broadcast this emote to other players
    soundManager.play('emote', 0.3);
    console.log(`Player ${user?.id} sent emote: ${emote}`);
  };

  const leaveGame = async () => {
    try {
      await supabase
        .from('game_players')
        .delete()
        .eq('game_id', gameId)
        .eq('player_id', user?.id);

      navigate('/lobby');
      toast({
        title: "Left Game",
        description: "You have left the chaotic battlefield.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to leave game",
        variant: "destructive",
      });
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <ChaoticBackground />
        <div className="font-quicksand text-white text-xl relative z-10">Loading chaotic experience...</div>
      </div>
    );
  }

  if (gameFinished) {
    return <GameOver gameId={gameId!} players={finalScores} />;
  }

  const totalScore = Object.values(playerScorecard).reduce((sum, score) => sum + score, 0);
  const isCloseToWin = totalScore >= WIN_SCORE * 0.8;

  return (
    <div className="min-h-screen relative overflow-hidden p-4 font-quicksand">
      <ChaoticBackground />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Game Timer */}
        <GameTimer 
          isActive={isMyTurn && gameState.status === 'active'} 
          onTimeUp={handleTimeUp}
          duration={60}
        />

        {/* Game Notification - Larger and more prominent */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ scale: 0, opacity: 0, y: -100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: -100 }}
              className="fixed inset-x-0 top-1/4 z-50 flex justify-center px-4"
            >
              <Card className="bg-gradient-to-r from-purple-900/95 to-pink-900/95 border-yellow-400/80 backdrop-blur-md shadow-2xl max-w-lg">
                <CardContent className="p-8 text-center">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 0.5, repeat: 2 }}
                  >
                    <h3 className="font-bangers text-3xl text-yellow-300 mb-2 drop-shadow-lg">
                      {notification.title}
                    </h3>
                  </motion.div>
                  <p className="font-quicksand text-white text-lg mb-4 font-medium">
                    {notification.message}
                  </p>
                  {notification.points !== undefined && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xl px-4 py-2 font-bangers">
                        +{notification.points} POINTS!
                      </Badge>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <Button
              onClick={leaveGame}
              variant="outline"
              size="sm"
              className="border-red-500/50 text-red-300 hover:bg-red-800/50 font-quicksand backdrop-blur-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Escape
            </Button>

            <motion.h1 
              className="font-bangers text-4xl md:text-6xl text-white flex items-center gap-2 drop-shadow-lg"
              animate={{ 
                textShadow: [
                  "0 0 20px rgba(168, 85, 247, 0.8)",
                  "0 0 30px rgba(236, 72, 153, 0.8)", 
                  "0 0 40px rgba(34, 211, 238, 0.8)",
                  "0 0 30px rgba(236, 72, 153, 0.8)",
                  "0 0 20px rgba(168, 85, 247, 0.8)"
                ]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Crown className="text-yellow-400" />
              {gameState.name}
              <Crown className="text-yellow-400" />
            </motion.h1>

            <PlayerEmotes 
              onEmote={handleEmote}
              disabled={!isMyTurn}
            />
          </div>

          <div className="flex justify-center items-center gap-4 text-purple-200 flex-wrap">
            <Badge variant="secondary" className="bg-purple-800/50 font-quicksand backdrop-blur-sm">
              Round {gameState.current_round}/{gameState.max_rounds}
            </Badge>
            <Badge variant="secondary" className="bg-purple-800/50 font-quicksand backdrop-blur-sm">
              <Users className="w-4 h-4 mr-1" />
              {gameState.players.length} Chaotic Souls
            </Badge>
            {isCloseToWin && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Badge className="bg-gradient-to-r from-yellow-600 to-orange-600 font-bangers backdrop-blur-sm">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  VICTORY APPROACHES!
                </Badge>
              </motion.div>
            )}
            {gameState.status === 'waiting' && gameState.host_id === user?.id && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={startGame} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-bangers backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Unleash Chaos
                </Button>
              </motion.div>
            )}
          </div>
          
          {gameState.host_id === user?.id && (
            <div className="mt-4">
              <RoomInvite 
                gameId={gameState.id}
                isHost={true}
              />
            </div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Players & Chaos */}
          <div className="space-y-4">
            <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-bangers text-white flex items-center gap-2">
                  <Users className="text-purple-400" />
                  CHAOTIC SOULS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {gameState.players.map((player, index) => {
                  const isCurrentTurn = index === gameState.current_player_turn && gameState.status === 'active';
                  const displayScore = player.player_id === user?.id ? totalScore : (player.score || 0);
                  
                  return (
                    <motion.div
                      key={player.id}
                      className={`p-3 rounded-lg border transition-all backdrop-blur-sm ${
                        isCurrentTurn
                          ? 'border-yellow-400/80 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 shadow-xl'
                          : 'border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-indigo-900/20'
                      }`}
                      animate={isCurrentTurn ? { 
                        boxShadow: [
                          "0 0 20px rgba(251, 191, 36, 0.3)",
                          "0 0 30px rgba(251, 191, 36, 0.6)",
                          "0 0 20px rgba(251, 191, 36, 0.3)"
                        ]
                      } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-quicksand text-white font-medium flex items-center gap-2">
                          {player.player_id === gameState.host_id && <Crown className="h-4 w-4 text-yellow-400" />}
                          {player.username || `Player ${index + 1}`}
                          {isCurrentTurn && <Timer className="h-4 w-4 text-yellow-400 animate-pulse" />}
                          {player.player_id === user?.id && <span className="text-xs text-purple-300">(You)</span>}
                        </span>
                        <span className={`font-bangers text-2xl drop-shadow-md ${
                          displayScore >= WIN_SCORE ? 'text-yellow-400' : 'text-purple-300'
                        }`}>
                          {displayScore}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((displayScore / WIN_SCORE) * 100, 100)} 
                        className="mt-2 h-2"
                      />
                      {displayScore >= WIN_SCORE && (
                        <motion.div 
                          className="text-yellow-400 text-xs font-bangers mt-1"
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          🏆 CHAOS CHAMPION! 🏆
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Chaos Events */}
            <ChaosEvents 
              gameId={gameId!} 
              currentTurn={gameState.current_round} 
              onChaosTriggered={(event) => {
                showNotification({
                  type: 'chaos',
                  title: '🌪️ CHAOS STRIKES! 🌪️',
                  message: event.name
                });
                soundManager.play('chaos', 0.6);
              }}
            />
          </div>

          {/* Center Panel - Dice & Actions */}
          <div className="space-y-6">
            {gameState.status === 'active' && (
              <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="font-bangers text-white text-center flex items-center justify-center gap-2">
                    <Timer className="text-blue-400" />
                    {isMyTurn ? '🎲 YOUR CHAOS TURN! 🎲' : `${gameState.players[gameState.current_player_turn]?.username || 'Player'}'S TURN`}
                    {isMyTurn && (
                      <Badge className="ml-2 bg-gradient-to-r from-blue-600 to-purple-600 font-quicksand backdrop-blur-sm">
                        {rollsLeft} rolls left
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* 3D Dice Grid - Better spaced */}
                  <div className="flex justify-center gap-3 mb-6 flex-wrap">
                    {currentDice.map((value, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Dice3D
                          value={value}
                          isRolling={isRolling}
                          isSelected={selectedDice[index]}
                          onClick={() => toggleDiceSelection(index)}
                          size="lg"
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* Roll Button */}
                  {isMyTurn && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={rollDice}
                        disabled={rollsLeft <= 0 || isRolling}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bangers text-2xl py-6 backdrop-blur-sm"
                      >
                        <RotateCcw className="mr-2" />
                        {isRolling ? '🎲 ROLLING CHAOS... 🎲' : rollsLeft > 0 ? `ROLL THE CHAOS (${rollsLeft} LEFT)` : 'CHOOSE YOUR DESTINY'}
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            )}

            {gameState.status === 'waiting' && (
              <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    <Timer className="h-16 w-16 text-purple-400 mx-auto mb-4 opacity-50" />
                  </motion.div>
                  <p className="font-quicksand text-purple-200 text-lg mb-2">Gathering chaotic souls...</p>
                  <p className="font-quicksand text-purple-300">The madness awaits your command!</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Scorecard */}
          <div>
            <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-bangers text-white flex items-center gap-2">
                  <Trophy className="text-yellow-400" />
                  CHAOS SCORECARD
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { key: 'ones', label: 'Ones', desc: 'Sum of 1s', icon: '1️⃣' },
                  { key: 'twos', label: 'Twos', desc: 'Sum of 2s', icon: '2️⃣' },
                  { key: 'threes', label: 'Threes', desc: 'Sum of 3s', icon: '3️⃣' },
                  { key: 'fours', label: 'Fours', desc: 'Sum of 4s', icon: '4️⃣' },
                  { key: 'fives', label: 'Fives', desc: 'Sum of 5s', icon: '5️⃣' },
                  { key: 'sixes', label: 'Sixes', desc: 'Sum of 6s', icon: '6️⃣' },
                  { key: 'threeOfKind', label: 'Three of a Kind', desc: 'Sum of all dice', icon: '🎯' },
                  { key: 'fourOfKind', label: 'Four of a Kind', desc: 'Sum of all dice', icon: '🔥' },
                  { key: 'fullHouse', label: 'Full House', desc: '25 points', icon: '🏠' },
                  { key: 'smallStraight', label: 'Small Straight', desc: '30 points', icon: '➡️' },
                  { key: 'largeStraight', label: 'Large Straight', desc: '40 points', icon: '🎳' },
                  { key: 'chaos', label: 'CHAOS!', desc: '75 points', icon: '🌪️' },
                  { key: 'chance', label: 'Chance', desc: 'Sum of all dice', icon: '🎲' },
                ].map((category) => {
                  const hasScored = playerScorecard[category.key] !== undefined;
                  const canScore = isMyTurn && rollsLeft < 3 && !hasScored;
                  const potentialScore = calculateScore(category.key);
                  
                  return (
                    <motion.button
                      key={category.key}
                      whileHover={canScore ? { scale: 1.02, x: 5 } : {}}
                      whileTap={canScore ? { scale: 0.98 } : {}}
                      onClick={() => canScore && scoreCategory(category.key)}
                      disabled={!canScore}
                      className={`w-full p-3 text-left rounded-lg border transition-all font-quicksand backdrop-blur-sm ${
                        hasScored 
                          ? 'border-green-500/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20' 
                          : canScore
                            ? 'border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 hover:bg-gradient-to-r hover:from-purple-800/30 hover:to-indigo-800/30 cursor-pointer'
                            : 'border-gray-500/30 bg-gradient-to-r from-gray-900/20 to-slate-900/20 opacity-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{category.icon}</span>
                          <div>
                            <div className={`text-white font-medium ${category.key === 'chaos' ? 'font-bangers text-lg text-red-400' : ''}`}>
                              {category.label}
                            </div>
                            <div className="text-purple-300 text-sm">{category.desc}</div>
                          </div>
                        </div>
                        <div className="text-lg font-bold">
                          {hasScored ? (
                            <span className="text-green-400 font-bangers text-xl drop-shadow-md">{playerScorecard[category.key]}</span>
                          ) : canScore ? (
                            <motion.span 
                              className="text-yellow-400 font-bangers text-xl drop-shadow-md"
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              {potentialScore}
                            </motion.span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
                
                <div className="mt-4 pt-4 border-t border-purple-500/30">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="font-quicksand text-white">Total Chaos:</span>
                    <motion.span 
                      className={`font-bangers text-2xl drop-shadow-md ${
                        totalScore >= WIN_SCORE ? 'text-yellow-400' : 'text-yellow-400'
                      }`}
                      animate={totalScore >= WIN_SCORE ? { 
                        scale: [1, 1.1, 1],
                        textShadow: [
                          "0 0 10px rgba(251, 191, 36, 0.8)",
                          "0 0 20px rgba(251, 191, 36, 1)",
                          "0 0 10px rgba(251, 191, 36, 0.8)"
                        ]
                      } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {totalScore}
                    </motion.span>
                  </div>
                  <div className="mt-2">
                    <Progress 
                      value={(totalScore / WIN_SCORE) * 100} 
                      className="h-3"
                    />
                    <div className="text-center text-purple-300 text-xs mt-1 font-quicksand">
                      {WIN_SCORE - totalScore > 0 ? `${WIN_SCORE - totalScore} to conquer chaos` : '🏆 CHAOS CONQUERED! 🏆'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
