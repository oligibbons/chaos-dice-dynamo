
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Skull, Star, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ChaosEvent {
  id: string;
  name: string;
  description: string;
  effect: any;
  rarity: 'common' | 'rare' | 'legendary';
  trigger_condition: string;
}

interface ChaosEventsProps {
  gameId: string;
  currentTurn: number;
  onChaosTriggered?: (event: ChaosEvent) => void;
}

const ChaosEvents = ({ gameId, currentTurn, onChaosTriggered }: ChaosEventsProps) => {
  const [activeEvents, setActiveEvents] = useState<ChaosEvent[]>([]);
  const [triggeredEvent, setTriggeredEvent] = useState<ChaosEvent | null>(null);

  useEffect(() => {
    fetchChaosEvents();
    
    // Random chance to trigger chaos event each turn
    if (Math.random() < 0.3) { // 30% chance
      triggerRandomChaosEvent();
    }
  }, [currentTurn]);

  const fetchChaosEvents = async () => {
    try {
      const { data: events } = await supabase
        .from('chaos_events')
        .select('*')
        .eq('active', true);

      if (events) {
        // Properly type the events to match our ChaosEvent interface
        const typedEvents: ChaosEvent[] = events.map(event => ({
          ...event,
          rarity: (event.rarity as 'common' | 'rare' | 'legendary') || 'common'
        }));
        setActiveEvents(typedEvents);
      }
    } catch (error) {
      console.error('Error fetching chaos events:', error);
    }
  };

  const triggerRandomChaosEvent = async () => {
    if (activeEvents.length === 0) return;

    // Weighted random selection based on rarity
    const weightedEvents = activeEvents.flatMap(event => {
      const weight = event.rarity === 'legendary' ? 1 : event.rarity === 'rare' ? 3 : 6;
      return Array(weight).fill(event);
    });

    const randomEvent = weightedEvents[Math.floor(Math.random() * weightedEvents.length)];
    
    setTriggeredEvent(randomEvent);
    
    // Apply chaos event to game
    try {
      const { data: game } = await supabase
        .from('games')
        .select('chaos_events')
        .eq('id', gameId)
        .single();

      const currentEvents = Array.isArray(game?.chaos_events) ? game.chaos_events : [];
      const updatedEvents = [...currentEvents, {
        ...randomEvent,
        triggered_at: new Date().toISOString(),
        turn_triggered: currentTurn
      }];

      await supabase
        .from('games')
        .update({ chaos_events: updatedEvents })
        .eq('id', gameId);

      onChaosTriggered?.(randomEvent);
    } catch (error) {
      console.error('Error applying chaos event:', error);
    }

    // Clear triggered event after 3 seconds
    setTimeout(() => setTriggeredEvent(null), 3000);
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return <Star className="h-4 w-4 text-yellow-400" />;
      case 'rare': return <Sparkles className="h-4 w-4 text-purple-400" />;
      default: return <Zap className="h-4 w-4 text-blue-400" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-yellow-600';
      case 'rare': return 'bg-purple-600';
      default: return 'bg-blue-600';
    }
  };

  return (
    <>
      <AnimatePresence>
        {triggeredEvent && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <Card className="bg-black/80 border-red-500/50 backdrop-blur-sm animate-chaos-pulse max-w-md mx-4">
              <CardHeader className="text-center">
                <CardTitle className="font-bangers text-3xl text-red-400 flex items-center justify-center gap-2">
                  <Skull className="h-8 w-8" />
                  CHAOS UNLEASHED!
                  <Skull className="h-8 w-8" />
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  {getRarityIcon(triggeredEvent.rarity)}
                  <h3 className="font-quicksand font-bold text-xl text-white">
                    {triggeredEvent.name}
                  </h3>
                  <Badge className={`${getRarityColor(triggeredEvent.rarity)} text-white`}>
                    {triggeredEvent.rarity}
                  </Badge>
                </div>
                <p className="font-quicksand text-gray-200">
                  {triggeredEvent.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {activeEvents.length > 0 && (
        <Card className="bg-black/40 border-red-500/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-bangers text-white flex items-center gap-2">
              <Zap className="text-red-400" />
              CHAOS ZONE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeEvents.slice(0, 3).map((event) => (
              <motion.div
                key={event.id}
                className="p-2 bg-red-900/20 border border-red-500/30 rounded-lg"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  {getRarityIcon(event.rarity)}
                  <h4 className="font-quicksand font-semibold text-red-300 text-sm">
                    {event.name}
                  </h4>
                  <Badge className={`${getRarityColor(event.rarity)} text-white text-xs`}>
                    {event.rarity}
                  </Badge>
                </div>
                <p className="font-quicksand text-red-200 text-xs">
                  {event.description}
                </p>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ChaosEvents;
