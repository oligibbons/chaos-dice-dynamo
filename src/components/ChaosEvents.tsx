
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from "@/integrations/supabase/client";
import { useSoundManager } from "@/components/SoundManager";
import ChaosEventDisplay from "./ChaosEventDisplay";

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
  const [availableEvents, setAvailableEvents] = useState<ChaosEvent[]>([]);
  const soundManager = useSoundManager();

  useEffect(() => {
    fetchChaosEvents();
  }, []);

  useEffect(() => {
    // Trigger chaos events at the start of each new turn
    if (currentTurn > 1) {
      triggerTurnChaosEvents();
    }
  }, [currentTurn, availableEvents]);

  const fetchChaosEvents = async () => {
    try {
      const { data: events } = await supabase
        .from('chaos_events')
        .select('*')
        .eq('active', true);

      if (events) {
        const typedEvents: ChaosEvent[] = events.map(event => ({
          ...event,
          rarity: (event.rarity as 'common' | 'rare' | 'legendary') || 'common'
        }));
        setAvailableEvents(typedEvents);
      }
    } catch (error) {
      console.error('Error fetching chaos events:', error);
    }
  };

  const triggerTurnChaosEvents = async () => {
    if (availableEvents.length === 0) return;

    // Determine number of chaos events (1-4, with 2-3 being most common)
    const numEventsRoll = Math.random();
    let numEvents: number;
    if (numEventsRoll < 0.17) numEvents = 1;
    else if (numEventsRoll < 0.5) numEvents = 2;
    else if (numEventsRoll < 0.83) numEvents = 3;
    else numEvents = 4;

    // Filter events by trigger condition
    const turnStartEvents = availableEvents.filter(event => 
      event.trigger_condition === 'turn_start' || event.trigger_condition === 'any_roll'
    );

    // Select random events based on rarity weights
    const selectedEvents: ChaosEvent[] = [];
    for (let i = 0; i < numEvents && i < turnStartEvents.length; i++) {
      const weightedEvents = turnStartEvents
        .filter(event => !selectedEvents.find(selected => selected.id === event.id))
        .flatMap(event => {
          const weight = event.rarity === 'legendary' ? 1 : event.rarity === 'rare' ? 3 : 6;
          return Array(weight).fill(event);
        });

      if (weightedEvents.length > 0) {
        const randomEvent = weightedEvents[Math.floor(Math.random() * weightedEvents.length)];
        selectedEvents.push(randomEvent);
      }
    }

    setActiveEvents(selectedEvents);

    // Apply chaos events to game
    try {
      const { data: game } = await supabase
        .from('games')
        .select('chaos_events')
        .eq('id', gameId)
        .single();

      const currentEvents = Array.isArray(game?.chaos_events) ? game.chaos_events : [];
      const updatedEvents = selectedEvents.map(event => ({
        ...event,
        triggered_at: new Date().toISOString(),
        turn_triggered: currentTurn
      }));

      await supabase
        .from('games')
        .update({ 
          chaos_events: [...currentEvents, ...updatedEvents]
        })
        .eq('id', gameId);

      // Notify about each chaos event
      selectedEvents.forEach((event, index) => {
        setTimeout(() => {
          onChaosTriggered?.(event);
          soundManager.play('chaos', 0.6);
        }, index * 1000);
      });

    } catch (error) {
      console.error('Error applying chaos events:', error);
    }
  };

  return <ChaosEventDisplay events={activeEvents} />;
};

export default ChaosEvents;
