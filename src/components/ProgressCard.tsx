'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Moon, Confetti, CheckCircle, ShoppingCart, Medal } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ProgressCardProps {
  kidId: string;
  initialStars?: number;
  todayCompleted?: number;
  todayTotal?: number;
  initialUnlocks?: string[];
}

export function ProgressCard({ 
  kidId, 
  initialStars = 0,
  todayCompleted = 0,
  todayTotal = 0,
  initialUnlocks = []
}: ProgressCardProps) {
  // Fetch moons via API (handles kid sessions properly)
  const [stars, setStars] = useState(initialStars);
  const unlocks = initialUnlocks;
  
  useEffect(() => {
    async function fetchMoons() {
      try {
        const res = await fetch(`/api/kids/${kidId}/moons`);
        if (res.ok) {
          const data = await res.json();
          if (data.moons !== undefined) {
            setStars(data.moons);
          }
        }
      } catch (error) {
        console.error('[ProgressCard] Failed to fetch moons:', error);
      }
    }
    
    fetchMoons();
  }, [kidId]);
  
  const allDone = todayTotal > 0 && todayCompleted === todayTotal;

  return (
    <div className="card p-4">
      {/* Centered stats row */}
      <div className="flex items-center justify-center gap-6">
        
        {/* Moons - Larger, centered */}
        <div className="flex flex-col items-center gap-1 px-6 py-3 rounded-xl bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 border border-yellow-200 dark:border-yellow-800/50">
          <div className="flex items-center gap-2">
            <Moon size={24} weight="fill" className="text-yellow-500" />
            <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stars}</span>
          </div>
          <span className="text-xs text-yellow-700/70 dark:text-yellow-400/70 font-medium">Moons</span>
        </div>

        {/* Today's Progress - Larger, centered */}
        <div className={cn(
          "flex flex-col items-center gap-1 px-6 py-3 rounded-xl border",
          allDone 
            ? "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-green-300 dark:border-green-700" 
            : "bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 border-teal-200 dark:border-teal-800/50"
        )}>
          <div className="flex items-center gap-2">
            {allDone 
              ? <Confetti size={24} weight="fill" className="text-green-500" />
              : <CheckCircle size={24} weight="duotone" className="text-teal-500" />
            }
            <span className={cn(
              "text-2xl font-bold",
              allDone ? "text-green-600 dark:text-green-400" : "text-teal-600 dark:text-teal-400"
            )}>
              {todayCompleted}/{todayTotal}
            </span>
          </div>
          <span className={cn(
            "text-xs font-medium",
            allDone ? "text-green-700/70 dark:text-green-400/70" : "text-teal-700/70 dark:text-teal-400/70"
          )}>
            {allDone ? "All Done!" : "Today's Quests"}
          </span>
        </div>

        {/* Shop Button */}
        <Link
          href={`/kids/${kidId}/shop`}
          className="flex flex-col items-center gap-1 px-6 py-3 bg-gradient-to-br from-teal-100 to-emerald-100 hover:from-teal-200 hover:to-emerald-200 dark:from-teal-900/30 dark:to-emerald-900/30 border border-teal-300 dark:border-teal-700 rounded-xl transition-all"
        >
          <ShoppingCart size={28} weight="duotone" className="text-teal-600 dark:text-teal-400" />
          <span className="text-xs font-medium text-teal-700 dark:text-teal-300">Shop</span>
        </Link>
      </div>

      {/* Badges row - only if there are badges */}
      {unlocks.length > 0 && (
        <div className="flex items-center justify-center gap-2 flex-wrap mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">Badges:</span>
          {unlocks.map(unlockId => (
            <span
              key={unlockId}
              className="px-2 py-0.5 bg-[var(--fabric-gold)] text-[var(--ink-900)] rounded-full text-xs font-medium flex items-center gap-1"
            >
              <Medal size={12} weight="fill" />
              {unlockId.split('-').pop()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
