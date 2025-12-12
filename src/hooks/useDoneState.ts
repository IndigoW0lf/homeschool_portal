'use client';

import { useState, useCallback, useSyncExternalStore } from 'react';
import { isDone as checkIsDone, setDone } from '@/lib/storage';

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

  const toggle = useCallback(() => {
    const newState = !done;
    setOptimisticDone(newState);
    setDone(kidId, date, lessonId, newState);
  }, [done, kidId, date, lessonId]);

  return { done, toggle, isLoaded: true };
}
