'use client';

import { useEffect, useState } from 'react';
import { isDone } from '@/lib/storage';
import {
  addStars,
  isAwarded,
  markAwarded,
  isDailyBonusAwarded,
  markDailyBonusAwarded,
  updateStreakIfCompleted,
} from '@/lib/progressState';

interface TodayCompletionSummaryProps {
  kidId: string;
  date: string;
  itemIds: string[]; // All today item IDs including 'miacademy' and lesson IDs
}

export function TodayCompletionSummary({ kidId, date, itemIds }: TodayCompletionSummaryProps) {
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    const checkCompletion = () => {
      const allItemsDone = itemIds.every(itemId => isDone(kidId, date, itemId));
      setAllDone(allItemsDone);

      if (allItemsDone) {
        // Award daily bonus if not already awarded
        if (!isDailyBonusAwarded(kidId, date)) {
          addStars(kidId, 2);
          markDailyBonusAwarded(kidId, date);
        }

        // Update streak if it's a school day
        const today = new Date(date);
        updateStreakIfCompleted(kidId, today);
      }
    };

    checkCompletion();
    // Check every second to catch changes
    const interval = setInterval(checkCompletion, 1000);
    return () => clearInterval(interval);
  }, [kidId, date, itemIds]);

  return null; // This component just handles side effects
}



