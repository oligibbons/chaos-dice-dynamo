
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface Dice3DProps {
  value: number;
  isRolling: boolean;
  isSelected: boolean;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const Dice3D = ({ value, isRolling, isSelected, onClick, size = 'md' }: Dice3DProps) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (!isRolling) {
      setDisplayValue(value);
    }
  }, [value, isRolling]);

  const sizeClasses = {
    sm: 'w-12 h-12 text-xs',
    md: 'w-16 h-16 text-sm',
    lg: 'w-20 h-20 text-base'
  };

  const dotPositions = {
    1: ['center'],
    2: ['top-left', 'bottom-right'],
    3: ['top-left', 'center', 'bottom-right'],
    4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
    6: ['top-left', 'top-right', 'center-left', 'center-right', 'bottom-left', 'bottom-right']
  };

  const getDotPosition = (position: string) => {
    const positions = {
      'top-left': 'top-1 left-1',
      'top-right': 'top-1 right-1',
      'center-left': 'top-1/2 left-1 -translate-y-1/2',
      'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
      'center-right': 'top-1/2 right-1 -translate-y-1/2',
      'bottom-left': 'bottom-1 left-1',
      'bottom-right': 'bottom-1 right-1'
    };
    return positions[position as keyof typeof positions];
  };

  return (
    <motion.div
      className="perspective-1000 cursor-pointer"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className={`
          ${sizeClasses[size]} 
          relative preserve-3d rounded-xl border-2 transition-all duration-300
          ${isSelected 
            ? 'border-yellow-400 bg-gradient-to-br from-yellow-400/30 to-yellow-600/30 shadow-lg shadow-yellow-400/50' 
            : 'border-purple-500/50 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 hover:border-pink-400/70'
          }
          ${isRolling ? 'animate-dice-roll' : ''}
        `}
        animate={isRolling ? {
          rotateX: [0, 360, 720, 1080],
          rotateY: [0, 180, 540, 720],
          rotateZ: [0, 90, 270, 360],
        } : {}}
        transition={isRolling ? {
          duration: 1,
          ease: "easeInOut",
          times: [0, 0.3, 0.7, 1]
        } : {}}
      >
        {/* Dice face with dots */}
        <div className="absolute inset-1 flex items-center justify-center">
          <div className="relative w-full h-full">
            {dotPositions[displayValue as keyof typeof dotPositions]?.map((position, index) => (
              <div
                key={index}
                className={`
                  absolute w-2 h-2 bg-white rounded-full shadow-sm
                  ${getDotPosition(position)}
                  ${isSelected ? 'bg-yellow-300' : 'bg-white'}
                `}
              />
            ))}
          </div>
        </div>

        {/* Glow effect when selected */}
        {isSelected && (
          <div className="absolute inset-0 rounded-xl bg-yellow-400/20 animate-pulse" />
        )}
      </motion.div>
    </motion.div>
  );
};

export default Dice3D;
