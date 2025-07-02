
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Player {
  id: string;
  username: string;
  is_ready: boolean;
  is_host: boolean;
  joined_at: string;
}

interface Game {
  id: string;
  name: string;
  host_id: string;
  current_players: number;
  max_players: number;
  status: string;
  created_at: string;
  is_private: boolean;
  game_code?: string;
  max_rounds: number;
}

interface GameWithPlayers extends Game {
  players: Player[];
}

export const useGameData = (gameId?: string) => {
  const [games, setGames] = useState<GameWithPlayers[]>([]);
  const [currentGame, setCurrentGame] = useState<GameWithPlayers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching games...');
      
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false });

      if (gamesError) throw gamesError;

      if (!gamesData || gamesData.length === 0) {
        setGames([]);
        return;
      }

      // Fetch players for each game
      const gamesWithPlayers = await Promise.all(
        gamesData.map(async (game) => {
          const players = await fetchGamePlayers(game.id, game.host_id);
          return {
            ...game,
            players
          };
        })
      );

      setGames(gamesWithPlayers);
    } catch (error:any) {
      console.error('Error fetching games:', error);
      setError(error.message || 'Failed to load games');
      toast({
        title: "Error",
        description: "Failed to load games. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchGamePlayers = useCallback(async (gameId: string, hostId: string): Promise<Player[]> => {
    try {
      console.log(`Fetching players for game ${gameId}...`);
      
      const { data: gamePlayers, error: playersError } = await supabase
        .from('game_players')
        .select('player_id, is_ready, joined_at')
        .eq('game_id', gameId)
        .order('joined_at');

      if (playersError) throw playersError;

      if (!gamePlayers || gamePlayers.length === 0) {
        return [];
      }

      // Fetch profile data for each player with better error handling
      const players: Player[] = [];
      
      for (const gamePlayer of gamePlayers) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, username')
            .eq('id', gamePlayer.player_id)
            .single();

          if (profileError) {
            console.error(`Profile error for player ${gamePlayer.player_id}:`, profileError);
            // Still add the player with unknown username rather than skipping
            players.push({
              id: gamePlayer.player_id,
              username: 'Unknown Player',
              is_ready: gamePlayer.is_ready || false,
              is_host: gamePlayer.player_id === hostId,
              joined_at: gamePlayer.joined_at || new Date().toISOString()
            });
            continue;
          }

          if (profile) {
            players.push({
              id: profile.id,
              username: profile.username || 'Unknown Player',
              is_ready: gamePlayer.is_ready || false,
              is_host: profile.id === hostId,
              joined_at: gamePlayer.joined_at || new Date().toISOString()
            });
          }
        } catch (error) {
          console.error(`Error fetching profile for player ${gamePlayer.player_id}:`, error);
          // Add player with unknown username to maintain consistency
          players.push({
            id: gamePlayer.player_id,
            username: 'Unknown Player',
            is_ready: gamePlayer.is_ready || false,
            is_host: gamePlayer.player_id === hostId,
            joined_at: gamePlayer.joined_at || new Date().toISOString()
          });
        }
      }

      console.log(`Fetched ${players.length} players for game ${gameId}:`, players);
      return players;
    } catch (error: any) {
      console.error(`Error fetching players for game ${gameId}:`, error);
      return [];
    }
  }, []);

  const fetchSingleGame = useCallback(async (gameId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching single game:', gameId);
      
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;

      const players = await fetchGamePlayers(game.id, game.host_id);
      
      const gameWithPlayers = {
        ...game,
        players
      };

      console.log('Single game fetched:', gameWithPlayers);
      setCurrentGame(gameWithPlayers);
      return gameWithPlayers;
    } catch (error: any) {
      console.error('Error fetching single game:', error);
      setError(error.message || 'Failed to load game');
      toast({
        title: "Error",
        description: "Failed to load game data",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchGamePlayers, toast]);

  const setupRealtimeSubscription = useCallback((onGameUpdate?: () => void) => {
    const channelName = gameId ? `game-data-${gameId}` : 'lobby-games-data';
    
    console.log(`Setting up enhanced realtime subscription: ${channelName}`);
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games',
        ...(gameId && { filter: `id=eq.${gameId}` })
      }, (payload) => {
        console.log('Games table change detected:', payload);
        if (gameId) {
          fetchSingleGame(gameId);
        } else {
          fetchGames();
        }
        onGameUpdate?.();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_players',
        ...(gameId && { filter: `game_id=eq.${gameId}` })
      }, (payload) => {
        console.log('Game players change detected:', payload);
        if (gameId) {
          fetchSingleGame(gameId);
        } else {
          fetchGames();
        }
        onGameUpdate?.();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        console.log('Profiles change detected:', payload);
        // Only refetch if this profile is involved in current games
        if (gameId) {
          fetchSingleGame(gameId);
        } else {
          fetchGames();
        }
        onGameUpdate?.();
      })
      .subscribe((status) => {
        console.log(`Enhanced realtime subscription status (${channelName}):`, status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to realtime updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Realtime subscription failed, attempting recovery...');
          setTimeout(() => {
            if (gameId) {
              fetchSingleGame(gameId);
            } else {
              fetchGames();
            }
          }, 2000);
        }
      });

    return () => {
      console.log(`Cleaning up enhanced realtime subscription: ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [gameId, fetchGames, fetchSingleGame]);

  useEffect(() => {
    if (gameId) {
      fetchSingleGame(gameId);
    } else {
      fetchGames();
    }
  }, [gameId, fetchGames, fetchSingleGame]);

  return {
    games,
    currentGame,
    loading,
    error,
    fetchGames,
    fetchSingleGame,
    setupRealtimeSubscription,
    refetch: gameId ? () => fetchSingleGame(gameId) : fetchGames
  };
};
