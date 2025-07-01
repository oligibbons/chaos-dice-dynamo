
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Zap, Users, Trophy, Crown, Play } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900">
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
              <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
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

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 text-lg">
                  <Play className="mr-2 h-5 w-5" />
                  Start Playing
                </Button>
              </Link>
              <Button variant="outline" className="border-purple-400 text-purple-200 hover:bg-purple-800/50 py-4 px-8 text-lg">
                Learn More
              </Button>
            </div>
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
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              >
                <DiceIcon className="h-8 w-8 text-purple-500/30" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Why Choose DieNamic?
          </h2>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Experience the perfect blend of strategy, luck, and chaos in the most exciting dice game ever created.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-400" />
                  <CardTitle className="text-white">Multiplayer Mayhem</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-purple-200">
                  Play with up to 4 players in real-time. Challenge friends or meet new opponents 
                  in our global matchmaking system.
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Zap className="h-8 w-8 text-red-400" />
                  <CardTitle className="text-white">Chaos Events</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-purple-200">
                  Unpredictable chaos events shake up gameplay! From bonus rounds to score swaps, 
                  expect the unexpected.
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Trophy className="h-8 w-8 text-yellow-400" />
                  <CardTitle className="text-white">Strategic Scoring</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-purple-200">
                  Master the art of dice combinations. From straights to full houses, 
                  every roll counts toward victory.
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Crown className="h-8 w-8 text-purple-400" />
                  <CardTitle className="text-white">Room Creation</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-purple-200">
                  Create private rooms for friends or join public matches. 
                  Customize game settings and become the game master.
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Dice3 className="h-8 w-8 text-green-400" />
                  <CardTitle className="text-white">Real-time Updates</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-purple-200">
                  Experience seamless real-time gameplay with instant updates. 
                  See every roll, every score, every chaos event as it happens.
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Dice5 className="h-8 w-8 text-orange-400" />
                  <CardTitle className="text-white">Progressive Difficulty</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-purple-200">
                  Games get more intense as rounds progress. More chaos events, 
                  higher stakes, and greater rewards await the brave.
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* How to Play Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How to Play
          </h2>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Simple to learn, impossible to master. Here's how DieNamic works.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              step: "1",
              title: "Roll the Dice",
              description: "Start each turn by rolling all 5 dice. You get up to 3 rolls per turn to achieve your desired combination.",
              icon: Dice1
            },
            {
              step: "2", 
              title: "Hold & Re-roll",
              description: "After your first roll, choose which dice to keep and which to re-roll. Strategy is key!",
              icon: Dice2
            },
            {
              step: "3",
              title: "Score Points",
              description: "Choose a scoring category based on your final dice combination. Each category can only be used once!",
              icon: Dice3
            },
            {
              step: "4",
              title: "Survive Chaos",
              description: "Random chaos events can change everything! Adapt your strategy and emerge victorious.",
              icon: Zap
            }
          ].map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm h-full text-center">
                <CardHeader>
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full w-12 h-12 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{step.step}</span>
                    </div>
                    <step.icon className="h-8 w-8 text-purple-400" />
                    <CardTitle className="text-white">{step.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-purple-200">
                    {step.description}
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
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Ready to Roll?
              </h2>
              <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
                Join thousands of players in the most exciting dice game experience. 
                Create your account and start rolling today!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/auth">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-12 text-lg">
                    <Play className="mr-2 h-5 w-5" />
                    Play Now - It's Free!
                  </Button>
                </Link>
              </div>
              <div className="flex justify-center items-center gap-4 mt-8">
                <Badge className="bg-green-600 text-white">
                  <Users className="w-4 h-4 mr-1" />
                  Online Multiplayer
                </Badge>
                <Badge className="bg-blue-600 text-white">
                  <Zap className="w-4 h-4 mr-1" />
                  Real-time Updates
                </Badge>
                <Badge className="bg-purple-600 text-white">
                  <Trophy className="w-4 h-4 mr-1" />
                  Competitive Play
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-purple-500/30 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center gap-2">
            <Dice1 className="h-6 w-6 text-purple-400" />
            <span className="text-purple-200">© 2024 DieNamic. Roll with the chaos.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
