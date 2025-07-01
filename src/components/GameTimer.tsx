
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Timer, AlertTriangle } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

interface GameTimerProps {
  isActive: boolean;
  onTimeUp: () => void;
  duration?: number;
}

const GameTimer = ({ isActive, onTimeUp, duration = 60 }: GameTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(duration);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, duration, onTimeUp]);

  useEffect(() => {
    if (isActive) {
      setTimeLeft(duration);
    }
  }, [isActive, duration]);

  const progressValue = (timeLeft / duration) * 100;
  const isUrgent = timeLeft <= 10;

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-black/80 backdrop-blur-sm border rounded-lg p-3 ${
        isUrgent ? 'border-red-500 animate-pulse' : 'border-purple-500/50'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {isUrgent ? (
          <AlertTriangle className="h-4 w-4 text-red-400" />
        ) : (
          <Timer className="h-4 w-4 text-purple-400" />
        )}
        <span className={`font-bangers text-lg ${isUrgent ? 'text-red-400' : 'text-white'}`}>
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </span>
      </div>
      <Progress 
        value={progressValue} 
        className={`h-2 ${isUrgent ? 'bg-red-900' : 'bg-purple-900'}`}
      />
      {isUrgent && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="text-red-400 text-xs font-quicksand mt-1"
        >
          Time running out!
        </motion.div>
      )}
    </motion.div>
  );
};

export default GameTimer;
