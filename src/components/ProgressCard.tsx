'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getStars, getStreak, getUnlocks, ensureUnlocksForStars } from '@/lib/progressState';

interface ProgressCardProps {
  kidId: string;
}

export function ProgressCard({ kidId }: ProgressCardProps) {
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState({ current: 0, best: 0, lastCompletedDate: null as string | null });
  const [unlocks, setUnlocks] = useState<string[]>([]);

  useEffect(() => {
    const updateProgress = () => {
      const currentStars = getStars(kidId);
      const currentStreak = getStreak(kidId);
      const currentUnlocks = ensureUnlocksForStars(kidId, currentStars);
      
      setStars(currentStars);
      setStreak(currentStreak);
      setUnlocks(currentUnlocks);
    };

    updateProgress();
    // Update every second to catch changes from other components
    const interval = setInterval(updateProgress, 1000);
    return () => clearInterval(interval);
  }, [kidId]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          ⭐ Rewards
        </h2>
        <Link
          href={`/kids/${kidId}/shop`}
          className="text-sm text-[var(--ember-500)] hover:underline font-medium"
        >
          Shop →
        </Link>
      </div>
      
      <div className="space-y-4">
        {/* Stars */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">⭐</span>
            <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Stars</span>
          </div>
          <p className="text-3xl font-bold text-[var(--ember-500)]">{stars}</p>
        </div>

        {/* Streak */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🔥</span>
            <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Streak</span>
          </div>
          <div className="flex items-baseline gap-3">
            <div>
              <p className="text-2xl font-bold text-[var(--ember-500)]">{streak.current}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-600 dark:text-gray-400">{streak.best}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Best</p>
            </div>
          </div>
        </div>

        {/* Unlocks */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🏆</span>
            <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Unlocked Badges</span>
          </div>
          {unlocks.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {unlocks.map(unlockId => (
                <span
                  key={unlockId}
                  className="px-3 py-1 bg-[var(--fabric-gold)] text-[var(--ink-900)] rounded-full text-sm font-medium"
                >
                  Badge {unlockId.split('-').pop()}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Complete quests to unlock badges!</p>
          )}
        </div>
      </div>
    </div>
  );
}

