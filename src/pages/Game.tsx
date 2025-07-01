import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, Crown, Timer, Users, RotateCcw, Trophy, Sparkles } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Dice3D from "@/components/Dice3D";
import ChaosEvents from "@/components/ChaosEvents";
import GameOver from "@/components/GameOver";

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

const Game = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentDice, setCurrentDice] = useState([1, 2, 3, 4, 5]);
  const [selectedDice, setSelectedDice] = useState<boolean[]>([false, false, false, false, false]);
  const [isRolling, setIsRolling] = useState(false);
  const [rollsLeft, setRollsLeft] = useState(3);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [playerScorecard, setPlayerScorecard] = useState<Record<string, number>>({});
  const [gameFinished, setGameFinished] = useState(false);
  const [finalScores, setFinalScores] = useState<any[]>([]);

  const MAX_TURNS = 5; // 5 turns instead of 13 rounds

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
        () => fetchGameState()
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
        () => fetchPlayerScorecard()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, navigate, user]);

  const fetchGameState = async () => {
    if (!gameId) return;

    try {
      // Fetch game data
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

      // Fetch game players
      const { data: gamePlayers, error: playersError } = await supabase
        .from('game_players')
        .select('*')
        .eq('game_id', gameId)
        .order('turn_order');

      if (playersError) {
        console.error('Error fetching game players:', playersError);
        return;
      }

      // Fetch player profiles
      const playerIds = gamePlayers?.map(p => p.player_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', playerIds);

      // Combine players with their usernames
      const playersWithUsernames = gamePlayers?.map(player => ({
        ...player,
        username: profiles?.find(p => p.id === player.player_id)?.username || 'Unknown'
      })) || [];

      // Check if game should be finished (5 turns completed)
      if (game.current_round > MAX_TURNS && game.status !== 'finished') {
        await finishGame();
        return;
      }

      const chaosEvents = Array.isArray(game.chaos_events) ? game.chaos_events : [];

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
      setIsMyTurn(currentPlayer?.player_id === user?.id);

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
    } catch (error) {
      console.error('Error finishing game:', error);
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

      toast({
        title: "Game Started!",
        description: "Let the chaos begin!",
      });
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

    // Animate dice rolling with multiple intermediate values
    const rollDuration = 1000;
    const rollInterval = 100;
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

  const calculateScore = (category: string) => {
    const counts = currentDice.reduce((acc, die) => {
      acc[die] = (acc[die] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const sum = currentDice.reduce((a, b) => a + b, 0);
    const sortedDice = [...currentDice].sort();

    switch (category) {
      case 'ones': return (counts[1] || 0) * 1;
      case 'twos': return (counts[2] || 0) * 2;
      case 'threes': return (counts[3] || 0) * 3;
      case 'fours': return (counts[4] || 0) * 4;
      case 'fives': return (counts[5] || 0) * 5;
      case 'sixes': return (counts[6] || 0) * 6;
      case 'threeOfKind': 
        return Object.values(counts).some(count => count >= 3) ? sum : 0;
      case 'fourOfKind': 
        return Object.values(counts).some(count => count >= 4) ? sum : 0;
      case 'fullHouse': 
        return Object.values(counts).includes(3) && Object.values(counts).includes(2) ? 25 : 0;
      case 'smallStraight': 
        return [1,2,3,4].every(n => sortedDice.includes(n)) || 
               [2,3,4,5].every(n => sortedDice.includes(n)) || 
               [3,4,5,6].every(n => sortedDice.includes(n)) ? 30 : 0;
      case 'largeStraight': 
        return [1,2,3,4,5].every(n => sortedDice.includes(n)) || 
               [2,3,4,5,6].every(n => sortedDice.includes(n)) ? 40 : 0;
      case 'chaos': 
        return Object.values(counts).some(count => count === 5) ? 75 : 0;
      case 'chance': 
        return sum;
      default: 
        return 0;
    }
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

      // Advance to next player's turn
      await supabase.rpc('advance_game_turn', { game_uuid: gameId });

      // Reset dice state
      setRollsLeft(3);
      setSelectedDice([false, false, false, false, false]);
      setCurrentDice([1, 2, 3, 4, 5]);

      toast({
        title: "Score Recorded!",
        description: `You scored ${score} points in ${category}`,
      });

    } catch (error: any) {
      console.error('Error scoring category:', error);
      toast({
        title: "Error",
        description: "Failed to record score",
        variant: "destructive",
      });
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 flex items-center justify-center">
        <div className="font-quicksand text-white text-xl">Loading game...</div>
      </div>
    );
  }

  if (gameFinished) {
    return <GameOver gameId={gameId!} players={finalScores} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 p-4 font-quicksand">
      <div className="max-w-7xl mx-auto">
        {/* Game Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="font-bangers text-6xl text-white mb-2 flex items-center justify-center gap-2">
            <Crown className="text-yellow-400" />
            {gameState.name}
            <Crown className="text-yellow-400" />
          </h1>
          <div className="flex justify-center items-center gap-4 text-purple-200">
            <Badge variant="secondary" className="bg-purple-800/50 font-quicksand">
              Turn {gameState.current_round}/{gameState.max_rounds}
            </Badge>
            <Badge variant="secondary" className="bg-purple-800/50 font-quicksand">
              <Users className="w-4 h-4 mr-1" />
              {gameState.players.length} Players
            </Badge>
            {gameState.status === 'waiting' && gameState.host_id === user?.id && (
              <Button onClick={startGame} className="bg-green-600 hover:bg-green-700 font-quicksand font-semibold">
                <Sparkles className="w-4 h-4 mr-2" />
                Start Game
              </Button>
            )}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Players & Chaos */}
          <div className="space-y-4">
            <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-bangers text-white flex items-center gap-2">
                  <Users className="text-purple-400" />
                  PLAYERS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {gameState.players.map((player, index) => {
                  const totalScore = Object.values(playerScorecard).reduce((sum, score) => sum + score, 0);
                  const isCurrentTurn = index === gameState.current_player_turn && gameState.status === 'active';
                  
                  return (
                    <motion.div
                      key={player.id}
                      className={`p-3 rounded-lg border transition-all ${
                        isCurrentTurn
                          ? 'border-yellow-400 bg-yellow-400/20 shadow-lg animate-pulse'
                          : 'border-purple-500/30 bg-purple-900/20'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-quicksand text-white font-medium flex items-center gap-2">
                          {player.player_id === gameState.host_id && <Crown className="h-4 w-4 text-yellow-400" />}
                          {player.username || `Player ${index + 1}`}
                          {isCurrentTurn && <Timer className="h-4 w-4 text-yellow-400" />}
                        </span>
                        <span className="font-bangers text-2xl text-purple-300">
                          {player.player_id === user?.id ? totalScore : (player.score || 0)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((player.player_id === user?.id ? totalScore : (player.score || 0)) / 10, 100)} 
                        className="mt-2 h-2"
                      />
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
                toast({
                  title: "🔥 CHAOS EVENT! 🔥",
                  description: event.name,
                  variant: "destructive",
                });
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
                    {isMyTurn ? 'YOUR TURN!' : `${gameState.players[gameState.current_player_turn]?.username || 'Player'}'S TURN`}
                    {isMyTurn && (
                      <Badge className="ml-2 bg-blue-600 font-quicksand">
                        {rollsLeft} rolls left
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* 3D Dice Grid - Fixed spacing */}
                  <div className="flex justify-center gap-2 mb-6">
                    {currentDice.map((value, index) => (
                      <Dice3D
                        key={index}
                        value={value}
                        isRolling={isRolling}
                        isSelected={selectedDice[index]}
                        onClick={() => toggleDiceSelection(index)}
                        size="md"
                      />
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
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bangers text-2xl py-4"
                      >
                        <RotateCcw className="mr-2" />
                        {isRolling ? 'ROLLING...' : rollsLeft > 0 ? `ROLL DICE (${rollsLeft} LEFT)` : 'CHOOSE CATEGORY'}
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            )}

            {gameState.status === 'waiting' && (
              <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <Timer className="h-16 w-16 text-purple-400 mx-auto mb-4 opacity-50" />
                  <p className="font-quicksand text-purple-200 text-lg mb-2">Waiting for players...</p>
                  <p className="font-quicksand text-purple-300">Game will start when the host is ready!</p>
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
                  YOUR SCORECARD
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { key: 'ones', label: 'Ones', desc: 'Sum of 1s' },
                  { key: 'twos', label: 'Twos', desc: 'Sum of 2s' },
                  { key: 'threes', label: 'Threes', desc: 'Sum of 3s' },
                  { key: 'fours', label: 'Fours', desc: 'Sum of 4s' },
                  { key: 'fives', label: 'Fives', desc: 'Sum of 5s' },
                  { key: 'sixes', label: 'Sixes', desc: 'Sum of 6s' },
                  { key: 'threeOfKind', label: 'Three of a Kind', desc: 'Sum of all dice' },
                  { key: 'fourOfKind', label: 'Four of a Kind', desc: 'Sum of all dice' },
                  { key: 'fullHouse', label: 'Full House', desc: '25 points' },
                  { key: 'smallStraight', label: 'Small Straight', desc: '30 points' },
                  { key: 'largeStraight', label: 'Large Straight', desc: '40 points' },
                  { key: 'chaos', label: 'CHAOS', desc: '75 points' },
                  { key: 'chance', label: 'Chance', desc: 'Sum of all dice' },
                ].map((category) => {
                  const hasScored = playerScorecard[category.key] !== undefined;
                  const canScore = isMyTurn && rollsLeft < 3 && !hasScored;
                  const potentialScore = calculateScore(category.key);
                  
                  return (
                    <motion.button
                      key={category.key}
                      whileHover={canScore ? { scale: 1.02 } : {}}
                      whileTap={canScore ? { scale: 0.98 } : {}}
                      onClick={() => canScore && scoreCategory(category.key)}
                      disabled={!canScore}
                      className={`w-full p-3 text-left rounded-lg border transition-all font-quicksand ${
                        hasScored 
                          ? 'border-green-500/50 bg-green-900/20' 
                          : canScore
                            ? 'border-purple-500/30 bg-purple-900/20 hover:bg-purple-800/30 cursor-pointer'
                            : 'border-gray-500/30 bg-gray-900/20 opacity-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className={`text-white font-medium ${category.key === 'chaos' ? 'font-bangers text-lg text-red-400' : ''}`}>
                            {category.label}
                          </div>
                          <div className="text-purple-300 text-sm">{category.desc}</div>
                        </div>
                        <div className="text-lg font-bold">
                          {hasScored ? (
                            <span className="text-green-400 font-bangers text-xl">{playerScorecard[category.key]}</span>
                          ) : canScore ? (
                            <span className="text-yellow-400 font-bangers text-xl">{potentialScore}</span>
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
                    <span className="font-quicksand text-white">Total Score:</span>
                    <span className="font-bangers text-2xl text-yellow-400">
                      {Object.values(playerScorecard).reduce((sum, score) => sum + score, 0)}
                    </span>
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
