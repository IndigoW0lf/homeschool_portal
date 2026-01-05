'use client';

import { useState, useCallback, useSyncExternalStore } from 'react';
import { isDone as checkIsDone, setDone } from '@/lib/storage';
import { awardStars, checkAndGrantUnlocks } from '@/lib/supabase/mutations';

// Create a subscription mechanism for localStorage changes
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export function useDoneState(kidId: string, date: string, lessonId: string) {
  // Track optimistic updates locally
  const [optimisticDone, setOptimisticDone] = useState<boolean | null>(null);
  
  // Use useSyncExternalStore to properly sync with localStorage
  const storedDone = useSyncExternalStore(
    subscribe,
    () => checkIsDone(kidId, date, lessonId),
    () => false // Server snapshot
  );

  // Use optimistic value if set, otherwise use stored value
  const done = optimisticDone !== null ? optimisticDone : storedDone;

  const toggle = useCallback(async () => {
    const newState = !done;
    setOptimisticDone(newState);
    
    // Sync to BOTH localStorage AND database for cross-device visibility
    // lessonId here is actually the schedule_item.id when called from ScheduleItemCard
    await setDone(kidId, date, lessonId, newState, lessonId);

    // Award star if marking done for first time
    if (newState) {
      try {
        // Call server action to award stars
        const result = await awardStars(kidId, date, lessonId, 1);
        
        // Check and grant any new unlocks
        if (result.newTotal) {
          await checkAndGrantUnlocks(kidId, result.newTotal);
        }
      } catch (err) {
        console.error('Error awarding stars:', err);
      }
    }
  }, [done, kidId, date, lessonId]);

  return { done, toggle, isLoaded: true };
}

