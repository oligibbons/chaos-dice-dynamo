
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, LogOut, Dice1 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GameRoom {
  id: string;
  name: string;
  players: string[];
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
}

const Lobby = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [rooms, setRooms] = useState<GameRoom[]>([
    {
      id: '1',
      name: 'Chaos Beginners',
      players: ['Player1', 'Player2'],
      maxPlayers: 4,
      status: 'waiting'
    },
    {
      id: '2',
      name: 'Dice Masters Only',
      players: ['ProPlayer', 'DiceLord', 'ChaosKing'],
      maxPlayers: 4,
      status: 'waiting'
    }
  ]);
  const [newRoomName, setNewRoomName] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('dienamic_user');
    if (!userData) {
      navigate('/');
    } else {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('dienamic_user');
    navigate('/');
  };

  const createRoom = () => {
    if (newRoomName.trim()) {
      const newRoom: GameRoom = {
        id: Date.now().toString(),
        name: newRoomName,
        players: [user?.username],
        maxPlayers: 4,
        status: 'waiting'
      };
      setRooms([...rooms, newRoom]);
      setNewRoomName('');
    }
  };

  const joinRoom = (roomId: string) => {
    setRooms(rooms.map(room => {
      if (room.id === roomId && room.players.length < room.maxPlayers) {
        return {
          ...room,
          players: [...room.players, user?.username]
        };
      }
      return room;
    }));
    navigate(`/game/${roomId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-green-600';
      case 'playing': return 'bg-yellow-600';
      case 'finished': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Dice1 className="text-purple-400 h-8 w-8" />
            <h1 className="text-3xl font-bold text-white">DieNamic Lobby</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-purple-200">Welcome, {user.username}!</span>
            <Button onClick={handleLogout} variant="outline" size="sm" className="border-purple-500/50 text-purple-200">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Create Room */}
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
              />
              <Button onClick={createRoom} className="bg-purple-600 hover:bg-purple-700">
                Create Room
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Game Rooms */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id} className="bg-black/50 border-purple-500/30 backdrop-blur-sm hover:border-purple-400/50 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-white text-lg">{room.name}</CardTitle>
                  <Badge className={`${getStatusColor(room.status)} text-white`}>
                    {room.status}
                  </Badge>
                </div>
                <CardDescription className="text-purple-200">
                  {room.players.length}/{room.maxPlayers} players
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-purple-400" />
                    <span className="text-purple-200 text-sm">Players:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {room.players.map((player, index) => (
                      <Badge key={index} variant="secondary" className="bg-purple-800/50 text-purple-200">
                        {player}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => joinRoom(room.id)}
                  disabled={room.players.length >= room.maxPlayers || room.status !== 'waiting'}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {room.players.includes(user.username) ? 'Rejoin Game' : 'Join Game'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {rooms.length === 0 && (
          <Card className="bg-black/30 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <Dice1 className="h-16 w-16 text-purple-400 mx-auto mb-4 opacity-50" />
              <p className="text-purple-200 text-lg mb-2">No games available</p>
              <p className="text-purple-300">Create a new room to start playing!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Lobby;
