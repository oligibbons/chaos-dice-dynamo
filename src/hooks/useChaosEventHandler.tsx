
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChaosEvent {
  id: string;
  name: string;
  description: string;
  effect: any;
  rarity: 'common' | 'rare' | 'legendary';
  trigger_condition: string;
}

interface ChaosEventState {
  activeDiceModifications: {
    minValue?: number;
    maxValue?: number;
    transformRules?: { from: number; to: number }[];
    extraDice?: { count: number; special?: string };
    binaryDice?: { values: number[]; index?: number };
    sequentialRolling?: boolean;
  };
  activeScoreModifications: {
    flipScores?: boolean;
    forcedGamble?: { required: string[]; active: boolean };
  };
  activeDebuffs: {
    stinkyDice?: boolean;
  };
  previousPlayerLastDie?: number;
  declaredWildNumber?: number;
}

export const useChaosEventHandler = (gameId: string, playerId: string) => {
  const [chaosState, setChaosState] = useState<ChaosEventState>({
    activeDiceModifications: {},
    activeScoreModifications: {},
    activeDebuffs: {}
  });
  const { toast } = useToast();

  const applyChaosEvent = useCallback((event: ChaosEvent) => {
    const effect = event.effect;
    
    setChaosState(prev => {
      const newState = { ...prev };
      
      switch (effect.type) {
        case 'reduce_sides':
        case 'increase_sides':
          newState.activeDiceModifications = {
            ...newState.activeDiceModifications,
            minValue: effect.min_value,
            maxValue: effect.max_value
          };
          break;
          
        case 'transform_dice':
          newState.activeDiceModifications = {
            ...newState.activeDiceModifications,
            transformRules: [{ from: effect.from, to: effect.to }]
          };
          break;
          
        case 'extra_die':
          newState.activeDiceModifications = {
            ...newState.activeDiceModifications,
            extraDice: { count: effect.count, special: effect.special }
          };
          break;
          
        case 'binary_die':
          newState.activeDiceModifications = {
            ...newState.activeDiceModifications,
            binaryDice: { values: effect.values, index: Math.floor(Math.random() * 5) }
          };
          break;
          
        case 'sequential_rolling':
          newState.activeDiceModifications = {
            ...newState.activeDiceModifications,
            sequentialRolling: true
          };
          break;
          
        case 'flip_scores':
          newState.activeScoreModifications = {
            ...newState.activeScoreModifications,
            flipScores: true
          };
          break;
          
        case 'forced_gamble':
          newState.activeScoreModifications = {
            ...newState.activeScoreModifications,
            forcedGamble: { required: effect.required_combos, active: true }
          };
          break;
          
        case 'stinky_dice':
          newState.activeDebuffs = {
            ...newState.activeDebuffs,
            stinkyDice: true
          };
          break;
      }
      
      return newState;
    });

    toast({
      title: "🌀 CHAOS EVENT TRIGGERED!",
      description: `${event.name}: ${event.description}`,
      variant: event.rarity === 'legendary' ? 'destructive' : 'default',
    });
  }, [toast]);

  const modifyDiceRoll = useCallback((originalDice: number[]): number[] => {
    let modifiedDice = [...originalDice];
    const { activeDiceModifications } = chaosState;

    // Apply dice range modifications
    if (activeDiceModifications.minValue !== undefined && activeDiceModifications.maxValue !== undefined) {
      modifiedDice = modifiedDice.map(die => {
        const min = activeDiceModifications.minValue!;
        const max = activeDiceModifications.maxValue!;
        // Clamp existing values to new range
        if (die > max) return max;
        if (die < min) return min;
        return die;
      });
    }

    // Apply transformation rules (like 6->1)
    if (activeDiceModifications.transformRules) {
      activeDiceModifications.transformRules.forEach(rule => {
        modifiedDice = modifiedDice.map(die => die === rule.from ? rule.to : die);
      });
    }

    // Apply binary die restriction
    if (activeDiceModifications.binaryDice && activeDiceModifications.binaryDice.index !== undefined) {
      const binaryIndex = activeDiceModifications.binaryDice.index;
      const values = activeDiceModifications.binaryDice.values;
      if (binaryIndex < modifiedDice.length) {
        modifiedDice[binaryIndex] = values[Math.floor(Math.random() * values.length)];
      }
    }

    // Handle coughing dice (3+ of same number)
    const counts = modifiedDice.reduce((acc, die) => {
      acc[die] = (acc[die] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    Object.entries(counts).forEach(([num, count]) => {
      if (count >= 3) {
        modifiedDice = modifiedDice.map(die => 
          die === parseInt(num) ? Math.floor(Math.random() * 6) + 1 : die
        );
        toast({
          title: "🤧 COUGH COUGH!",
          description: `Your ${num}'s got sick and changed!`,
        });
      }
    });

    // Handle Diceception (recursive 3s)
    modifiedDice = modifiedDice.map(die => {
      let currentDie = die;
      while (currentDie === 3) {
        currentDie = Math.floor(Math.random() * 6) + 1;
      }
      return currentDie;
    });

    return modifiedDice;
  }, [chaosState, toast]);

  const rollWithChaosModifications = useCallback((baseDiceCount: number = 5): number[] => {
    const { activeDiceModifications } = chaosState;
    let diceCount = baseDiceCount;
    
    // Add extra dice if needed
    if (activeDiceModifications.extraDice) {
      diceCount += activeDiceModifications.extraDice.count;
      
      // Handle special extra dice (like Time Warp Token)
      if (activeDiceModifications.extraDice.special === 'previous_player_last_die' && chaosState.previousPlayerLastDie) {
        const normalDice = Array.from({ length: baseDiceCount }, () => {
          const min = activeDiceModifications.minValue || 1;
          const max = activeDiceModifications.maxValue || 6;
          return Math.floor(Math.random() * (max - min + 1)) + min;
        });
        return [...normalDice, chaosState.previousPlayerLastDie];
      }
    }

    // Roll dice with current range restrictions
    const min = activeDiceModifications.minValue || 1;
    const max = activeDiceModifications.maxValue || 6;
    
    const dice = Array.from({ length: diceCount }, () => 
      Math.floor(Math.random() * (max - min + 1)) + min
    );

    return modifyDiceRoll(dice);
  }, [chaosState, modifyDiceRoll]);

  const modifyScore = useCallback((baseScore: number, combo: string): number => {
    const { activeScoreModifications } = chaosState;
    let finalScore = baseScore;

    // Apply score flipping
    if (activeScoreModifications.flipScores) {
      finalScore = -finalScore;
    }

    // Handle forced gamble
    if (activeScoreModifications.forcedGamble?.active) {
      const requiredCombos = activeScoreModifications.forcedGamble.required;
      if (requiredCombos.includes(combo)) {
        finalScore *= 2; // Double points for success
      } else {
        finalScore = 0; // Zero points for failure
      }
    }

    // Apply wild number penalty
    if (chaosState.declaredWildNumber !== undefined) {
      finalScore -= 5; // Subtract 5 points for wild number
    }

    return finalScore;
  }, [chaosState]);

  const clearChaosEffects = useCallback(() => {
    setChaosState({
      activeDiceModifications: {},
      activeScoreModifications: {},
      activeDebuffs: {}
    });
  }, []);

  const setPreviousPlayerDie = useCallback((dieValue: number) => {
    setChaosState(prev => ({
      ...prev,
      previousPlayerLastDie: dieValue
    }));
  }, []);

  const setWildNumber = useCallback((number: number) => {
    setChaosState(prev => ({
      ...prev,
      declaredWildNumber: number
    }));
  }, []);

  return {
    chaosState,
    applyChaosEvent,
    rollWithChaosModifications,
    modifyDiceRoll,
    modifyScore,
    clearChaosEffects,
    setPreviousPlayerDie,
    setWildNumber
  };
};
