
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Database
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  username: string;
  created_at: string;
  user_role?: string;
}

interface Game {
  id: string;
  name: string;
  status: string;
  current_players: number;
  max_players: number;
  created_at: string;
  host_username?: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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
    await Promise.all([fetchUsers(), fetchGames()]);
    setIsLoading(false);
  };

  const fetchUsers = async () => {
    // First get profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, created_at');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }

    // Then get user roles separately
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      return;
    }

    // Combine the data
    const usersWithRoles = profiles?.map(profile => ({
      ...profile,
      user_role: userRoles?.find(role => role.user_id === profile.id)?.role || 'user'
    })) || [];

    setUsers(usersWithRoles);
  };

  const fetchGames = async () => {
    // Get games with host profile info
    const { data: gamesData, error: gamesError } = await supabase
      .from('games')
      .select('id, name, status, current_players, max_players, created_at, host_id');

    if (gamesError) {
      console.error('Error fetching games:', gamesError);
      return;
    }

    // Get host usernames separately
    const hostIds = gamesData?.map(game => game.host_id) || [];
    const { data: hostProfiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', hostIds);

    // Combine the data
    const gamesWithHosts = gamesData?.map(game => ({
      ...game,
      host_username: hostProfiles?.find(profile => profile.id === game.host_id)?.username || 'Unknown'
    })) || [];

    setGames(gamesWithHosts);
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `User role updated to ${newRole}`,
    });

    fetchUsers();
  };

  const deleteGame = async (gameId: string) => {
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', gameId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete game",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Game deleted successfully",
    });

    fetchGames();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Shield className="text-red-400" />
            Admin Control Panel
            <Crown className="text-yellow-400" />
          </h1>
          <p className="text-purple-200">Manage users, games, and chaos events</p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{users.length}</div>
                <div className="text-purple-200 text-sm">Total Users</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Gamepad2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{games.length}</div>
                <div className="text-purple-200 text-sm">Total Games</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {games.filter(g => g.status === 'active').length}
                </div>
                <div className="text-purple-200 text-sm">Active Games</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Crown className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {users.filter(u => u.user_role === 'admin').length}
                </div>
                <div className="text-purple-200 text-sm">Admins</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Admin Interface */}
        <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-purple-900/50 border border-purple-500/30">
                <TabsTrigger value="users" className="text-white data-[state=active]:bg-purple-600">
                  <Users className="w-4 h-4 mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="games" className="text-white data-[state=active]:bg-purple-600">
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Games
                </TabsTrigger>
                <TabsTrigger value="chaos" className="text-white data-[state=active]:bg-purple-600">
                  <Zap className="w-4 h-4 mr-2" />
                  Chaos Events
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-white data-[state=active]:bg-purple-600">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-white">User Management</h3>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>

                <div className="space-y-2">
                  {users.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                          {user.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {user.username || 'Unknown User'}
                          </div>
                          <div className="text-purple-300 text-sm">ID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={user.user_role === 'admin' ? 'destructive' : 'secondary'}
                          className="capitalize"
                        >
                          {user.user_role || 'user'}
                        </Badge>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleUserRole(user.id, user.user_role || 'user')}
                          className="border-purple-500/50 text-purple-200 hover:bg-purple-800/50"
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
                  <h3 className="text-xl font-semibold text-white">Game Management</h3>
                </div>

                <div className="space-y-2">
                  {games.map((game) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg"
                    >
                      <div>
                        <div className="text-white font-medium">{game.name}</div>
                        <div className="text-purple-300 text-sm">
                          Host: {game.host_username} • {game.current_players}/{game.max_players} players
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={game.status === 'active' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {game.status}
                        </Badge>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteGame(game.id)}
                          className="border-red-500/50 text-red-300 hover:bg-red-800/50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* Chaos Events Tab */}
              <TabsContent value="chaos" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-white">Chaos Events Manager</h3>
                  <Button className="bg-gradient-to-r from-red-600 to-orange-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Chaos Event
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Sample chaos events */}
                  {[
                    { name: "Wild Fours", description: "All 4s count as wild cards", type: "Face Mutation" },
                    { name: "Locked Dice", description: "Must keep 2 dice after first roll", type: "Reroll Restriction" },
                    { name: "Bonus Straight", description: "Extra 20 points for straights", type: "Scoring Adjustment" },
                    { name: "Dice Swap", description: "Swap dice with other players", type: "Interaction" },
                  ].map((event, index) => (
                    <Card key={index} className="bg-red-900/20 border-red-500/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-red-300 text-lg flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          {event.name}
                        </CardTitle>
                        <Badge variant="outline" className="w-fit text-red-200 border-red-400">
                          {event.type}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-red-200 text-sm mb-3">{event.description}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-red-500/50 text-red-300">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-500/50 text-red-300">
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <h3 className="text-xl font-semibold text-white">System Settings</h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-purple-900/20 border-purple-500/30">
                    <CardHeader>
                      <CardTitle className="text-white">Game Configuration</CardTitle>
                      <CardDescription className="text-purple-200">
                        Default game settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-purple-200">Max Players per Game</Label>
                        <Input defaultValue="4" className="bg-purple-900/30 border-purple-500/50 text-white" />
                      </div>
                      <div>
                        <Label className="text-purple-200">Default Rounds</Label>
                        <Input defaultValue="7" className="bg-purple-900/30 border-purple-500/50 text-white" />
                      </div>
                      <div>
                        <Label className="text-purple-200">Turn Timeout (seconds)</Label>
                        <Input defaultValue="120" className="bg-purple-900/30 border-purple-500/50 text-white" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-900/20 border-purple-500/30">
                    <CardHeader>
                      <CardTitle className="text-white">Database Actions</CardTitle>
                      <CardDescription className="text-purple-200">
                        Maintenance and cleanup
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                        <Database className="w-4 h-4 mr-2" />
                        Backup Database
                      </Button>
                      <Button variant="outline" className="w-full border-yellow-500/50 text-yellow-300">
                        Clean Old Games
                      </Button>
                      <Button variant="outline" className="w-full border-red-500/50 text-red-300">
                        Reset All Scores
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
