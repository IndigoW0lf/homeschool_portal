'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Moon, Confetti, CheckCircle, ShoppingCart, Sparkle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { getBadgeById } from '@/lib/badges';

interface ProgressCardProps {
  kidId: string;
  initialStars?: number;
  todayCompleted?: number;
  todayTotal?: number;
  featuredBadges?: string[];
  streakEnabled?: boolean;
}

export function ProgressCard({ 
  kidId, 
  initialStars = 0,
  todayCompleted = 0,
  todayTotal = 0,
  featuredBadges = [],
  streakEnabled = true
}: ProgressCardProps) {
  // Fetch moons via API (handles kid sessions properly)
  const [stars, setStars] = useState(initialStars);
  
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

  // Get badge details
  const featuredBadgeData = featuredBadges
    .map(id => getBadgeById(id))
    .filter(Boolean)
    .slice(0, 3); // Max 3

  return (
    <div className="card p-4 space-y-4">
      {/* Stats row - flex to fill space evenly */}
      <div className="flex items-center gap-3">
        
        {/* Moons */}
        <div className="flex-1 flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 border border-yellow-200  dark:border-yellow-800/50">
          <div className="flex items-center gap-2">
            <Moon size={24} weight="fill" className="text-yellow-500" />
            <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stars}</span>
          </div>
          <span className="text-xs text-yellow-700/70 dark:text-yellow-400/70 font-medium">Moons</span>
        </div>

        {/* Today's Progress */}
        <div className={cn(
          "flex-1 flex flex-col items-center gap-1 px-4 py-3 rounded-xl border",
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
          className="flex-1 flex flex-col items-center gap-1 px-4 py-3 bg-gradient-to-br from-teal-100 to-emerald-100 hover:from-teal-200 hover:to-emerald-200 dark:from-teal-900/30 dark:to-emerald-900/30 border border-teal-300 dark:border-teal-700 rounded-xl transition-all"
        >
          <ShoppingCart size={28} weight="duotone" className="text-teal-600 dark:text-teal-400" />
          <span className="text-xs font-medium text-teal-700 dark:text-teal-300">Shop</span>
        </Link>
      </div>

      {/* Featured Badges - only if at least 1 is set */}
      {featuredBadgeData.length > 0 && (
        <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              My Featured Badges
            </h4>
            <Link
              href={`/kids/${kidId}/profile#badges`}
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
            >
              Manage
            </Link>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {featuredBadgeData.map((badge) => {
              if (!badge) return null;
              const Icon = badge.icon;
              
              return (
                <div
                  key={badge.id}
                  className="group relative p-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">
                    {/* Badge Icon */}
                    <div className={`
                      flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                      bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30
                    `}>
                      <Icon size={28} weight="fill" className={badge.color} />
                    </div>
                    
                    {/* Badge Info */}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1">
                        {badge.name}
                        <Sparkle size={12} weight="fill" className="text-yellow-500" />
                      </h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Hover tooltip for full description */}
                  <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 dark:bg-gray-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <p className="text-white text-sm font-semibold mb-1">{badge.name}</p>
                    <p className="text-gray-300 text-xs">{badge.description}</p>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
