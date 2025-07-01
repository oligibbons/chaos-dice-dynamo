
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Zap, Crown, Star } from "lucide-react";

const ChaoticBackground = () => {
  const [particles, setParticles] = useState<Array<{
    id: number, 
    x: number, 
    y: number, 
    size: number, 
    color: string,
    type: 'dice' | 'chaos' | 'crown' | 'star'
  }>>([]);

  const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
  const chaosIcons = [Zap, Crown, Star];

  useEffect(() => {
    const newParticles = Array.from({ length: 25 }, (_, i) => {
      const type = Math.random() < 0.7 ? 'dice' : Math.random() < 0.8 ? 'chaos' : Math.random() < 0.9 ? 'crown' : 'star';
      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        color: ['#8B5CF6', '#EC4899', '#22D3EE', '#F59E0B', '#EF4444', '#10B981'][Math.floor(Math.random() * 6)],
        type
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
      default:
        return Dice1;
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
      {/* Swirling gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900">
        <div className="absolute inset-0 bg-gradient-to-tl from-cyan-900/30 via-transparent to-yellow-900/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.3),transparent)] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.3),transparent)] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.2),transparent)] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Floating chaotic dice and symbols */}
      {particles.map((particle) => {
        const IconComponent = getIcon(particle);
        return (
          <motion.div
            key={particle.id}
            className="absolute opacity-15"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              x: [0, 150, -100, 75, 0],
              y: [0, -120, 160, -80, 0],
              rotate: [0, 180, 360, 540, 720],
              scale: [1, 1.8, 0.3, 1.4, 1],
            }}
            transition={{
              duration: 20 + Math.random() * 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 8,
            }}
          >
            <IconComponent 
              className={`opacity-40 drop-shadow-lg`}
              style={{
                width: `${particle.size}rem`,
                height: `${particle.size}rem`,
                color: particle.color,
                filter: `hue-rotate(${Math.random() * 360}deg) saturate(150%) brightness(1.2)`
              }}
            />
          </motion.div>
        );
      })}

      {/* Whimsical geometric patterns - now with dice-dot patterns */}
      <div className="absolute inset-0">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute border border-purple-400/20"
            style={{
              left: `${5 + i * 8}%`,
              top: `${10 + (i % 4) * 25}%`,
              width: '3rem',
              height: '3rem',
              borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '15%' : '0%',
            }}
            animate={{
              rotate: [0, 360],
              scale: [1, 1.4, 0.8, 1],
              borderRadius: i % 3 === 0 
                ? ['50%', '15%', '0%', '50%'] 
                : i % 3 === 1 
                  ? ['15%', '0%', '50%', '15%']
                  : ['0%', '50%', '15%', '0%'],
            }}
            transition={{
              duration: 12 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          >
            {/* Add dice dot patterns inside some shapes */}
            {i % 4 === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-1 h-1 bg-purple-400/40 rounded-full`} />
              </div>
            )}
            {i % 4 === 1 && (
              <div className="absolute inset-0">
                <div className="w-1 h-1 bg-purple-400/40 rounded-full absolute top-1 left-1" />
                <div className="w-1 h-1 bg-purple-400/40 rounded-full absolute bottom-1 right-1" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ChaoticBackground;
