'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Moon, Confetti, CheckCircle, Medal, ShoppingCart } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/browser';

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
  // Fetch moons from database (source of truth)
  const [stars, setStars] = useState(initialStars);
  const unlocks = initialUnlocks;
  
  useEffect(() => {
    async function fetchMoons() {
      const { data } = await supabase
        .from('student_progress')
        .select('total_stars')
        .eq('kid_id', kidId)
        .single();
      
      if (data?.total_stars !== undefined) {
        setStars(data.total_stars);
      }
    }
    
    fetchMoons();
  }, [kidId]);
  
  const allDone = todayTotal > 0 && todayCompleted === todayTotal;

  return (
    <div className="card p-4">
      {/* Compact header with stats inline */}
      <div className="flex items-center gap-4 mb-3">
        {/* Rewards Title */}
        <Image 
          src="/assets/titles/rewards.svg" 
          alt="Rewards" 
          width={100} 
          height={30}
          className="h-6 w-auto dark:brightness-110"
        />
        
        {/* Moons - Compact inline */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 border border-yellow-200 dark:border-yellow-800/50">
          <Moon size={18} weight="fill" className="text-yellow-500" />
          <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{stars}</span>
        </div>

        {/* Today's Progress - Compact inline */}
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border",
          allDone 
            ? "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-green-300 dark:border-green-700" 
            : "bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 border-teal-200 dark:border-teal-800/50"
        )}>
          {allDone 
            ? <Confetti size={18} weight="fill" className="text-green-500" />
            : <CheckCircle size={18} weight="duotone" className="text-teal-500" />
          }
          <span className={cn(
            "text-lg font-bold",
            allDone ? "text-green-600 dark:text-green-400" : "text-teal-600 dark:text-teal-400"
          )}>
            {todayCompleted}/{todayTotal}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Shop Button - Compact */}
        <Link
          href={`/kids/${kidId}/shop`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-100 to-emerald-100 hover:from-teal-200 hover:to-emerald-200 dark:from-teal-900/30 dark:to-emerald-900/30 border border-teal-300 dark:border-teal-700 rounded-lg transition-all text-sm font-medium text-teal-700 dark:text-teal-300"
        >
          <ShoppingCart size={16} weight="duotone" />
          Shop
        </Link>
      </div>

      {/* Badges - Compact row */}
      {unlocks.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
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
