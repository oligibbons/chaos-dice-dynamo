
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dice1, Dice2, Dice3, Users, Trophy, Zap, Sparkles, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string>('user');

  useEffect(() => {
    checkAuthStatus();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        setUserRole(roles?.role || 'user');
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        setUserRole('user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      
      setUserRole(roles?.role || 'user');
      setIsLoggedIn(true);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserRole('user');
  };

  const floatingDice = [Dice1, Dice2, Dice3];

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-white/10"
              initial={{ 
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                rotate: 0
              }}
              animate={{ 
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                rotate: 360
              }}
              transition={{ 
                duration: 15 + Math.random() * 10,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {React.createElement(floatingDice[i % floatingDice.length], { size: 30 + Math.random() * 30 })}
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-md w-full"
          >
            <Card className="bg-black/50 border-2 border-purple-500/50 backdrop-blur-xl shadow-2xl shadow-purple-500/20">
              <CardHeader className="text-center">
                <motion.div
                  animate={{ rotateY: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="mx-auto mb-4"
                >
                  <Crown className="h-16 w-16 text-yellow-400 drop-shadow-lg" />
                </motion.div>
                
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent flex items-center justify-center gap-2">
                  <Dice1 className="text-purple-400" />
                  DieNamic
                  <Dice2 className="text-blue-400" />
                </CardTitle>
                
                <CardDescription className="text-purple-200 text-lg">
                  Welcome back, Champion!
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    onClick={() => navigate('/lobby')} 
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 text-lg shadow-lg"
                  >
                    <Zap className="mr-2" />
                    Enter Game Lobby
                  </Button>
                </motion.div>
                
                {userRole === 'admin' && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      onClick={() => navigate('/admin')} 
                      className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-3 text-lg shadow-lg"
                    >
                      <Crown className="mr-2" />
                      Admin Panel
                    </Button>
                  </motion.div>
                )}
                
                <Button 
                  onClick={handleLogout} 
                  variant="outline" 
                  className="w-full border-purple-500/50 text-purple-200 hover:bg-purple-900/50"
                >
                  Logout
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-white/10"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              rotate: 0
            }}
            animate={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              rotate: 360
            }}
            transition={{ 
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {React.createElement(floatingDice[i % floatingDice.length], { size: 40 + Math.random() * 40 })}
          </motion.div>
        ))}
        
        {/* Sparkle Effects */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute text-yellow-400/20"
            initial={{ 
              scale: 0,
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight
            }}
            animate={{ 
              scale: [0, 1, 0],
              rotate: 360
            }}
            transition={{ 
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          >
            <Sparkles size={12} />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center mb-8"
          >
            <h1 className="text-6xl font-bold text-white mb-4 flex items-center justify-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Dice1 className="text-purple-400" />
              </motion.div>
              
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                DieNamic
              </span>
              
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Dice2 className="text-blue-400" />
              </motion.div>
            </h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xl text-purple-200 mb-2"
            >
              The Game of Whimsical Wagers
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-purple-300 max-w-2xl mx-auto"
            >
              A turn-based online dice game where chaos meets strategy. Roll dice, score points, 
              but beware - the rules change every round!
            </motion.p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="grid md:grid-cols-3 gap-6 mb-8"
          >
            {[
              { Icon: Users, title: "Multiplayer Mayhem", desc: "2-4 players battle in real-time chaos", color: "purple" },
              { Icon: Zap, title: "Chaos Events", desc: "Dynamic rules that change every round", color: "blue" },
              { Icon: Trophy, title: "Strategic Scoring", desc: "Easy to learn, impossible to master", color: "indigo" }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Card className={`bg-black/30 border-${feature.color}-500/30 backdrop-blur-sm hover:bg-black/40 transition-all cursor-pointer`}>
                  <CardContent className="p-6 text-center">
                    <feature.Icon className={`h-12 w-12 text-${feature.color}-400 mx-auto mb-4`} />
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className={`text-${feature.color}-200 text-sm`}>{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="text-center"
          >
            <Card className="bg-black/50 border-2 border-purple-500/50 backdrop-blur-xl shadow-2xl shadow-purple-500/20 max-w-md mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white">Ready to Roll?</CardTitle>
                <CardDescription className="text-purple-200">
                  Join the chaos and start your DieNamic adventure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => navigate('/auth')}
                    className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-700 hover:via-pink-700 hover:to-cyan-700 text-white font-bold py-3 text-lg shadow-lg"
                  >
                    <Sparkles className="mr-2" />
                    Start Playing Now
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Index;
