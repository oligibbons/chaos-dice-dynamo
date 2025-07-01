
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Zap, Crown, Timer, Users, RotateCcw } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GameState {
  id: string;
  name: string;
  current_round: number;
  max_rounds: number;
  status: string;
  chaos_events: any[];
  players: any[];
  current_player_turn: number;
}

interface DiceProps {
  value: number;
  isRolling: boolean;
  isSelected: boolean;
  onClick: () => void;
}

const DiceComponent = ({ value, isRolling, isSelected, onClick }: DiceProps) => {
  const DiceIcon = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6][value - 1] || Dice1;
  
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      animate={isRolling ? { rotate: 360 } : { rotate: 0 }}
      transition={{ duration: isRolling ? 0.5 : 0.2 }}
      onClick={onClick}
      className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
        isSelected 
          ? 'border-yellow-400 bg-yellow-400/20 shadow-lg shadow-yellow-400/50' 
          : 'border-purple-500/50 bg-purple-900/30 hover:border-pink-400/70'
      }`}
    >
      <DiceIcon className={`w-12 h-12 ${isSelected ? 'text-yellow-400' : 'text-white'}`} />
    </motion.div>
  );
};

const Game = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentDice, setCurrentDice] = useState([1, 2, 3, 4, 5]);
  const [selectedDice, setSelectedDice] = useState<boolean[]>([false, false, false, false, false]);
  const [isRolling, setIsRolling] = useState(false);
  const [rollsLeft, setRollsLeft] = useState(3);
  const [isMyTurn, setIsMyTurn] = useState(false);

  useEffect(() => {
    if (!gameId) {
      navigate('/lobby');
      return;
    }

    fetchGameState();
    
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, navigate]);

  const fetchGameState = async () => {
    if (!gameId) return;

    const { data: game, error } = await supabase
      .from('games')
      .select(`
        *,
        game_players (
          *,
          profiles (username)
        )
      `)
      .eq('id', gameId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch game state",
        variant: "destructive",
      });
      return;
    }

    setGameState({
      ...game,
      players: game.game_players || []
    });
  };

  const rollDice = () => {
    if (rollsLeft <= 0 || isRolling) return;
    
    setIsRolling(true);
    setRollsLeft(prev => prev - 1);

    // Simulate dice rolling animation
    const rollInterval = setInterval(() => {
      setCurrentDice(dice => dice.map((_, index) => 
        selectedDice[index] ? dice[index] : Math.floor(Math.random() * 6) + 1
      ));
    }, 100);

    setTimeout(() => {
      clearInterval(rollInterval);
      setIsRolling(false);
      
      // Final roll
      setCurrentDice(dice => dice.map((_, index) => 
        selectedDice[index] ? dice[index] : Math.floor(Math.random() * 6) + 1
      ));
    }, 1000);
  };

  const toggleDiceSelection = (index: number) => {
    if (rollsLeft === 3) return; // Can't select dice before first roll
    
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

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Game Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Crown className="text-yellow-400" />
            {gameState.name}
            <Crown className="text-yellow-400" />
          </h1>
          <div className="flex justify-center items-center gap-4 text-purple-200">
            <Badge variant="secondary" className="bg-purple-800/50">
              Round {gameState.current_round}/{gameState.max_rounds}
            </Badge>
            <Badge variant="secondary" className="bg-purple-800/50">
              <Users className="w-4 h-4 mr-1" />
              {gameState.players.length} Players
            </Badge>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Players & Scores */}
          <div className="space-y-4">
            <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="text-purple-400" />
                  Players
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {gameState.players.map((player, index) => (
                  <motion.div
                    key={player.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isMyTurn && index === gameState.current_player_turn
                        ? 'border-yellow-400 bg-yellow-400/20'
                        : 'border-purple-500/30 bg-purple-900/20'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">
                        {player.profiles?.username || `Player ${index + 1}`}
                      </span>
                      <span className="text-lg font-bold text-purple-300">
                        {player.score || 0}
                      </span>
                    </div>
                    <Progress 
                      value={(player.score || 0) / 10} 
                      className="mt-2 h-2"
                    />
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Chaos Events */}
            {gameState.chaos_events && gameState.chaos_events.length > 0 && (
              <Card className="bg-black/40 border-red-500/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="text-red-400" />
                    Active Chaos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {gameState.chaos_events.map((event, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg mb-2"
                    >
                      <h4 className="text-red-300 font-semibold">{event.name}</h4>
                      <p className="text-red-200 text-sm">{event.description}</p>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Center Panel - Dice & Actions */}
          <div className="space-y-6">
            <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-center flex items-center justify-center gap-2">
                  <Timer className="text-blue-400" />
                  Your Turn
                  <Badge className="ml-2 bg-blue-600">
                    {rollsLeft} rolls left
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Dice Grid */}
                <div className="grid grid-cols-5 gap-4 mb-6">
                  {currentDice.map((value, index) => (
                    <DiceComponent
                      key={index}
                      value={value}
                      isRolling={isRolling}
                      isSelected={selectedDice[index]}
                      onClick={() => toggleDiceSelection(index)}
                    />
                  ))}
                </div>

                {/* Roll Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={rollDice}
                    disabled={rollsLeft <= 0 || isRolling}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 text-lg"
                  >
                    <RotateCcw className="mr-2" />
                    {isRolling ? 'Rolling...' : rollsLeft > 0 ? `Roll Dice (${rollsLeft} left)` : 'No Rolls Left'}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Scorecard */}
          <div>
            <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Scorecard</CardTitle>
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
                  { key: 'chaos', label: 'Chaos', desc: '75 points' },
                  { key: 'chance', label: 'Chance', desc: 'Sum of all dice' },
                ].map((category) => (
                  <motion.button
                    key={category.key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-3 text-left rounded-lg border border-purple-500/30 bg-purple-900/20 hover:bg-purple-800/30 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-white font-medium">{category.label}</div>
                        <div className="text-purple-300 text-sm">{category.desc}</div>
                      </div>
                      <div className="text-lg font-bold text-yellow-400">
                        {calculateScore(category.key)}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
