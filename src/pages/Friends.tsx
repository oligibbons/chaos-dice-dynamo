
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserPlus, MessageSquare, Gamepad2, Search, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface Friend {
  id: string;
  username: string;
  status: 'online' | 'offline' | 'in-game';
  last_seen?: string;
}

const Friends = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchFriends();
    }
  }, [user]);

  const fetchFriends = async () => {
    try {
      // For now, we'll simulate friends data since we don't have a friends table yet
      // In a real implementation, you'd fetch from a friends table
      const mockFriends: Friend[] = [
        { id: '1', username: 'ChaosMaster', status: 'online' },
        { id: '2', username: 'DiceWizard', status: 'in-game' },
        { id: '3', username: 'LuckyRoller', status: 'offline', last_seen: '2 hours ago' },
      ];
      setFriends(mockFriends);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', user?.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: any) {
      console.error('Error searching users:', error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async (friendId: string, username: string) => {
    try {
      // In a real implementation, you'd add to a friends table
      toast({
        title: "Friend Request Sent!",
        description: `Friend request sent to ${username}`,
      });
      setSearchQuery('');
      setSearchResults([]);
    } catch (error: any) {
      console.error('Error adding friend:', error);
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-600';
      case 'in-game': return 'bg-blue-600';
      case 'offline': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'in-game': return 'In Game';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 font-quicksand">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <Users className="text-blue-400 h-8 w-8" />
          <h1 className="font-bangers text-5xl text-white">Friends</h1>
        </motion.div>

        {/* Add Friend Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6 bg-black/50 border-blue-500/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-bangers text-white flex items-center gap-2 text-2xl">
                <UserPlus className="h-5 w-5" />
                Add Friends
              </CardTitle>
              <CardDescription className="text-blue-200 font-quicksand">
                Search for players by username to add them as friends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
                  <Input
                    placeholder="Search username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-blue-900/30 border-blue-500/50 text-white pl-10 font-quicksand"
                    onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                  />
                </div>
                <Button 
                  onClick={searchUsers} 
                  className="bg-blue-600 hover:bg-blue-700 font-quicksand font-semibold"
                  disabled={loading || !searchQuery.trim()}
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-white font-bangers text-lg">Search Results</h3>
                  {searchResults.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bangers text-sm">
                            {result.username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-white font-quicksand font-medium">{result.username}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addFriend(result.id, result.username)}
                        className="bg-green-600 hover:bg-green-700 font-quicksand"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Friends List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-black/50 border-blue-500/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-bangers text-white flex items-center gap-2 text-2xl">
                <Users className="h-5 w-5" />
                Your Friends ({friends.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
                  <p className="text-blue-200 text-lg mb-2 font-quicksand">No friends yet</p>
                  <p className="text-blue-300 font-quicksand">Search for players above to add them as friends!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {friends.map((friend, index) => (
                    <motion.div
                      key={friend.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-blue-900/20 rounded-lg border border-blue-500/30 hover:border-blue-400/50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bangers">
                              {friend.username?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${getStatusColor(friend.status)} border-2 border-black`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-quicksand font-semibold">{friend.username}</h3>
                            {friend.status === 'in-game' && <Crown className="h-4 w-4 text-yellow-400" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getStatusColor(friend.status)} text-white font-quicksand text-xs`}>
                              {getStatusText(friend.status)}
                            </Badge>
                            {friend.last_seen && (
                              <span className="text-blue-300 text-sm font-quicksand">
                                Last seen {friend.last_seen}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-500/50 text-blue-200 hover:bg-blue-600/20 font-quicksand"
                          disabled={friend.status === 'offline'}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 font-quicksand"
                          disabled={friend.status === 'offline'}
                        >
                          <Gamepad2 className="h-4 w-4 mr-1" />
                          Invite
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Friends;
