
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, LogOut, Dice1, Play, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface GameRoom {
  id: string;
  name: string;
  host_id: string;
  current_players: number;
  max_players: number;
  status: 'waiting' | 'active' | 'finished';
  created_at: string;
  host_username?: string;
  players?: string[];
}

const Lobby = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchRooms();
      
      // Set up real-time subscription for games
      const channel = supabase
        .channel('lobby-games')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'games' },
          () => fetchRooms()
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'game_players' },
          () => fetchRooms()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setUserProfile(data);
  };

  const fetchRooms = async () => {
    try {
      // Fetch games with host information
      const { data: games, error } = await supabase
        .from('games')
        .select(`
          *,
          profiles!games_host_id_fkey(username)
        `)
        .in('status', ['waiting', 'active'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching games:', error);
        return;
      }

      // Fetch player counts for each game
      const gameIds = games?.map(g => g.id) || [];
      const { data: playerCounts } = await supabase
        .from('game_players')
        .select('game_id, player_id')
        .in('game_id', gameIds);

      const roomsWithPlayerInfo = games?.map(game => {
        const playerCount = playerCounts?.filter(p => p.game_id === game.id).length || 0;
        return {
          id: game.id,
          name: game.name,
          host_id: game.host_id,
          current_players: playerCount,
          max_players: game.max_players || 4,
          status: game.status as 'waiting' | 'active' | 'finished',
          created_at: game.created_at,
          host_username: game.profiles?.username || 'Unknown'
        };
      }) || [];

      setRooms(roomsWithPlayerInfo);
    } catch (error) {
      console.error('Error in fetchRooms:', error);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim() || !user) return;
    
    setLoading(true);

    try {
      // Create the game
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          name: newRoomName,
          host_id: user.id,
          status: 'waiting',
          current_players: 1,
          max_players: 4
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Add the host as the first player
      const { error: playerError } = await supabase
        .from('game_players')
        .insert({
          game_id: game.id,
          player_id: user.id,
          turn_order: 0
        });

      if (playerError) throw playerError;

      setNewRoomName('');
      toast({
        title: "Success!",
        description: "Game room created successfully!",
      });

      navigate(`/game/${game.id}`);
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create room",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!user) return;

    setLoading(true);

    try {
      // Check if user is already in the game
      const { data: existingPlayer } = await supabase
        .from('game_players')
        .select('id')
        .eq('game_id', roomId)
        .eq('player_id', user.id)
        .single();

      if (existingPlayer) {
        // User is already in the game, just navigate
        navigate(`/game/${roomId}`);
        return;
      }

      // Get current player count
      const { count } = await supabase
        .from('game_players')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', roomId);

      const playerCount = count || 0;

      // Add player to the game
      const { error } = await supabase
        .from('game_players')
        .insert({
          game_id: roomId,
          player_id: user.id,
          turn_order: playerCount
        });

      if (error) throw error;

      // Update game player count
      await supabase
        .from('games')
        .update({ current_players: playerCount + 1 })
        .eq('id', roomId);

      navigate(`/game/${roomId}`);
    } catch (error: any) {
      console.error('Error joining room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join room",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-green-600';
      case 'active': return 'bg-yellow-600';
      case 'finished': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center gap-3">
            <Dice1 className="text-purple-400 h-8 w-8" />
            <h1 className="text-3xl font-bold text-white">DieNamic Lobby</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-purple-200">Welcome, {userProfile?.username || 'Player'}!</span>
            <Button onClick={handleLogout} variant="outline" size="sm" className="border-purple-500/50 text-purple-200">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </motion.div>

        {/* Create Room */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6 bg-black/50 border-purple-500/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Game
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Enter room name..."
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="bg-purple-900/30 border-purple-500/50 text-white flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && createRoom()}
                />
                <Button 
                  onClick={createRoom} 
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={loading || !newRoomName.trim()}
                >
                  {loading ? 'Creating...' : 'Create Room'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Game Rooms */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card className="bg-black/50 border-purple-500/30 backdrop-blur-sm hover:border-purple-400/50 transition-all hover:scale-105">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      {room.host_id === user?.id && <Crown className="h-4 w-4 text-yellow-400" />}
                      {room.name}
                    </CardTitle>
                    <Badge className={`${getStatusColor(room.status)} text-white`}>
                      {room.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-purple-200">
                    Host: {room.host_username} • {room.current_players}/{room.max_players} players
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-4 w-4 text-purple-400" />
                    <div className="flex-1 bg-purple-900/30 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${(room.current_players / room.max_players) * 100}%` }}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => joinRoom(room.id)}
                    disabled={room.current_players >= room.max_players || room.status !== 'waiting' || loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    {room.status === 'active' ? 'Join Game' : room.current_players >= room.max_players ? 'Room Full' : 'Join Game'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {rooms.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-black/30 border-purple-500/30 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <Dice1 className="h-16 w-16 text-purple-400 mx-auto mb-4 opacity-50" />
                <p className="text-purple-200 text-lg mb-2">No games available</p>
                <p className="text-purple-300">Create a new room to start playing!</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Lobby;
