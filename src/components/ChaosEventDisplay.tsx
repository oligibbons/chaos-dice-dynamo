
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Sparkles, Star, Crown } from "lucide-react";

interface ChaosEvent {
  id: string;
  name: string;
  description: string;
  effect: any;
  rarity: 'common' | 'rare' | 'legendary';
  trigger_condition: string;
}

interface ChaosEventDisplayProps {
  events: ChaosEvent[];
  className?: string;
}

const ChaosEventDisplay = ({ events, className = "" }: ChaosEventDisplayProps) => {
  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return <Crown className="h-4 w-4 text-yellow-400" />;
      case 'rare': return <Star className="h-4 w-4 text-purple-400" />;
      default: return <Sparkles className="h-4 w-4 text-blue-400" />;
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500/50';
      case 'rare': return 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border-purple-500/50';
      default: return 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-blue-500/50';
    }
  };

  if (events.length === 0) {
    return (
      <Card className={`bg-black/40 border-purple-500/50 backdrop-blur-sm ${className}`}>
        <CardHeader>
          <CardTitle className="font-bangers text-white flex items-center gap-2">
            <Zap className="text-purple-400" />
            CHAOS ZONE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-purple-300 font-quicksand text-center italic">
            The calm before the storm... 🌀
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-black/40 border-red-500/50 backdrop-blur-sm ${className}`}>
      <CardHeader>
        <CardTitle className="font-bangers text-white flex items-center gap-2">
          <Zap className="text-red-400 animate-pulse" />
          ACTIVE CHAOS ({events.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence>
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg border ${getRarityBg(event.rarity)} backdrop-blur-sm`}
            >
              <div className="flex items-center gap-2 mb-2">
                {getRarityIcon(event.rarity)}
                <h4 className="font-bangers text-white text-sm">
                  {event.name}
                </h4>
                <Badge 
                  className={`text-xs ${
                    event.rarity === 'legendary' ? 'bg-yellow-600' :
                    event.rarity === 'rare' ? 'bg-purple-600' : 'bg-blue-600'
                  } text-white border-0`}
                >
                  {event.rarity}
                </Badge>
              </div>
              <p className="font-quicksand text-white/90 text-xs leading-relaxed">
                {event.description}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default ChaosEventDisplay;
