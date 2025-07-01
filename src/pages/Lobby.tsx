
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Users, Plus, LogOut, Dice1, Play, Crown, Lock } from "lucide-react";
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
  is_private: boolean;
  host_username?: string;
  players?: string[];
}

const Lobby = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchRooms();
      
      // Set up real-time subscription for games
      const gameChannel = supabase
        .channel('lobby-games')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'games' },
          () => {
            console.log('Games table changed, refetching...');
            fetchRooms();
          }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'game_players' },
          () => {
            console.log('Game players table changed, refetching...');
            fetchRooms();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(gameChannel);
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
      // Fetch only public games (not private)
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .in('status', ['waiting', 'active'])
        .eq('is_private', false)
        .order('created_at', { ascending: false });

      if (gamesError) {
        console.error('Error fetching games:', gamesError);
        return;
      }

      if (!games || games.length === 0) {
        setRooms([]);
        return;
      }

      // Get unique host IDs
      const hostIds = [...new Set(games.map(g => g.host_id))];
      
      // Fetch host profiles
      const { data: hostProfiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', hostIds);

      // Fetch actual player counts for each game
      const gameIds = games.map(g => g.id);
      const { data: playerCounts } = await supabase
        .from('game_players')
        .select('game_id, player_id')
        .in('game_id', gameIds);

      const roomsWithPlayerInfo = games.map(game => {
        const actualPlayerCount = playerCounts?.filter(p => p.game_id === game.id).length || 0;
        const hostProfile = hostProfiles?.find(p => p.id === game.host_id);
        
        return {
          id: game.id,
          name: game.name,
          host_id: game.host_id,
          current_players: actualPlayerCount,
          max_players: game.max_players || 4,
          status: game.status as 'waiting' | 'active' | 'finished',
          created_at: game.created_at,
          is_private: game.is_private || false,
          host_username: hostProfile?.username || 'Unknown'
        };
      });

      setRooms(roomsWithPlayerInfo);
    } catch (error) {
      console.error('Error in fetchRooms:', error);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim() || !user) return;
    
    setLoading(true);

    try {
      // Generate game code for private games
      const gameCode = isPrivate ? Math.random().toString(36).substr(2, 8).toUpperCase() : null;

      // Create the game
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          name: newRoomName,
          host_id: user.id,
          status: 'waiting',
          current_players: 1,
          max_players: 4,
          is_private: isPrivate,
          game_code: gameCode
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
          turn_order: 0,
          is_ready: true // Host is automatically ready
        });

      if (playerError) throw playerError;

      setNewRoomName('');
      setIsPrivate(false);
      toast({
        title: "Success!",
        description: isPrivate ? 
          `Private game created! Share code: ${gameCode}` : 
          "Game room created successfully!",
      });

      navigate(`/game/${game.id}/setup`);
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
        navigate(`/game/${roomId}/setup`);
        return;
      }

      // Get current player count
      const { count } = await supabase
        .from('game_players')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', roomId);

      const playerCount = count || 0;

      // Check if game is full
      const room = rooms.find(r => r.id === roomId);
      if (playerCount >= (room?.max_players || 4)) {
        toast({
          title: "Game Full",
          description: "This game is already full",
          variant: "destructive",
        });
        return;
      }

      // Add player to the game
      const { error } = await supabase
        .from('game_players')
        .insert({
          game_id: roomId,
          player_id: user.id,
          turn_order: playerCount,
          is_ready: false
        });

      if (error) throw error;

      // Update game player count is handled by trigger, but we can update it manually for consistency
      await supabase
        .from('games')
        .update({ current_players: playerCount + 1 })
        .eq('id', roomId);

      navigate(`/game/${roomId}/setup`);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 font-quicksand">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center gap-3">
            <Dice1 className="text-purple-400 h-8 w-8" />
            <h1 className="font-bangers text-5xl text-white">DieNamic Lobby</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-purple-200 font-quicksand">Welcome, {userProfile?.username || 'Player'}!</span>
            <Button 
              onClick={() => navigate('/join-game')}
              variant="outline" 
              size="sm" 
              className="border-blue-500/50 text-blue-200 hover:bg-blue-500/20 font-quicksand"
            >
              <Users className="h-4 w-4 mr-2" />
              Join Game
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              size="sm" 
              className="border-purple-500/50 text-purple-200 hover:bg-purple-500/20 font-quicksand"
            >
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
              <CardTitle className="font-bangers text-white flex items-center gap-2 text-2xl">
                <Plus className="h-5 w-5" />
                Create New Game
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="Enter room name..."
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="bg-purple-900/30 border-purple-500/50 text-white flex-1 font-quicksand"
                    onKeyPress={(e) => e.key === 'Enter' && createRoom()}
                  />
                  <Button 
                    onClick={createRoom} 
                    className="bg-purple-600 hover:bg-purple-700 text-white font-quicksand font-semibold"
                    disabled={loading || !newRoomName.trim()}
                  >
                    {loading ? 'Creating...' : 'Create Room'}
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="private-game"
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                  />
                  <Label htmlFor="private-game" className="text-purple-200 font-quicksand flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Private Game (requires code to join)
                  </Label>
                </div>
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
                    <CardTitle className="font-bangers text-white text-xl flex items-center gap-2">
                      {room.host_id === user?.id && <Crown className="h-4 w-4 text-yellow-400" />}
                      {room.name}
                    </CardTitle>
                    <Badge className={`${getStatusColor(room.status)} text-white font-quicksand`}>
                      {room.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-purple-200 font-quicksand">
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
                    disabled={room.current_players >= room.max_players || loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-600 text-white flex items-center gap-2 font-quicksand font-semibold"
                  >
                    <Play className="h-4 w-4" />
                    {room.current_players >= room.max_players ? 'Room Full' : 'Join Setup'}
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
                <p className="text-purple-200 text-lg mb-2 font-quicksand">No public games available</p>
                <p className="text-purple-300 font-quicksand">Create a new room or join a private game with a code!</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Lobby;
