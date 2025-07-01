
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Smile, Heart, ThumbsUp, Zap, Flame, Star } from 'lucide-react';

interface PlayerEmotesProps {
  onEmote: (emote: string) => void;
  disabled?: boolean;
}

const emotes = [
  { id: 'thumbs_up', icon: ThumbsUp, label: '👍', color: 'text-green-400' },
  { id: 'heart', icon: Heart, label: '❤️', color: 'text-red-400' },
  { id: 'fire', icon: Flame, label: '🔥', color: 'text-orange-400' },
  { id: 'star', icon: Star, label: '⭐', color: 'text-yellow-400' },
  { id: 'zap', icon: Zap, label: '⚡', color: 'text-blue-400' },
  { id: 'smile', icon: Smile, label: '😊', color: 'text-purple-400' },
];

const PlayerEmotes = ({ onEmote, disabled = false }: PlayerEmotesProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [recentEmotes, setRecentEmotes] = useState<string[]>([]);

  const handleEmote = (emote: any) => {
    if (disabled) return;
    
    onEmote(emote.id);
    setRecentEmotes(prev => [emote.label, ...prev.slice(0, 4)]);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Recent emotes display */}
      <AnimatePresence>
        {recentEmotes.map((emote, index) => (
          <motion.div
            key={`${emote}-${Date.now()}-${index}`}
            initial={{ opacity: 0, scale: 0, y: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0], 
              scale: [0, 1.5, 1, 0],
              y: [0, -50, -100, -150]
            }}
            transition={{ duration: 3, delay: index * 0.2 }}
            className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-2xl pointer-events-none z-10"
            style={{ zIndex: 100 - index }}
          >
            {emote}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Emote button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="border-purple-500/50 text-purple-200 hover:bg-purple-800/50 relative"
      >
        <Smile className="h-4 w-4" />
      </Button>

      {/* Emote picker */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2"
          >
            <Card className="bg-black/80 border-purple-500/50 backdrop-blur-sm">
              <CardContent className="p-2">
                <div className="grid grid-cols-3 gap-1">
                  {emotes.map((emote) => (
                    <Button
                      key={emote.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEmote(emote)}
                      className={`${emote.color} hover:bg-purple-800/30 text-lg`}
                    >
                      <emote.icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlayerEmotes;
