
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserPlus, MessageSquare, Gamepad2, Search, Crown, UserMinus, RefreshCw, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface Friend {
  id: string;
  username: string;
  status: 'online' | 'offline' | 'in-game';
  last_seen?: string;
  friendshipId?: string;
}

interface SearchResult {
  id: string;
  username: string;
}

const Friends = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchFriendRequests();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching friends...');
      
      const { data, error } = await supabase
        .from('friends')
        .select(`
          id,
          requester_id,
          addressee_id,
          status
        `)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`);

      if (error) {
        console.error('Friends fetch error:', error);
        throw error;
      }

      console.log('Friends data:', data);

      // Now fetch profile data for each friend
      const friendsList: Friend[] = [];
      
      for (const friendship of data || []) {
        try {
          const friendId = friendship.requester_id === user!.id ? friendship.addressee_id : friendship.requester_id;
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, username')
            .eq('id', friendId)
            .single();

          if (profileError) {
            console.error('Profile fetch error:', profileError);
            continue;
          }

          if (profileData) {
            friendsList.push({
              id: profileData.id,
              username: profileData.username || 'Unknown User',
              status: 'offline' as const,
              friendshipId: friendship.id
            });
          }
        } catch (error) {
          console.error('Error processing friendship:', error);
        }
      }

      setFriends(friendsList);
    } catch (error: any) {
      console.error('Error fetching friends:', error);
      setError(error.message || 'Failed to load friends');
      toast({
        title: "Error",
        description: "Failed to load friends",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select(`
          id,
          requester_id,
          status,
          created_at
        `)
        .eq('addressee_id', user!.id)
        .eq('status', 'pending');

      if (error) throw error;

      // Fetch requester profiles
      const requestsWithProfiles = [];
      
      for (const request of data || []) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, username')
            .eq('id', request.requester_id)
            .single();

          if (!profileError && profileData) {
            requestsWithProfiles.push({
              ...request,
              profiles: profileData
            });
          }
        } catch (error) {
          console.error('Error processing friend request:', error);
        }
      }

      setFriendRequests(requestsWithProfiles);
    } catch (error: any) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('friends-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friends'
      }, () => {
        console.log('Friends change detected, refreshing...');
        fetchFriends();
        fetchFriendRequests();
      })
      .subscribe((status) => {
        console.log('Friends subscription status:', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('Friends subscription failed, retrying...');
          setTimeout(() => {
            fetchFriends();
            fetchFriendRequests();
          }, 2000);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      // Get existing friend relationships to filter out
      const { data: existingFriends } = await supabase
        .from('friends')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`);

      const friendIds = new Set();
      existingFriends?.forEach(friendship => {
        if (friendship.requester_id === user!.id) {
          friendIds.add(friendship.addressee_id);
        } else {
          friendIds.add(friendship.requester_id);
        }
      });

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', user!.id)
        .limit(10);

      if (error) throw error;

      // Filter out existing friends
      const filtered = data?.filter(profile => !friendIds.has(profile.id)) || [];
      setSearchResults(filtered);
    } catch (error: any) {
      console.error('Error searching users:', error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const sendFriendRequest = async (friendId: string, username: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .insert({
          requester_id: user!.id,
          addressee_id: friendId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Friend Request Sent!",
        description: `Friend request sent to ${username}`,
      });
      
      setSearchQuery('');
      setSearchResults([]);
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      
      if (error.code === '23505') {
        toast({
          title: "Error",
          description: "Friend request already sent or you are already friends",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send friend request",
          variant: "destructive",
        });
      }
    }
  };

  const removeFriend = async (friendshipId: string, friendName: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: "Friend Removed",
        description: `${friendName} has been removed from your friends`,
      });
    } catch (error: any) {
      console.error('Error removing friend:', error);
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive",
      });
    }
  };

  const refreshData = () => {
    fetchFriends();
    fetchFriendRequests();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 font-quicksand">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <Users className="text-blue-400 h-8 w-8" />
            <h1 className="font-bangers text-5xl text-white">Friends</h1>
          </div>
          <Button
            onClick={refreshData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 font-quicksand font-semibold"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-red-900/50 border-red-500/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-red-200 font-quicksand font-medium">Error loading friends</p>
                    <p className="text-red-300 text-sm font-quicksand">{error}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={refreshData}
                    className="ml-auto bg-red-600 hover:bg-red-700"
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Friend Requests */}
        {friendRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-black/50 border-yellow-500/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-bangers text-white flex items-center gap-2 text-2xl">
                  <Users className="h-5 w-5" />
                  Pending Friend Requests ({friendRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {friendRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bangers">
                            {request.profiles?.username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-quicksand font-medium">{request.profiles?.username}</p>
                          <p className="text-yellow-300 text-sm font-quicksand">
                            Sent {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-yellow-200 text-sm font-quicksand">Check notifications to respond</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

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
                Search for players by username to send them friend requests
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
                  disabled={searchLoading || !searchQuery.trim()}
                >
                  {searchLoading ? 'Searching...' : 'Search'}
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
                        onClick={() => sendFriendRequest(result.id, result.username)}
                        className="bg-green-600 hover:bg-green-700 font-quicksand"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add Friend
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
              {loading && friends.length === 0 ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-12 w-12 text-blue-400 animate-spin mx-auto mb-4" />
                  <p className="text-blue-200 text-lg font-quicksand">Loading friends...</p>
                </div>
              ) : friends.length === 0 ? (
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
                              {friend.username[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gray-600 border-2 border-black" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-quicksand font-semibold">{friend.username}</h3>
                          </div>
                          <Badge className="bg-gray-600 text-white font-quicksand text-xs">
                            Offline
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-500/50 text-blue-200 hover:bg-blue-600/20 font-quicksand"
                          disabled
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 font-quicksand"
                          disabled
                        >
                          <Gamepad2 className="h-4 w-4 mr-1" />
                          Invite
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFriend(friend.friendshipId!, friend.username)}
                          className="border-red-500/50 text-red-300 hover:bg-red-600/20 font-quicksand"
                        >
                          <UserMinus className="h-4 w-4" />
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
