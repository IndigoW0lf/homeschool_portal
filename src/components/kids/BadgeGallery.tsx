'use client';

import { useState, useEffect, useRef } from 'react';
import { Lock } from '@phosphor-icons/react';
import { Badge, ALL_BADGES, MILESTONE_BADGES, READING_BADGES, WRITING_BADGES, MATH_BADGES, SCIENCE_BADGES, IDENTITY_BADGES } from '@/lib/badges';
import { getStars, getUnlocks } from '@/lib/progressState';
import { BadgeUnlockModal } from './BadgeUnlockModal';

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
export function BadgeGallery({ kidId, subjectCounts = {} }: BadgeGalleryProps & { subjectCounts?: Record<string, number> }) {
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [celebrateBadge, setCelebrateBadge] = useState<string | null>(null);
  const previousBadgesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setIsClient(true);
    
    const updateBadges = () => {
      // Get current unlocks from localStorage/db
      const unlocks = getUnlocks(kidId);
      const moons = getStars(kidId);
      
      // Start with earned list
      const earned = [...unlocks];
      
      // 1. Milestone Badges (Moons)
      if (moons >= 10) earned.push('star-collector');
      if (moons >= 50) earned.push('moonlit');
      if (moons >= 100) earned.push('lunar-legend');
      if (moons > 0 || unlocks.length > 0) earned.push('first-sprout');

      // 2. Subject Badges (Counts)
      // Reading
      if ((subjectCounts['reading'] || 0) >= 25) earned.push('reading-25');
      if ((subjectCounts['reading'] || 0) >= 50) earned.push('reading-50');
      if ((subjectCounts['reading'] || 0) >= 75) earned.push('reading-75');
      if ((subjectCounts['reading'] || 0) >= 100) earned.push('reading-100');

      // Writing
      if ((subjectCounts['writing'] || 0) >= 25) earned.push('writing-25');
      if ((subjectCounts['writing'] || 0) >= 50) earned.push('writing-50');
      if ((subjectCounts['writing'] || 0) >= 75) earned.push('writing-75');
      if ((subjectCounts['writing'] || 0) >= 100) earned.push('writing-100');

      // Math
      if ((subjectCounts['math'] || 0) >= 25) earned.push('math-25');
      if ((subjectCounts['math'] || 0) >= 50) earned.push('math-50');
      if ((subjectCounts['math'] || 0) >= 75) earned.push('math-75');
      if ((subjectCounts['math'] || 0) >= 100) earned.push('math-100');

      // Science
      if ((subjectCounts['science'] || 0) >= 25) earned.push('science-25');
      if ((subjectCounts['science'] || 0) >= 50) earned.push('science-50');
      if ((subjectCounts['science'] || 0) >= 75) earned.push('science-75');
      if ((subjectCounts['science'] || 0) >= 100) earned.push('science-100');
      
      const uniqueEarned = [...new Set(earned)];
      
      // Check for NEW badges to celebrate
      const seenBadgesKey = `lunara_seen_badges_${kidId}`;
      const seenBadges = new Set(JSON.parse(localStorage.getItem(seenBadgesKey) || '[]'));
      
      // Find first new badge (not seen before)
      const newBadge = uniqueEarned.find(id => !seenBadges.has(id) && !previousBadgesRef.current.has(id));
      
      if (newBadge && isClient) {
        // Mark as seen so we don't celebrate again
        seenBadges.add(newBadge);
        localStorage.setItem(seenBadgesKey, JSON.stringify([...seenBadges]));
        setCelebrateBadge(newBadge);
      }
      
      previousBadgesRef.current = new Set(uniqueEarned);
      setEarnedBadgeIds(uniqueEarned);
    };
    
    updateBadges();
    
    // Poll for changes
    const interval = setInterval(updateBadges, 2000);
    
    return () => clearInterval(interval);
  }, [kidId, subjectCounts]);

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
      
      {/* Badge unlock celebration modal */}
      <BadgeUnlockModal 
        badgeId={celebrateBadge} 
        onClose={() => setCelebrateBadge(null)} 
      />
    </div>
  );
}
