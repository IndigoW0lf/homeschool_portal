'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Moon, Confetti, CheckCircle, Medal } from '@phosphor-icons/react';
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
    <div className="card p-5">
      {/* Header - Rewards SVG */}
      <Image 
        src="/assets/titles/rewards.svg" 
        alt="Rewards" 
        width={120} 
        height={35}
        className="h-7 w-auto mb-4 dark:brightness-110"
      />
      
      {/* Stats Grid - Moons and Today's Progress side by side */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Moons - Yellow/Gold background to match moon */}
        <div className="bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 border border-yellow-200 dark:border-yellow-800/50 rounded-xl p-4 text-center">
          <Moon size={32} weight="fill" className="mx-auto mb-1 text-yellow-500" />
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stars}</p>
          <p className="text-xs text-yellow-700/70 dark:text-yellow-400/70 font-medium">Moons</p>
        </div>

        {/* Today's Progress - Green when all done, otherwise teal */}
        <div className={cn(
          "rounded-xl p-4 text-center border transition-all relative overflow-hidden",
          allDone 
            ? "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-green-300 dark:border-green-700" 
            : "bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 border-teal-200 dark:border-teal-800/50"
        )}>
          
          <div className="mb-1">
            {allDone 
              ? <Confetti size={32} weight="fill" className="mx-auto text-green-500" />
              : <CheckCircle size={32} weight="duotone" className="mx-auto text-teal-500" />
            }
          </div>
          <p className={cn(
            "text-2xl font-bold",
            allDone 
              ? "text-green-600 dark:text-green-400" 
              : "text-teal-600 dark:text-teal-400"
          )}>
            {todayCompleted}/{todayTotal}
          </p>
          <p className={cn(
            "text-xs font-medium",
            allDone 
              ? "text-green-700/70 dark:text-green-400/70" 
              : "text-teal-700/70 dark:text-teal-400/70"
          )}>
            {allDone ? "All Done!" : "Today's Quests"}
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
                className="px-2 py-0.5 bg-[var(--fabric-gold)] text-[var(--ink-900)] rounded-full text-xs font-medium flex items-center gap-1"
              >
                <Medal size={14} weight="fill" />
                {unlockId.split('-').pop()}
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
        className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-teal-100 to-emerald-100 hover:from-teal-200 hover:to-emerald-200 dark:from-teal-900/30 dark:to-emerald-900/30 dark:hover:from-teal-900/50 dark:hover:to-emerald-900/50 border-2 border-teal-300 dark:border-teal-700 rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow-md"
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
