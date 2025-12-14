'use client';

import Link from 'next/link';
import Image from 'next/image';

interface ProgressCardProps {
  kidId: string;
  initialStars?: number;
  initialStreak?: { current: number; best: number };
  initialUnlocks?: string[];
}

export function ProgressCard({ 
  kidId, 
  initialStars = 0,
  initialStreak = { current: 0, best: 0 },
  initialUnlocks = []
}: ProgressCardProps) {
  const stars = initialStars;
  const streak = initialStreak;
  const unlocks = initialUnlocks;


  return (
    <div className="card p-5">
      {/* Header - Rewards SVG */}
      <Image 
        src="/assets/titles/rewards.svg" 
        alt="Rewards" 
        width={120} 
        height={35}
        className="h-7 w-auto mb-4 dark:brightness-110"
      />
      
      {/* Stats Grid - Stars and Streak side by side */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Stars - Yellow/Gold background to match star */}
        <div className="bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 border border-yellow-200 dark:border-yellow-800/50 rounded-xl p-4 text-center">
          <div className="text-3xl mb-1">⭐</div>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stars}</p>
          <p className="text-xs text-yellow-700/70 dark:text-yellow-400/70 font-medium">Stars</p>
        </div>

        {/* Streak - Red/Orange background to match fire */}
        <div className="bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 border border-red-200 dark:border-red-800/50 rounded-xl p-4 text-center">
          <div className="text-3xl mb-1">🔥</div>
          <p className="text-2xl font-bold text-red-500 dark:text-red-400">{streak.current}</p>
          <p className="text-xs text-red-700/70 dark:text-red-400/70 font-medium">
            Day Streak <span className="opacity-70">({streak.best} best)</span>
          </p>
        </div>
      </div>

      {/* Unlocks */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Image 
            src="/assets/titles/badges.svg" 
            alt="Badges" 
            width={80} 
            height={25}
            className="h-5 w-auto dark:brightness-110"
          />
        </div>
        {unlocks.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {unlocks.map(unlockId => (
              <span
                key={unlockId}
                className="px-2 py-0.5 bg-[var(--fabric-gold)] text-[var(--ink-900)] rounded-full text-xs font-medium"
              >
                🏅 {unlockId.split('-').pop()}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">
            Complete quests to earn badges!
          </p>
        )}
      </div>

      {/* Shop Button - Teal/Green to match SHOP text color */}
      <Link
        href={`/kids/${kidId}/shop`}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-100 to-emerald-100 hover:from-teal-200 hover:to-emerald-200 dark:from-teal-900/30 dark:to-emerald-900/30 dark:hover:from-teal-900/50 dark:hover:to-emerald-900/50 border-2 border-teal-300 dark:border-teal-700 rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow-md"
      >
        <Image 
          src="/assets/titles/shop.svg" 
          alt="Visit Shop" 
          width={100} 
          height={30}
          className="h-6 w-auto dark:brightness-110"
        />
      </Link>
    </div>
  );
}

