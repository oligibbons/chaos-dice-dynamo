
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Zap, Users, Trophy, Crown, Play, Settings, UserPlus, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 font-quicksand">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex justify-center items-center gap-4 mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Dice1 className="h-16 w-16 text-purple-400" />
              </motion.div>
              <h1 className="text-6xl md:text-8xl font-bangers text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                DieNamic
              </h1>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              >
                <Dice6 className="h-16 w-16 text-pink-400" />
              </motion.div>
            </div>
            
            <p className="text-xl md:text-2xl text-purple-200 mb-8 max-w-3xl mx-auto">
              The ultimate multiplayer chaos dice game where strategy meets randomness. 
              Roll, score, and survive the chaos events in this thrilling online experience!
            </p>

            {user ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/lobby">
                    <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/50 backdrop-blur-sm cursor-pointer h-full">
                      <CardContent className="p-6 text-center">
                        <Play className="h-12 w-12 text-green-400 mx-auto mb-4" />
                        <h3 className="font-bangers text-2xl text-white mb-2">PLAY NOW</h3>
                        <p className="text-green-200 text-sm">Join or create games</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/friends">
                    <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/50 backdrop-blur-sm cursor-pointer h-full">
                      <CardContent className="p-6 text-center">
                        <UserPlus className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                        <h3 className="font-bangers text-2xl text-white mb-2">FRIENDS</h3>
                        <p className="text-blue-200 text-sm">Connect with players</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/leaderboard">
                    <Card className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/50 backdrop-blur-sm cursor-pointer h-full">
                      <CardContent className="p-6 text-center">
                        <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                        <h3 className="font-bangers text-2xl text-white mb-2">RANKINGS</h3>
                        <p className="text-yellow-200 text-sm">View leaderboards</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/settings">
                    <Card className="bg-gradient-to-br from-purple-600/20 to-violet-600/20 border-purple-500/50 backdrop-blur-sm cursor-pointer h-full">
                      <CardContent className="p-6 text-center">
                        <Settings className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                        <h3 className="font-bangers text-2xl text-white mb-2">SETTINGS</h3>
                        <p className="text-purple-200 text-sm">Customize your game</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/auth">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bangers py-4 px-8 text-lg">
                    <Play className="mr-2 h-5 w-5" />
                    Start Playing
                  </Button>
                </Link>
                <Button variant="outline" className="border-purple-400 text-purple-200 hover:bg-purple-800/50 py-4 px-8 text-lg font-quicksand">
                  Learn More
                </Button>
              </div>
            )}
          </motion.div>

          {/* Floating Dice Animation */}
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
                  y: [0, -20, 0],
                  rotate: [0, 180, 360],
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              >
                <DiceIcon className="h-8 w-8 text-purple-500/20" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {user && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Gamepad2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bangers text-white">12</div>
                <div className="text-purple-200 text-sm font-quicksand">Games Played</div>
              </CardContent>
            </Card>
            <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bangers text-white">8</div>
                <div className="text-purple-200 text-sm font-quicksand">Wins</div>
              </CardContent>
            </Card>
            <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Zap className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <div className="text-2xl font-bangers text-white">47</div>
                <div className="text-purple-200 text-sm font-quicksand">Chaos Events</div>
              </CardContent>
            </Card>
            <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Crown className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bangers text-white">1,247</div>
                <div className="text-purple-200 text-sm font-quicksand">High Score</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Features Section - Only show if not logged in */}
      {!user && (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bangers text-white mb-4">
                Why Choose DieNamic?
              </h2>
              <p className="text-xl text-purple-200 max-w-2xl mx-auto">
                Experience the perfect blend of strategy, luck, and chaos in the most exciting dice game ever created.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Users,
                  title: "Multiplayer Mayhem",
                  description: "Play with up to 4 players in real-time. Challenge friends or meet new opponents in our global matchmaking system.",
                  color: "text-blue-400"
                },
                {
                  icon: Zap,
                  title: "Chaos Events",
                  description: "Unpredictable chaos events shake up gameplay! From bonus rounds to score swaps, expect the unexpected.",
                  color: "text-red-400"
                },
                {
                  icon: Trophy,
                  title: "Strategic Scoring",
                  description: "Master the art of dice combinations. From straights to full houses, every roll counts toward victory.",
                  color: "text-yellow-400"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                >
                  <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm h-full">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <feature.icon className={`h-8 w-8 ${feature.color}`} />
                        <CardTitle className="text-white font-bangers">{feature.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-purple-200 font-quicksand">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <Card className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 border-purple-500/50 backdrop-blur-sm">
                <CardContent className="py-16">
                  <h2 className="text-4xl md:text-5xl font-bangers text-white mb-4">
                    Ready to Roll?
                  </h2>
                  <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
                    Join thousands of players in the most exciting dice game experience. 
                    Create your account and start rolling today!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link to="/auth">
                      <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bangers py-4 px-12 text-lg">
                        <Play className="mr-2 h-5 w-5" />
                        Play Now - It's Free!
                      </Button>
                    </Link>
                  </div>
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <Badge className="bg-green-600 text-white font-quicksand">
                      <Users className="w-4 h-4 mr-1" />
                      Online Multiplayer
                    </Badge>
                    <Badge className="bg-blue-600 text-white font-quicksand">
                      <Zap className="w-4 h-4 mr-1" />
                      Real-time Updates
                    </Badge>
                    <Badge className="bg-purple-600 text-white font-quicksand">
                      <Trophy className="w-4 h-4 mr-1" />
                      Competitive Play
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-purple-500/30 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center gap-2">
            <Dice1 className="h-6 w-6 text-purple-400" />
            <span className="text-purple-200 font-quicksand">© 2024 DieNamic. Roll with the chaos.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
