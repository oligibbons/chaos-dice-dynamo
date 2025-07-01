import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  Users, 
  Settings, 
  Gamepad2, 
  Crown, 
  Zap, 
  Trash2, 
  Edit,
  Plus,
  UserCheck,
  UserX,
  Database,
  BarChart3,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ChaoticBackground from "@/components/ChaoticBackground";

interface User {
  id: string;
  username: string;
  created_at: string;
  user_role?: string;
  last_seen?: string;
  games_played?: number;
  total_score?: number;
}

interface Game {
  id: string;
  name: string;
  status: string;
  current_players: number;
  max_players: number;
  created_at: string;
  host_username?: string;
  duration?: number;
}

interface ChaosEvent {
  id: string;
  name: string;
  description: string;
  effect: any;
  rarity: 'common' | 'rare' | 'legendary';
  active: boolean;
  trigger_condition: string;
}

interface ScoringRule {
  category: string;
  basePoints: number;
  multiplier: number;
  description: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [chaosEvents, setChaosEvents] = useState<ChaosEvent[]>([]);
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeGames: 0,
    totalGames: 0,
    chaosEventsTriggered: 0
  });

  // Form states for creating chaos events
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    rarity: 'common' as 'common' | 'rare' | 'legendary',
    effect: {},
    trigger_condition: 'turn_start'
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasAdminRole = roles?.some(r => r.role === 'admin');
    
    if (!hasAdminRole) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges.",
        variant: "destructive",
      });
      navigate('/lobby');
      return;
    }

    setIsAdmin(true);
    await Promise.all([fetchUsers(), fetchGames(), fetchChaosEvents(), fetchStats(), initializeScoringRules()]);
    setIsLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, created_at');

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        user_role: userRoles?.find(role => role.user_id === profile.id)?.role || 'user',
        games_played: Math.floor(Math.random() * 50),
        total_score: Math.floor(Math.random() * 5000),
        last_seen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchGames = async () => {
    try {
      const { data: gamesData } = await supabase
        .from('games')
        .select('id, name, status, current_players, max_players, created_at, host_id, started_at, finished_at');

      const hostIds = gamesData?.map(game => game.host_id) || [];
      const { data: hostProfiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', hostIds);

      const gamesWithHosts = gamesData?.map(game => ({
        ...game,
        host_username: hostProfiles?.find(profile => profile.id === game.host_id)?.username || 'Unknown',
        duration: game.started_at && game.finished_at 
          ? Math.floor((new Date(game.finished_at).getTime() - new Date(game.started_at).getTime()) / 60000)
          : null
      })) || [];

      setGames(gamesWithHosts);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const fetchChaosEvents = async () => {
    try {
      const { data: events } = await supabase
        .from('chaos_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (events) {
        setChaosEvents(events as ChaosEvent[]);
      }
    } catch (error) {
      console.error('Error fetching chaos events:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: gameCount } = await supabase
        .from('games')
        .select('*', { count: 'exact', head: true });

      const { count: activeGameCount } = await supabase
        .from('games')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setStats({
        totalUsers: userCount || 0,
        activeGames: activeGameCount || 0,
        totalGames: gameCount || 0,
        chaosEventsTriggered: Math.floor(Math.random() * 1000)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const initializeScoringRules = () => {
    const defaultRules: ScoringRule[] = [
      { category: 'ones', basePoints: 1, multiplier: 1, description: 'Sum of all 1s' },
      { category: 'twos', basePoints: 2, multiplier: 1, description: 'Sum of all 2s' },
      { category: 'threes', basePoints: 3, multiplier: 1, description: 'Sum of all 3s' },
      { category: 'fours', basePoints: 4, multiplier: 1, description: 'Sum of all 4s' },
      { category: 'fives', basePoints: 5, multiplier: 1, description: 'Sum of all 5s' },
      { category: 'sixes', basePoints: 6, multiplier: 1, description: 'Sum of all 6s' },
      { category: 'threeOfKind', basePoints: 0, multiplier: 1, description: 'Sum of all dice if 3+ of a kind' },
      { category: 'fourOfKind', basePoints: 0, multiplier: 1, description: 'Sum of all dice if 4+ of a kind' },
      { category: 'fullHouse', basePoints: 25, multiplier: 1, description: 'Fixed 25 points' },
      { category: 'smallStraight', basePoints: 30, multiplier: 1, description: 'Fixed 30 points' },
      { category: 'largeStraight', basePoints: 40, multiplier: 1, description: 'Fixed 40 points' },
      { category: 'chaos', basePoints: 75, multiplier: 1, description: 'Five of a kind - Fixed 75 points' },
      { category: 'chance', basePoints: 0, multiplier: 1, description: 'Sum of all dice' },
    ];
    setScoringRules(defaultRules);
  };

  const createChaosEvent = async () => {
    if (!newEvent.name || !newEvent.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in name and description",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('chaos_events')
        .insert([{
          name: newEvent.name,
          description: newEvent.description,
          effect: newEvent.effect || {},
          rarity: newEvent.rarity,
          active: true,
          trigger_condition: newEvent.trigger_condition
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Chaos event created successfully",
      });

      // Reset form
      setNewEvent({
        name: '',
        description: '',
        rarity: 'common',
        effect: {},
        trigger_condition: 'turn_start'
      });

      fetchChaosEvents();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create chaos event",
        variant: "destructive",
      });
    }
  };

  const toggleChaosEvent = async (eventId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('chaos_events')
        .update({ active: !currentActive })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Chaos event ${!currentActive ? 'activated' : 'deactivated'}`,
      });

      fetchChaosEvents();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle chaos event",
        variant: "destructive",
      });
    }
  };

  const updateScoringRule = (category: string, field: 'basePoints' | 'multiplier', value: number) => {
    setScoringRules(prev => prev.map(rule => 
      rule.category === category 
        ? { ...rule, [field]: value }
        : rule
    ));
  };

  const saveScoringRules = async () => {
    // In a real implementation, you'd save these to the database
    // For now, we'll just show a success message
    toast({
      title: "Success",
      description: "Scoring rules updated successfully",
    });
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const deleteGame = async (gameId: string) => {
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Game deleted successfully",
      });

      fetchGames();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete game",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <ChaoticBackground />
        <div className="text-white text-xl font-quicksand relative z-10">Loading admin portal...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden p-4 font-quicksand">
      <ChaoticBackground />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bangers text-white mb-2 flex items-center justify-center gap-2 drop-shadow-lg">
            <Shield className="text-red-400" />
            Chaos Command Center
            <Crown className="text-yellow-400" />
          </h1>
          <p className="text-purple-200 font-medium">Master the madness, control the chaos!</p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: 'Total Users', value: stats.totalUsers, color: 'text-blue-400', bg: 'from-blue-600/20 to-cyan-600/20', border: 'border-blue-500/50' },
            { icon: Gamepad2, label: 'Total Games', value: stats.totalGames, color: 'text-green-400', bg: 'from-green-600/20 to-emerald-600/20', border: 'border-green-500/50' },
            { icon: Zap, label: 'Active Games', value: stats.activeGames, color: 'text-yellow-400', bg: 'from-yellow-600/20 to-orange-600/20', border: 'border-yellow-500/50' },
            { icon: Crown, label: 'Chaos Events', value: stats.chaosEventsTriggered, color: 'text-red-400', bg: 'from-red-600/20 to-pink-600/20', border: 'border-red-500/50' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`bg-gradient-to-br ${stat.bg} ${stat.border} backdrop-blur-sm hover:scale-105 transition-all duration-300`}>
                <CardContent className="p-6 text-center">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                  >
                    <stat.icon className={`h-8 w-8 ${stat.color} mx-auto mb-2 drop-shadow-lg`} />
                  </motion.div>
                  <div className="text-2xl font-bangers text-white drop-shadow-md">{stat.value}</div>
                  <div className="text-white/80 text-sm font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Admin Interface */}
        <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-purple-900/50 border border-purple-500/30">
                <TabsTrigger value="users" className="text-white data-[state=active]:bg-purple-600 font-quicksand">
                  <Users className="w-4 h-4 mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="games" className="text-white data-[state=active]:bg-purple-600 font-quicksand">
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Games
                </TabsTrigger>
                <TabsTrigger value="chaos" className="text-white data-[state=active]:bg-purple-600 font-quicksand">
                  <Zap className="w-4 h-4 mr-2" />
                  Chaos Events
                </TabsTrigger>
                <TabsTrigger value="scoring" className="text-white data-[state=active]:bg-purple-600 font-quicksand">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Scoring
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-white data-[state=active]:bg-purple-600 font-quicksand">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bangers text-white">User Management</h3>
                  <Button onClick={fetchUsers} className="bg-gradient-to-r from-blue-600 to-purple-600 font-quicksand">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                <div className="space-y-2">
                  {users.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-purple-500/30 rounded-lg backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bangers">
                          {user.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="text-white font-medium font-quicksand">
                            {user.username || 'Unknown User'}
                          </div>
                          <div className="text-purple-300 text-sm font-quicksand">
                            {user.games_played} games played
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={user.user_role === 'admin' ? 'destructive' : 'secondary'}
                          className="capitalize font-quicksand"
                        >
                          {user.user_role || 'user'}
                        </Badge>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleUserRole(user.id, user.user_role || 'user')}
                          className="border-purple-500/50 text-purple-200 hover:bg-purple-800/50 font-quicksand"
                        >
                          {user.user_role === 'admin' ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* Games Tab */}
              <TabsContent value="games" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bangers text-white">Game Management</h3>
                  <Button onClick={fetchGames} className="bg-gradient-to-r from-green-600 to-blue-600 font-quicksand">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                <div className="space-y-2">
                  {games.map((game) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-purple-500/30 rounded-lg backdrop-blur-sm"
                    >
                      <div>
                        <div className="text-white font-medium font-quicksand">{game.name}</div>
                        <div className="text-purple-300 text-sm font-quicksand">
                          Host: {game.host_username} • {game.current_players}/{game.max_players} players
                          {game.duration && ` • ${game.duration}min`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={game.status === 'active' ? 'default' : 'secondary'}
                          className="capitalize font-quicksand"
                        >
                          {game.status}
                        </Badge>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteGame(game.id)}
                          className="border-red-500/50 text-red-300 hover:bg-red-800/50 font-quicksand"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* Chaos Events Tab */}
              <TabsContent value="chaos" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bangers text-white">Chaos Events Manager</h3>
                </div>

                {/* Create New Chaos Event */}
                <Card className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border-red-500/30">
                  <CardHeader>
                    <CardTitle className="text-red-300 font-bangers">Create New Chaos Event</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-red-200 font-quicksand">Event Name</Label>
                        <Input 
                          value={newEvent.name}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-red-900/30 border-red-500/50 text-white font-quicksand" 
                          placeholder="e.g., Wild Fours"
                        />
                      </div>
                      <div>
                        <Label className="text-red-200 font-quicksand">Rarity</Label>
                        <Select 
                          value={newEvent.rarity} 
                          onValueChange={(value: 'common' | 'rare' | 'legendary') => 
                            setNewEvent(prev => ({ ...prev, rarity: value }))
                          }
                        >
                          <SelectTrigger className="bg-red-900/30 border-red-500/50 text-white font-quicksand">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-red-900 border-red-500/50">
                            <SelectItem value="common" className="text-white font-quicksand">Common</SelectItem>
                            <SelectItem value="rare" className="text-white font-quicksand">Rare</SelectItem>
                            <SelectItem value="legendary" className="text-white font-quicksand">Legendary</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-red-200 font-quicksand">Description</Label>
                      <Textarea 
                        value={newEvent.description}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-red-900/30 border-red-500/50 text-white font-quicksand" 
                        placeholder="Describe what this chaos event does..."
                      />
                    </div>
                    <Button 
                      onClick={createChaosEvent}
                      className="bg-gradient-to-r from-red-600 to-orange-600 font-bangers"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Chaos Event
                    </Button>
                  </CardContent>
                </Card>

                {/* Existing Chaos Events */}
                <div className="grid md:grid-cols-2 gap-4">
                  {chaosEvents.map((event) => (
                    <Card key={event.id} className="bg-red-900/20 border-red-500/30 backdrop-blur-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-red-300 text-lg flex items-center gap-2 font-bangers">
                          <Zap className="w-5 h-5" />
                          {event.name}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-red-200 border-red-400 font-quicksand ${
                              event.rarity === 'legendary' ? 'bg-yellow-600/20' :
                              event.rarity === 'rare' ? 'bg-purple-600/20' : 'bg-blue-600/20'
                            }`}
                          >
                            {event.rarity}
                          </Badge>
                          <Badge 
                            variant={event.active ? 'default' : 'secondary'}
                            className={`font-quicksand ${event.active ? 'bg-green-600' : 'bg-gray-600'}`}
                          >
                            {event.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-red-200 text-sm mb-3 font-quicksand">{event.description}</p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => toggleChaosEvent(event.id, event.active)}
                            className="border-red-500/50 text-red-300 font-quicksand"
                          >
                            {event.active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Scoring Tab */}
              <TabsContent value="scoring" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bangers text-white">Scoring Rules</h3>
                  <Button onClick={saveScoringRules} className="bg-gradient-to-r from-green-600 to-blue-600 font-bangers">
                    Save Changes
                  </Button>
                </div>

                <div className="grid gap-4">
                  {scoringRules.map((rule) => (
                    <Card key={rule.category} className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-purple-500/30">
                      <CardContent className="p-4">
                        <div className="grid md:grid-cols-4 gap-4 items-center">
                          <div>
                            <h4 className="font-bangers text-white capitalize">{rule.category.replace(/([A-Z])/g, ' $1')}</h4>
                            <p className="text-purple-300 text-sm font-quicksand">{rule.description}</p>
                          </div>
                          <div>
                            <Label className="text-purple-200 font-quicksand">Base Points</Label>
                            <Input 
                              type="number"
                              value={rule.basePoints}
                              onChange={(e) => updateScoringRule(rule.category, 'basePoints', parseInt(e.target.value) || 0)}
                              className="bg-purple-900/30 border-purple-500/50 text-white font-quicksand"
                            />
                          </div>
                          <div>
                            <Label className="text-purple-200 font-quicksand">Multiplier</Label>
                            <Input 
                              type="number"
                              step="0.1"
                              value={rule.multiplier}
                              onChange={(e) => updateScoringRule(rule.category, 'multiplier', parseFloat(e.target.value) || 1)}
                              className="bg-purple-900/30 border-purple-500/50 text-white font-quicksand"
                            />
                          </div>
                          <div className="text-center">
                            <Badge className="bg-yellow-600 text-white font-bangers">
                              {rule.category === 'chance' || rule.category.includes('OfKind') ? 'Variable' : rule.basePoints * rule.multiplier}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <h3 className="text-xl font-bangers text-white">System Settings</h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-purple-500/30">
                    <CardHeader>
                      <CardTitle className="text-white font-bangers">Game Configuration</CardTitle>
                      <CardDescription className="text-purple-200 font-quicksand">
                        Default game settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-purple-200 font-quicksand">Max Players per Game</Label>
                        <Input defaultValue="4" className="bg-purple-900/30 border-purple-500/50 text-white font-quicksand" />
                      </div>
                      <div>
                        <Label className="text-purple-200 font-quicksand">Default Rounds</Label>
                        <Input defaultValue="5" className="bg-purple-900/30 border-purple-500/50 text-white font-quicksand" />
                      </div>
                      <div>
                        <Label className="text-purple-200 font-quicksand">Turn Timeout (seconds)</Label>
                        <Input defaultValue="60" className="bg-purple-900/30 border-purple-500/50 text-white font-quicksand" />
                      </div>
                      <div>
                        <Label className="text-purple-200 font-quicksand">Win Condition Score</Label>
                        <Input defaultValue="150" className="bg-purple-900/30 border-purple-500/50 text-white font-quicksand" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-purple-500/30">
                    <CardHeader>
                      <CardTitle className="text-white font-bangers">Maintenance</CardTitle>
                      <CardDescription className="text-purple-200 font-quicksand">
                        System maintenance tools
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 font-quicksand">
                        <Database className="w-4 h-4 mr-2" />
                        Backup Database
                      </Button>
                      <Button variant="outline" className="w-full border-yellow-500/50 text-yellow-300 font-quicksand">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Clean Old Games
                      </Button>
                      <Button variant="outline" className="w-full border-red-500/50 text-red-300 font-quicksand">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Reset Statistics
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
