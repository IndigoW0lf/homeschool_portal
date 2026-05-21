'use client';

import { useState, useCallback, useEffect } from 'react';
import { getDoneKey, setDone } from '@/lib/storage';

export function useDoneState(kidId: string, date: string, lessonId: string, initialDone = false) {
  const [done, setDoneState] = useState(initialDone);

  // Cross-tab sync via storage events — not used for initial render
  useEffect(() => {
    const key = getDoneKey(kidId, date, lessonId);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key) {
        setDoneState(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [kidId, date, lessonId]);

  const toggle = useCallback(async (): Promise<{ moonsAwarded?: number } | undefined> => {
    const newState = !done;
    setDoneState(newState);
    const result = await setDone(kidId, date, lessonId, newState, lessonId);
    return result;
  }, [done, kidId, date, lessonId]);

  return { done, toggle, isLoaded: true };
}
