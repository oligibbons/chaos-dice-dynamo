
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Share2, Users, Lock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface RoomInviteProps {
  gameId: string;
  roomCode?: string;
  isHost: boolean;
}

const RoomInvite = ({ gameId, roomCode, isHost }: RoomInviteProps) => {
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  const inviteLink = `${window.location.origin}/game/${gameId}${password ? `?pass=${password}` : ''}`;
  const displayCode = roomCode || gameId.slice(0, 8).toUpperCase();

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Invite Link Copied!",
      description: "Share this link with friends to invite them to your game.",
    });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(displayCode);
    toast({
      title: "Room Code Copied!",
      description: "Friends can use this code to find your game.",
    });
  };

  const shareGame = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my DieNamic Game!',
          text: `Come play DieNamic with me! Room code: ${displayCode}`,
          url: inviteLink,
        });
      } catch (error) {
        copyInviteLink();
      }
    } else {
      copyInviteLink();
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setShowInvite(!showInvite)}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-quicksand"
      >
        <Users className="w-4 h-4 mr-2" />
        Invite Players
      </Button>

      {showInvite && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-bangers text-white flex items-center gap-2">
                <Share2 className="text-blue-400" />
                INVITE FRIENDS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Room Code */}
              <div>
                <Label className="text-purple-200 font-quicksand">Room Code</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={displayCode}
                    readOnly
                    className="bg-purple-900/30 border-purple-500/50 text-white font-mono text-lg text-center"
                  />
                  <Button
                    onClick={copyRoomCode}
                    variant="outline"
                    size="sm"
                    className="border-purple-500/50 text-purple-200"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Password (for hosts) */}
              {isHost && (
                <div>
                  <Label className="text-purple-200 font-quicksand flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password (Optional)
                  </Label>
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set a password for private games"
                    className="bg-purple-900/30 border-purple-500/50 text-white mt-1"
                  />
                </div>
              )}

              {/* Share Options */}
              <div className="flex gap-2">
                <Button
                  onClick={shareGame}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-quicksand"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Game
                </Button>
                <Button
                  onClick={copyInviteLink}
                  variant="outline"
                  className="border-purple-500/50 text-purple-200 font-quicksand"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </div>

              <div className="text-purple-300 text-sm font-quicksand">
                Players can join by entering the room code or clicking your invite link!
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default RoomInvite;
