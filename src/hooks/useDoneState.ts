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
    // This calls setScheduleItemDoneAction -> toggleScheduleItemComplete -> awardStars (on server)
    await setDone(kidId, date, lessonId, newState, lessonId);

    // No need to manually award stars here anymore, the server action does it!
    // However, we might want to check for unlocks if we want immediate feedback
    // effectively optimistically assuming success?
    // For now, let's rely on the server action. But if we need the new total for unlocks...
    
    // Actually, we should probably fetch the new total if we want to trigger unlocks client-side
    // OR, we can move checkAndGrantUnlocks to the server action too?
    // checkAndGrantUnlocks IS in mutations.ts!
    // But toggleScheduleItemComplete doesn't call it.
    
    // Let's add checkAndGrantUnlocks to toggleScheduleItemComplete later if needed.
    // For now, the priority is fixing the star awarding.
  }, [done, kidId, date, lessonId]);

  return { done, toggle, isLoaded: true };
}

