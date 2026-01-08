'use client';

import { useState, useEffect } from 'react';
import { Moon } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase/browser';
import Link from 'next/link';

interface MoonsCounterProps {
  kidId: string;
  size?: 'sm' | 'md';
  showLink?: boolean;
}

/**
 * Displays the kid's current moon balance.
 * Fetches from database (source of truth).
 */
export function MoonsCounter({ kidId, size = 'sm', showLink = false }: MoonsCounterProps) {
  const [moons, setMoons] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMoons() {
      setIsLoading(true);
      const { data } = await supabase
        .from('student_progress')
        .select('total_stars')
        .eq('kid_id', kidId)
        .single();
      
      setMoons(data?.total_stars || 0);
      setIsLoading(false);
    }
    
    fetchMoons();
  }, [kidId]);

  const content = (
    <div className={`
      flex items-center gap-1.5 rounded-lg transition-all
      ${size === 'sm' 
        ? 'px-2 py-1' 
        : 'px-3 py-2'
      }
      ${showLink 
        ? 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30 cursor-pointer' 
        : ''
      }
      bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20
      border border-yellow-200 dark:border-yellow-800/50
    `}>
      <Moon 
        size={size === 'sm' ? 16 : 20} 
        weight="fill" 
        className="text-yellow-500" 
      />
      <span className={`
        font-bold text-yellow-600 dark:text-yellow-400
        ${size === 'sm' ? 'text-sm' : 'text-base'}
      `}>
        {isLoading ? '—' : moons}
      </span>
    </div>
  );

  if (showLink) {
    return (
      <Link href={`/kids/${kidId}/shop`} title="Visit the Moon Shop">
        {content}
      </Link>
    );
  }

  return content;
}
