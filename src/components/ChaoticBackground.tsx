
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Zap, Crown, Star, Sparkles, Triangle, Diamond } from "lucide-react";

const ChaoticBackground = () => {
  const [particles, setParticles] = useState<Array<{
    id: number, 
    x: number, 
    y: number, 
    size: number, 
    color: string,
    type: 'dice' | 'chaos' | 'crown' | 'star' | 'sparkle' | 'triangle' | 'diamond'
  }>>([]);

  const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
  const chaosIcons = [Zap, Crown, Star, Sparkles, Triangle, Diamond];

  useEffect(() => {
    const types: Array<'dice' | 'chaos' | 'crown' | 'star' | 'sparkle' | 'triangle' | 'diamond'> = ['dice', 'chaos', 'crown', 'star', 'sparkle', 'triangle', 'diamond'];
    const newParticles = Array.from({ length: 30 }, (_, i) => {
      const randomType = types[Math.floor(Math.random() * types.length)];
      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        color: ['#8B5CF6', '#EC4899', '#22D3EE', '#F59E0B', '#EF4444', '#10B981', '#F97316', '#8B5A2B'][Math.floor(Math.random() * 8)],
        type: randomType
      };
    });
    setParticles(newParticles);
  }, []);

  const getIcon = (particle: typeof particles[0]) => {
    switch (particle.type) {
      case 'dice':
        return diceIcons[Math.floor(Math.random() * diceIcons.length)];
      case 'chaos':
        return Zap;
      case 'crown':
        return Crown;
      case 'star':
        return Star;
      case 'sparkle':
        return Sparkles;
      case 'triangle':
        return Triangle;
      case 'diamond':
        return Diamond;
      default:
        return Dice1;
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
      {/* Swirling gradient background with deeper purples and magentas */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900">
        <div className="absolute inset-0 bg-gradient-to-tl from-cyan-900/30 via-transparent to-amber-900/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.4),transparent)] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.4),transparent)] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.3),transparent)] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Floating chaotic dice and whimsical symbols */}
      {particles.map((particle) => {
        const IconComponent = getIcon(particle);
        return (
          <motion.div
            key={particle.id}
            className="absolute opacity-20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              x: [0, 200, -150, 100, 0],
              y: [0, -150, 200, -100, 0],
              rotate: [0, 180, 360, 540, 720],
              scale: [1, 2, 0.3, 1.6, 1],
            }}
            transition={{
              duration: 25 + Math.random() * 20,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 10,
            }}
          >
            <IconComponent 
              className={`opacity-60 drop-shadow-lg`}
              style={{
                width: `${particle.size}rem`,
                height: `${particle.size}rem`,
                color: particle.color,
                filter: `hue-rotate(${Math.random() * 360}deg) saturate(170%) brightness(1.3) drop-shadow(0 0 8px ${particle.color}40)`
              }}
            />
          </motion.div>
        );
      })}

      {/* Whimsical geometric patterns with dice-inspired shapes */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute border-2 border-purple-400/30"
            style={{
              left: `${5 + i * 6}%`,
              top: `${10 + (i % 5) * 20}%`,
              width: '4rem',
              height: '4rem',
              borderRadius: i % 4 === 0 ? '50%' : i % 4 === 1 ? '20%' : i % 4 === 2 ? '0%' : '10px',
              background: i % 3 === 0 ? 'linear-gradient(45deg, rgba(168,85,247,0.1), rgba(236,72,153,0.1))' : 'transparent',
            }}
            animate={{
              rotate: [0, 360],
              scale: [1, 1.5, 0.7, 1],
              borderRadius: i % 4 === 0 
                ? ['50%', '20%', '0%', '50%'] 
                : i % 4 === 1 
                  ? ['20%', '0%', '50%', '20%']
                  : i % 4 === 2
                    ? ['0%', '50%', '20%', '0%']
                    : ['10px', '50%', '20%', '10px'],
            }}
            transition={{
              duration: 15 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.7,
            }}
          >
            {/* Dice dot patterns inside shapes */}
            {i % 5 === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-purple-400/50 rounded-full" />
              </div>
            )}
            {i % 5 === 1 && (
              <div className="absolute inset-0">
                <div className="w-1.5 h-1.5 bg-pink-400/50 rounded-full absolute top-2 left-2" />
                <div className="w-1.5 h-1.5 bg-pink-400/50 rounded-full absolute bottom-2 right-2" />
              </div>
            )}
            {i % 5 === 2 && (
              <div className="absolute inset-0">
                <div className="w-1 h-1 bg-cyan-400/50 rounded-full absolute top-1 left-1" />
                <div className="w-1 h-1 bg-cyan-400/50 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                <div className="w-1 h-1 bg-cyan-400/50 rounded-full absolute bottom-1 right-1" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ChaoticBackground;
