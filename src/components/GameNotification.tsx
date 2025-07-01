
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Zap, Trophy, Sparkles, Target } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

interface GameNotificationProps {
  notification: {
    id: string;
    type: 'score' | 'chaos' | 'win' | 'turn' | 'achievement';
    title: string;
    message: string;
    points?: number;
    player?: string;
  } | null;
  onClose: () => void;
}

const GameNotification = ({ notification, onClose }: GameNotificationProps) => {
  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'score': return <Target className="h-12 w-12 text-green-400" />;
      case 'chaos': return <Zap className="h-12 w-12 text-red-400" />;
      case 'win': return <Crown className="h-12 w-12 text-yellow-400" />;
      case 'turn': return <Sparkles className="h-12 w-12 text-blue-400" />;
      case 'achievement': return <Trophy className="h-12 w-12 text-purple-400" />;
      default: return <Sparkles className="h-12 w-12 text-white" />;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'score': return 'from-green-600 to-emerald-600 border-green-400';
      case 'chaos': return 'from-red-600 to-orange-600 border-red-400';
      case 'win': return 'from-yellow-500 to-amber-500 border-yellow-400';
      case 'turn': return 'from-blue-600 to-cyan-600 border-blue-400';
      case 'achievement': return 'from-purple-600 to-violet-600 border-purple-400';
      default: return 'from-gray-600 to-slate-600 border-gray-400';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, rotate: -180, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0, rotate: 180, opacity: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 20,
          duration: 0.8 
        }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 2, -2, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Card className={`bg-gradient-to-br ${getColors()} backdrop-blur-sm border-2 max-w-md mx-4 shadow-2xl`}>
            <CardContent className="p-8 text-center">
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                }}
                className="mb-4 flex justify-center"
              >
                {getIcon()}
              </motion.div>
              
              <h2 className="font-bangers text-4xl text-white mb-2 drop-shadow-lg">
                {notification.title}
              </h2>
              
              {notification.points && (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="font-bangers text-6xl text-yellow-300 mb-2 drop-shadow-lg"
                >
                  +{notification.points}
                </motion.div>
              )}
              
              <p className="font-quicksand text-xl text-white/90 mb-4">
                {notification.message}
              </p>
              
              {notification.player && (
                <p className="font-quicksand text-lg text-white/70">
                  {notification.player}
                </p>
              )}

              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-white/60 text-sm font-quicksand mt-4"
              >
                Click anywhere to continue
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GameNotification;
