'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { ProgressCard } from './ProgressCard';
import { isDone } from '@/lib/storage';

interface ProgressCardWrapperProps {
  kidId: string;
  initialStars: number;
  featuredBadges?: string[];
  streakEnabled?: boolean;
  date: string;
  itemIds: string[];
}

// Subscribe to storage changes
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  // Also poll for changes since localStorage events don't fire in same tab
  const interval = setInterval(callback, 500);
  return () => {
    window.removeEventListener('storage', callback);
    clearInterval(interval);
  };
}

/**
 * Client wrapper for ProgressCard that tracks completion from localStorage
 */
export function ProgressCardWrapper({ 
  kidId, 
  initialStars, 
  featuredBadges = [],
  streakEnabled = true,
  date,
  itemIds 
}: ProgressCardWrapperProps) {
  const [isClient, setIsClient] = useState(false);
  
  // Ensure we're on client before reading localStorage
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Count completed items from localStorage
  const completedCount = useSyncExternalStore(
    subscribe,
    () => {
      if (typeof window === 'undefined') return 0;
      return itemIds.filter(id => isDone(kidId, date, id)).length;
    },
    () => 0 // Server snapshot
  );

  const totalCount = itemIds.length;

  return (
    <ProgressCard 
      kidId={kidId}
      initialStars={initialStars}
      todayCompleted={isClient ? completedCount : 0}
      todayTotal={totalCount}
      featuredBadges={featuredBadges}
      streakEnabled={streakEnabled}
    />
  );
}
