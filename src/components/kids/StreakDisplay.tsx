'use client';

import { useState, useEffect } from 'react';
import { Flame, Fire } from '@phosphor-icons/react';
import { getStreak } from '@/lib/progressState';

interface StreakDisplayProps {
  kidId: string;
}

export function StreakDisplay({ kidId }: StreakDisplayProps) {
  const [streak, setStreak] = useState({ current: 0, best: 0 });

  useEffect(() => {
    const updateStreak = () => {
      const data = getStreak(kidId);
      setStreak({ current: data.current, best: data.best });
    };
    updateStreak();
    const interval = setInterval(updateStreak, 5000);
    return () => clearInterval(interval);
  }, [kidId]);

  // Generate flame icons based on streak
  const flameCount = Math.min(streak.current, 7); // Cap visual at 7

  return (
    <div className="bg-gradient-to-r from-orange-100 via-amber-100 to-yellow-100 dark:from-orange-900/30 dark:via-amber-900/30 dark:to-yellow-900/30 rounded-xl p-4 border border-orange-200 dark:border-orange-800/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/20">
            <Fire size={24} weight="fill" className="text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-orange-700/80 dark:text-orange-400/80 font-medium">
              Current Streak
            </p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {streak.current} day{streak.current !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Flame visualization */}
        <div className="flex items-center gap-0.5">
          {[...Array(flameCount)].map((_, i) => (
            <Flame 
              key={i}
              size={20} 
              weight="fill" 
              className="text-orange-500"
              style={{ 
                opacity: 0.5 + (i * 0.08),
                transform: `scale(${0.8 + i * 0.05})`,
              }}
            />
          ))}
          {streak.current > 7 && (
            <span className="text-sm font-bold text-orange-500 ml-1">
              +{streak.current - 7}
            </span>
          )}
        </div>
      </div>

      {/* Best streak */}
      {streak.best > 0 && (
        <div className="mt-2 pt-2 border-t border-orange-200 dark:border-orange-800/50">
          <p className="text-xs text-orange-600/70 dark:text-orange-400/70">
            🏆 Best streak: <span className="font-bold">{streak.best} days</span>
          </p>
        </div>
      )}
    </div>
  );
}
