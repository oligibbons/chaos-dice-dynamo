
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Zap, Users, Trophy, Crown, Play, Settings, UserPlus, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";
import ChaoticBackground from "@/components/ChaoticBackground";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen font-quicksand relative overflow-hidden">
      <ChaoticBackground />
      
      {/* Hero Section */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex justify-center items-center mb-8">
              <Logo size="lg" />
            </div>
            
            <motion.p 
              className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto font-medium drop-shadow-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Enter the ultimate chaotic dice experience where reality bends, rules twist, 
              and every roll is a leap into delightful madness! 🎲✨
            </motion.p>

            {user ? (
              <motion.div 
                className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <motion.div whileHover={{ scale: 1.05, rotate: 2 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/lobby">
                    <Card className="bg-gradient-to-br from-green-600/30 to-emerald-600/30 border-green-400/60 backdrop-blur-sm cursor-pointer h-full hover:shadow-2xl hover:shadow-green-400/20 transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <motion.div
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Play className="h-12 w-12 text-green-300 mx-auto mb-4 drop-shadow-lg" />
                        </motion.div>
                        <h3 className="font-bangers text-2xl text-white mb-2 drop-shadow-md">DIVE IN!</h3>
                        <p className="text-green-200 text-sm font-medium">Join the chaos now</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05, rotate: -2 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/friends">
                    <Card className="bg-gradient-to-br from-blue-600/30 to-cyan-600/30 border-blue-400/60 backdrop-blur-sm cursor-pointer h-full hover:shadow-2xl hover:shadow-blue-400/20 transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <UserPlus className="h-12 w-12 text-blue-300 mx-auto mb-4 drop-shadow-lg" />
                        </motion.div>
                        <h3 className="font-bangers text-2xl text-white mb-2 drop-shadow-md">ALLIES</h3>
                        <p className="text-blue-200 text-sm font-medium">Gather your crew</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05, rotate: 2 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/leaderboard">
                    <Card className="bg-gradient-to-br from-yellow-600/30 to-orange-600/30 border-yellow-400/60 backdrop-blur-sm cursor-pointer h-full hover:shadow-2xl hover:shadow-yellow-400/20 transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <Trophy className="h-12 w-12 text-yellow-300 mx-auto mb-4 drop-shadow-lg" />
                        </motion.div>
                        <h3 className="font-bangers text-2xl text-white mb-2 drop-shadow-md">GLORY</h3>
                        <p className="text-yellow-200 text-sm font-medium">Claim your throne</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05, rotate: -2 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/settings">
                    <Card className="bg-gradient-to-br from-purple-600/30 to-violet-600/30 border-purple-400/60 backdrop-blur-sm cursor-pointer h-full hover:shadow-2xl hover:shadow-purple-400/20 transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <motion.div
                          animate={{ rotate: [0, 180, 360] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Settings className="h-12 w-12 text-purple-300 mx-auto mb-4 drop-shadow-lg" />
                        </motion.div>
                        <h3 className="font-bangers text-2xl text-white mb-2 drop-shadow-md">TWEAK</h3>
                        <p className="text-purple-200 text-sm font-medium">Customize madness</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <Link to="/auth">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bangers py-4 px-8 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-purple-400/50">
                      <Play className="mr-2 h-5 w-5" />
                      Enter the Madness
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            )}
          </motion.div>

          {/* Floating Dice Animation - More Chaotic */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[Dice1, Dice2, Dice3, Dice4, Dice5, Dice6].map((DiceIcon, index) => (
              <motion.div
                key={index}
                className="absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 20, -10, 0],
                  x: [0, 15, -10, 5, 0],
                  rotate: [0, 180, 360, 540, 720],
                  opacity: [0.1, 0.4, 0.2, 0.6, 0.1],
                  scale: [0.5, 1.2, 0.8, 1.5, 0.5],
                }}
                transition={{
                  duration: 6 + Math.random() * 4,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: "easeInOut",
                }}
              >
                <DiceIcon 
                  className="h-8 w-8 text-purple-400/30 drop-shadow-lg" 
                  style={{
                    filter: `hue-rotate(${index * 60}deg) saturate(200%)`
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section - Only show if not logged in */}
      {!user && (
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bangers text-white mb-4 drop-shadow-lg">
              Why Choose Chaos?
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto font-medium">
              Dive into a world where every roll rewrites reality and chaos reigns supreme! 🌀
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Multiplayer Mayhem",
                description: "Battle up to 4 players in real-time madness. Challenge friends or discover new rivals in our chaotic matchmaking!",
                color: "text-blue-400",
                gradient: "from-blue-600/20 to-cyan-600/20",
                border: "border-blue-500/50"
              },
              {
                icon: Zap,
                title: "Reality-Bending Events",
                description: "Experience dice that transform, rules that flip, and reality that bends with every unpredictable chaos event!",
                color: "text-red-400",
                gradient: "from-red-600/20 to-orange-600/20",
                border: "border-red-500/50"
              },
              {
                icon: Trophy,
                title: "Strategic Chaos",
                description: "Master the art of controlled chaos. Adapt your strategy as the rules shift beneath your feet!",
                color: "text-yellow-400",
                gradient: "from-yellow-600/20 to-orange-600/20",
                border: "border-yellow-500/50"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, rotate: index % 2 === 0 ? 1 : -1 }}
              >
                <Card className={`bg-gradient-to-br ${feature.gradient} ${feature.border} backdrop-blur-sm h-full hover:shadow-2xl transition-all duration-300`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                      >
                        <feature.icon className={`h-8 w-8 ${feature.color} drop-shadow-lg`} />
                      </motion.div>
                      <CardTitle className="text-white font-bangers drop-shadow-md">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-white/80 font-quicksand font-medium">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-purple-500/30 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Dice1 className="h-6 w-6 text-purple-400" />
            </motion.div>
            <span className="text-white/80 font-quicksand font-medium drop-shadow-md">
              © 2024 DieNamic. Where chaos meets fun! 🎲✨
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
