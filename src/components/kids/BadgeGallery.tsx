'use client';

import { useState, useEffect } from 'react';
import { Lock } from '@phosphor-icons/react';
import { Badge, ALL_BADGES, MILESTONE_BADGES, READING_BADGES, WRITING_BADGES, MATH_BADGES, SCIENCE_BADGES, IDENTITY_BADGES } from '@/lib/badges';
import { getStars, getUnlocks } from '@/lib/progressState';

interface BadgeGalleryProps {
  kidId: string;
}

interface BadgeCardProps {
  badge: Badge;
  isEarned: boolean;
}

function BadgeCard({ badge, isEarned }: BadgeCardProps) {
  const Icon = badge.icon;
  
  return (
    <div 
      className={`
        relative p-3 rounded-xl border-2 transition-all text-center
        ${isEarned 
          ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm' 
          : 'bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50 opacity-60'
        }
      `}
      title={isEarned ? badge.description : `Locked: ${badge.description}`}
    >
      {/* Lock overlay for unearned badges */}
      {!isEarned && (
        <div className="absolute top-1 right-1">
          <Lock size={12} weight="fill" className="text-gray-400" />
        </div>
      )}
      
      {/* Badge Icon */}
      <div className={`
        w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2
        ${isEarned 
          ? 'bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30' 
          : 'bg-gray-200 dark:bg-gray-700'
        }
      `}>
        <Icon 
          size={24} 
          weight={isEarned ? 'fill' : 'regular'} 
          className={isEarned ? badge.color : 'text-gray-400 dark:text-gray-500'} 
        />
      </div>
      
      {/* Badge Name */}
      <p className={`
        text-xs font-medium truncate
        ${isEarned ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}
      `}>
        {badge.name}
      </p>
    </div>
  );
}

interface BadgeSectionProps {
  title: string;
  badges: Badge[];
  earnedIds: string[];
}

function BadgeSection({ title, badges, earnedIds }: BadgeSectionProps) {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        {title}
      </h4>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
        {badges.map(badge => (
          <BadgeCard 
            key={badge.id} 
            badge={badge} 
            isEarned={earnedIds.includes(badge.id)} 
          />
        ))}
      </div>
    </div>
  );
}

export function BadgeGallery({ kidId }: BadgeGalleryProps) {
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const updateBadges = () => {
      // Get current unlocks from localStorage
      const unlocks = getUnlocks(kidId);
      const moons = getStars(kidId);
      
      // Combine: unlocks from shop + milestone badges from moons
      const earned = [...unlocks];
      
      // Add milestone badges based on moons
      if (moons >= 10) earned.push('star-collector');
      if (moons >= 50) earned.push('moonlit');
      if (moons >= 100) earned.push('lunar-legend');
      
      // "First Sprout" badge if they've earned any moons at all
      if (moons > 0) earned.push('first-sprout');
      
      setEarnedBadgeIds([...new Set(earned)]); // Dedupe
    };
    
    updateBadges();
    
    // Poll for changes
    const interval = setInterval(updateBadges, 2000);
    
    return () => clearInterval(interval);
  }, [kidId]);

  const earnedCount = earnedBadgeIds.length;
  const totalCount = ALL_BADGES.length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          🏅 My Badges
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {isClient ? earnedCount : 0} / {totalCount} collected
        </span>
      </div>

      {/* Badge Sections */}
      <BadgeSection 
        title="Milestones" 
        badges={MILESTONE_BADGES} 
        earnedIds={earnedBadgeIds} 
      />
      
      <BadgeSection 
        title="Reading" 
        badges={READING_BADGES} 
        earnedIds={earnedBadgeIds} 
      />
      
      <BadgeSection 
        title="Writing" 
        badges={WRITING_BADGES} 
        earnedIds={earnedBadgeIds} 
      />
      
      <BadgeSection 
        title="Math & Logic" 
        badges={MATH_BADGES} 
        earnedIds={earnedBadgeIds} 
      />
      
      <BadgeSection 
        title="Science" 
        badges={SCIENCE_BADGES} 
        earnedIds={earnedBadgeIds} 
      />
      
      <BadgeSection 
        title="Collection" 
        badges={IDENTITY_BADGES} 
        earnedIds={earnedBadgeIds} 
      />
    </div>
  );
}
