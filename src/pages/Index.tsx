
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dice1, Dice2, Dice3, Users, Trophy, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('dienamic_user');
    if (user) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      const userData = { username, isAdmin: username === 'admin' };
      localStorage.setItem('dienamic_user', JSON.stringify(userData));
      setIsLoggedIn(true);
      if (userData.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/lobby');
      }
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && email && password) {
      const userData = { username, email, isAdmin: false };
      localStorage.setItem('dienamic_user', JSON.stringify(userData));
      setIsLoggedIn(true);
      navigate('/lobby');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dienamic_user');
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setEmail('');
  };

  if (isLoggedIn) {
    const user = JSON.parse(localStorage.getItem('dienamic_user') || '{}');
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/50 border-purple-500/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white flex items-center justify-center gap-2">
              <Dice1 className="text-purple-400" />
              DieNamic
              <Dice2 className="text-blue-400" />
            </CardTitle>
            <CardDescription className="text-purple-200">
              Welcome back, {user.username}!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => navigate(user.isAdmin ? '/admin' : '/lobby')} 
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {user.isAdmin ? 'Go to Admin Panel' : 'Enter Game Lobby'}
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="w-full border-purple-500/50 text-purple-200 hover:bg-purple-900/50"
            >
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4 flex items-center justify-center gap-4">
            <Dice1 className="text-purple-400 animate-pulse" />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              DieNamic
            </span>
            <Dice2 className="text-blue-400 animate-pulse" />
          </h1>
          <p className="text-xl text-purple-200 mb-2">The Game of Whimsical Wagers</p>
          <p className="text-purple-300 max-w-2xl mx-auto">
            A turn-based online dice game where chaos meets strategy. Roll dice, score points, 
            but beware - the rules change every round!
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-black/30 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Multiplayer Mayhem</h3>
              <p className="text-purple-200 text-sm">2-4 players battle in real-time chaos</p>
            </CardContent>
          </Card>
          
          <Card className="bg-black/30 border-blue-500/30 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Zap className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Chaos Events</h3>
              <p className="text-blue-200 text-sm">Dynamic rules that change every round</p>
            </CardContent>
          </Card>
          
          <Card className="bg-black/30 border-indigo-500/30 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Trophy className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Strategic Scoring</h3>
              <p className="text-indigo-200 text-sm">Easy to learn, impossible to master</p>
            </CardContent>
          </Card>
        </div>

        {/* Login/Register */}
        <Card className="bg-black/50 border-purple-500/50 backdrop-blur-sm max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">Join the Chaos</CardTitle>
            <CardDescription className="text-purple-200">
              Login or create an account to start playing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-purple-900/50">
                <TabsTrigger value="login" className="text-white data-[state=active]:bg-purple-600">Login</TabsTrigger>
                <TabsTrigger value="register" className="text-white data-[state=active]:bg-purple-600">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="username" className="text-purple-200">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-purple-900/30 border-purple-500/50 text-white"
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-purple-200">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-purple-900/30 border-purple-500/50 text-white"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                    Login
                  </Button>
                  <p className="text-xs text-purple-300 text-center">
                    Tip: Use "admin" as username for admin access
                  </p>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="reg-username" className="text-purple-200">Username</Label>
                    <Input
                      id="reg-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-purple-900/30 border-purple-500/50 text-white"
                      placeholder="Choose a username"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-purple-200">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-purple-900/30 border-purple-500/50 text-white"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-password" className="text-purple-200">Password</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-purple-900/30 border-purple-500/50 text-white"
                      placeholder="Create a password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                    Register
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
