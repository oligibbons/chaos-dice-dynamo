
import { motion } from "framer-motion";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react";

const Logo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl", 
    lg: "text-6xl"
  };

  const diceSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

  return (
    <div className="flex items-center gap-2">
      <motion.div
        className="relative"
        animate={{ 
          rotate: [0, 15, -10, 20, -15, 0],
          scale: [1, 1.1, 0.9, 1.05, 1]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {diceIcons.map((DiceIcon, index) => (
          <motion.div
            key={index}
            className="absolute"
            style={{
              left: `${index * 8 - 20}px`,
              top: `${Math.sin(index) * 5}px`,
              zIndex: 6 - index
            }}
            animate={{
              rotate: [0, 360],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{
              duration: 3 + index * 0.5,
              repeat: Infinity,
              delay: index * 0.2
            }}
          >
            <DiceIcon 
              className={`${diceSizes[size]} text-purple-400 drop-shadow-lg`}
              style={{
                filter: `hue-rotate(${index * 60}deg) saturate(150%)`
              }}
            />
          </motion.div>
        ))}
      </motion.div>
      
      <motion.h1 
        className={`font-bangers ${sizeClasses[size]} bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg`}
        animate={{ 
          textShadow: [
            "0 0 10px rgba(168, 85, 247, 0.5)",
            "0 0 20px rgba(236, 72, 153, 0.5)", 
            "0 0 30px rgba(34, 211, 238, 0.5)",
            "0 0 20px rgba(236, 72, 153, 0.5)",
            "0 0 10px rgba(168, 85, 247, 0.5)"
          ]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ marginLeft: "60px" }}
      >
        DieNamic
      </motion.h1>
    </div>
  );
};

export default Logo;
