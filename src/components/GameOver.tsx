
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Crown, Medal, Star, PartyPopper } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Player {
  id: string;
  username: string;
  player_id: string;
  total_score: number;
  position: number;
}

interface GameOverProps {
  gameId: string;
  players: Player[];
  onPlayAgain?: () => void;
}

const GameOver = ({ players, onPlayAgain }: GameOverProps) => {
  const navigate = useNavigate();
  const [confetti, setConfetti] = useState(true);

  useEffect(() => {
    // Hide confetti after 3 seconds
    const timer = setTimeout(() => setConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const sortedPlayers = [...players].sort((a, b) => b.total_score - a.total_score);

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="h-8 w-8 text-yellow-400" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Medal className="h-6 w-6 text-amber-600" />;
      default: return <Star className="h-5 w-5 text-purple-400" />;
    }
  };

  const getPositionBg = (position: number) => {
    switch (position) {
      case 1: return 'bg-gradient-to-r from-yellow-600 to-yellow-500';
      case 2: return 'bg-gradient-to-r from-gray-600 to-gray-500';
      case 3: return 'bg-gradient-to-r from-amber-600 to-amber-500';
      default: return 'bg-gradient-to-r from-purple-600 to-purple-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Confetti effect */}
      {confetti && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: -20,
                rotate: 0,
                scale: Math.random() * 1 + 0.5
              }}
              animate={{
                y: window.innerHeight + 20,
                rotate: 360 * 3,
                x: Math.random() * window.innerWidth
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                ease: "easeOut",
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="max-w-2xl w-full mx-4"
      >
        <Card className="bg-black/90 border-yellow-500/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CardTitle className="font-bangers text-5xl text-yellow-400 flex items-center justify-center gap-4">
                <PartyPopper className="h-12 w-12" />
                GAME OVER!
                <PartyPopper className="h-12 w-12" />
              </CardTitle>
            </motion.div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4 mb-6">
              {sortedPlayers.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={`
                    flex items-center justify-between p-4 rounded-lg border-2
                    ${index === 0 ? 'border-yellow-400/50 bg-yellow-400/10' : 'border-purple-500/30 bg-purple-900/20'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getPositionIcon(index + 1)}
                      <Badge className={`${getPositionBg(index + 1)} text-white font-quicksand font-bold`}>
                        #{index + 1}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-quicksand font-bold text-white text-lg">
                        {player.username || `Player ${index + 1}`}
                      </h3>
                      {index === 0 && (
                        <p className="font-bangers text-yellow-400 text-sm">
                          🎉 CHAMPION! 🎉
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-bangers text-2xl ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                      {player.total_score}
                    </div>
                    <div className="font-quicksand text-sm text-gray-400">points</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex gap-4 justify-center"
            >
              <Button
                onClick={() => navigate('/lobby')}
                className="font-quicksand font-semibold bg-purple-600 hover:bg-purple-700"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Back to Lobby
              </Button>
              {onPlayAgain && (
                <Button
                  onClick={onPlayAgain}
                  className="font-quicksand font-semibold bg-green-600 hover:bg-green-700"
                >
                  Play Again
                </Button>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default GameOver;
