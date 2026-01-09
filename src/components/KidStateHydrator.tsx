'use client';

import { useEffect, useRef } from 'react';
import { hydrateKidState } from '@/lib/hydrateKidState';

interface HydrationItem {
  date: string;
  itemId: string | null;
  status: string;
}

interface KidStateHydratorProps {
  kidId: string;
  date: string;
  scheduleItems?: HydrationItem[];
}

/**
 * Client component that hydrates localStorage from database on mount.
 * Renders nothing - just handles hydration side effect.
 */
export function KidStateHydrator({ kidId, date, scheduleItems }: KidStateHydratorProps) {
  const hasHydrated = useRef(false);
  
  useEffect(() => {
    // Only hydrate once per mount
    if (hasHydrated.current) return;
    hasHydrated.current = true;
    
    hydrateKidState(kidId, date, scheduleItems);
  }, [kidId, date, scheduleItems]);
  
  return null; // This component renders nothing
}
