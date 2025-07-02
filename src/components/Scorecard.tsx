
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Target, Zap } from "lucide-react";

interface ScorecardProps {
  dice: number[];
  onScoreSelect: (category: string, score: number) => void;
  usedCategories: string[];
  isMyTurn: boolean;
}

const Scorecard = ({ dice, onScoreSelect, usedCategories, isMyTurn }: ScorecardProps) => {
  // Calculate all possible scores
  const calculateScore = (category: string): number => {
    const counts = dice.reduce((acc, die) => {
      acc[die] = (acc[die] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const sortedDice = [...dice].sort((a, b) => a - b);
    const uniqueValues = Object.keys(counts).map(Number).sort((a, b) => a - b);

    switch (category) {
      case 'ones':
        return counts[1] ? counts[1] * 1 : 0;
      case 'twos':
        return counts[2] ? counts[2] * 2 : 0;
      case 'threes':
        return counts[3] ? counts[3] * 3 : 0;
      case 'fours':
        return counts[4] ? counts[4] * 4 : 0;
      case 'fives':
        return counts[5] ? counts[5] * 5 : 0;
      case 'sixes':
        return counts[6] ? counts[6] * 6 : 0;
      case 'three_of_kind':
        for (const [value, count] of Object.entries(counts)) {
          if (count >= 3) {
            return dice.reduce((sum, die) => sum + die, 0);
          }
        }
        return 0;
      case 'four_of_kind':
        for (const [value, count] of Object.entries(counts)) {
          if (count >= 4) {
            return dice.reduce((sum, die) => sum + die, 0);
          }
        }
        return 0;
      case 'full_house':
        const hasThree = Object.values(counts).includes(3);
        const hasTwo = Object.values(counts).includes(2);
        return hasThree && hasTwo ? 25 : 0;
      case 'small_straight':
        const smallStraights = [
          [1, 2, 3, 4],
          [2, 3, 4, 5],
          [3, 4, 5, 6]
        ];
        for (const straight of smallStraights) {
          if (straight.every(num => uniqueValues.includes(num))) {
            return 30;
          }
        }
        return 0;
      case 'large_straight':
        const largeStraights = [
          [1, 2, 3, 4, 5],
          [2, 3, 4, 5, 6]
        ];
        for (const straight of largeStraights) {
          if (straight.every(num => uniqueValues.includes(num))) {
            return 40;
          }
        }
        return 0;
      case 'five_of_kind':
        for (const count of Object.values(counts)) {
          if (count >= 5) {
            return 50;
          }
        }
        return 0;
      case 'chance':
        return dice.reduce((sum, die) => sum + die, 0);
      default:
        return 0;
    }
  };

  const categories = [
    { id: 'ones', name: 'Ones', description: 'Sum of all 1s', icon: Star },
    { id: 'twos', name: 'Twos', description: 'Sum of all 2s', icon: Star },
    { id: 'threes', name: 'Threes', description: 'Sum of all 3s', icon: Star },
    { id: 'fours', name: 'Fours', description: 'Sum of all 4s', icon: Star },
    { id: 'fives', name: 'Fives', description: 'Sum of all 5s', icon: Star },
    { id: 'sixes', name: 'Sixes', description: 'Sum of all 6s', icon: Star },
    { id: 'three_of_kind', name: 'Three of a Kind', description: 'Sum of all dice (3+ same)', icon: Target },
    { id: 'four_of_kind', name: 'Four of a Kind', description: 'Sum of all dice (4+ same)', icon: Target },
    { id: 'full_house', name: 'Full House', description: '3 of one + 2 of another = 25 pts', icon: Target },
    { id: 'small_straight', name: 'Small Straight', description: '4 consecutive = 30 pts', icon: Zap },
    { id: 'large_straight', name: 'Large Straight', description: '5 consecutive = 40 pts', icon: Zap },
    { id: 'five_of_kind', name: 'CHAOS!', description: 'All 5 same = 50 pts', icon: Zap },
    { id: 'chance', name: 'Chance', description: 'Sum of all dice', icon: Star },
  ];

  return (
    <Card className="bg-gradient-to-br from-black/70 to-indigo-900/30 border-2 border-indigo-400/60 backdrop-blur-md shadow-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-white font-bangers text-xl flex items-center gap-2">
          <Target className="text-indigo-400 h-5 w-5" />
          Scorecard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {categories.map((category, index) => {
          const score = calculateScore(category.id);
          const isUsed = usedCategories.includes(category.id);
          const canSelect = isMyTurn && !isUsed && score >= 0;
          const IconComponent = category.icon;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                flex items-center justify-between p-3 rounded-lg border transition-all
                ${isUsed 
                  ? 'bg-gray-600/30 border-gray-500/40 opacity-60' 
                  : canSelect && score > 0
                    ? 'bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-500/60 hover:from-green-600/40 hover:to-emerald-600/40 cursor-pointer' 
                    : 'bg-indigo-600/20 border-indigo-500/40'
                }
              `}
              onClick={() => canSelect && score > 0 && onScoreSelect(category.id, score)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <IconComponent className={`h-4 w-4 flex-shrink-0 ${
                  isUsed ? 'text-gray-400' : 'text-indigo-400'
                }`} />
                <div className="min-w-0 flex-1">
                  <div className={`font-quicksand font-medium text-sm ${
                    isUsed ? 'text-gray-300' : 'text-white'
                  }`}>
                    {category.name}
                  </div>
                  <div className={`font-quicksand text-xs ${
                    isUsed ? 'text-gray-400' : 'text-indigo-200'
                  }`}>
                    {category.description}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isUsed ? (
                  <Badge className="bg-gray-600 text-gray-300 border-0 font-bangers">
                    Used
                  </Badge>
                ) : (
                  <Badge className={`border-0 font-bangers ${
                    score > 0 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' 
                      : 'bg-red-600 text-white'
                  }`}>
                    {score} pts
                  </Badge>
                )}
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default Scorecard;
