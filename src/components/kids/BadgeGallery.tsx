'use client';

import { useState, useEffect, useRef } from 'react';
import { Lock, Medal, Sparkle } from '@phosphor-icons/react';
import { 
  Badge, 
  ALL_BADGES, 
  MILESTONE_BADGES, 
  SUBJECT_BADGE_GROUPS,
  SPECIAL_BADGES,
  getEarnedMilestoneBadges,
  getEarnedSubjectBadges,
  getEarnedStreakBadges,
  getEarnedJournalBadges,
  getBadgeById
} from '@/lib/badges';
import { getStars, getUnlocks } from '@/lib/progressState';
import { BadgeUnlockModal } from './BadgeUnlockModal';
import { toast } from 'sonner';

interface BadgeGalleryProps {
  kidId: string;
  subjectCounts?: Record<string, number>;
  currentStreak?: number;
  bestStreak?: number;
  journalCount?: number;
}

interface BadgeCardProps {
  badge: Badge;
  isEarned: boolean;
  progress?: { current: number; target: number };
  isFeatured?: boolean;
  onToggleFeatured?: () => void;
}

function BadgeCard({ badge, isEarned, progress, isFeatured, onToggleFeatured }: BadgeCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const Icon = badge.icon;
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div 
        className={`
          relative p-3 rounded-xl border-2 transition-all text-center cursor-pointer
          ${isEarned 
            ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md' 
            : 'bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50 opacity-60'
          }
          ${isFeatured ? 'ring-2 ring-purple-400 ring-offset-2 dark:ring-offset-gray-900' : ''}
        `}
        onClick={() => isEarned && onToggleFeatured?.()}
      >
        {/* Lock overlay for unearned badges */}
        {!isEarned && (
          <div className="absolute top-1 right-1">
            <Lock size={12} weight="fill" className="text-gray-400" />
          </div>
        )}
        
        {/* Featured star */}
        {isFeatured && (
          <div className="absolute -top-1 -right-1">
            <Sparkle size={16} weight="fill" className="text-purple-400" />
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
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg text-center">
          <p className="text-white text-sm font-semibold mb-1">{badge.name}</p>
          <p className="text-gray-300 text-xs mb-2">{badge.description}</p>
          {progress && !isEarned && (
            <div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden mb-1">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  style={{ width: `${Math.min(100, (progress.current / progress.target) * 100)}%` }}
                />
              </div>
              <p className="text-gray-400 text-xs">{progress.current} / {progress.target}</p>
            </div>
          )}
          {isEarned && onToggleFeatured && (
            <p className="text-purple-400 text-xs mt-1">
              {isFeatured ? 'Click to remove from featured' : 'Click to add to featured'}
            </p>
          )}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
        </div>
      )}
    </div>
  );
}

interface BadgeSectionProps {
  title: string;
  badges: Badge[];
  earnedIds: string[];
  featuredBadgeIds: string[];
  onToggleFeatured: (badgeId: string) => void;
  subjectCounts?: Record<string, number>;
  subjectKey?: string;
}

function BadgeSection({ title, badges, earnedIds, featuredBadgeIds, onToggleFeatured, subjectCounts }: BadgeSectionProps) {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        {title}
      </h4>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2">
        {badges.map(badge => {
          const isEarned = earnedIds.includes(badge.id);
          let progress: { current: number; target: number } | undefined;
          
          // Calculate progress for subject badges
          if (badge.criteria?.type === 'subject' && badge.criteria.subject && badge.criteria.threshold && subjectCounts) {
            const current = subjectCounts[badge.criteria.subject] || 0;
            progress = { current, target: badge.criteria.threshold };
          }
          
          return (
            <BadgeCard 
              key={badge.id} 
              badge={badge} 
              isEarned={isEarned}
              progress={progress}
              isFeatured={featuredBadgeIds.includes(badge.id)}
              onToggleFeatured={() => onToggleFeatured(badge.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

export function BadgeGallery({ 
  kidId, 
  subjectCounts = {}, 
  currentStreak = 0, 
  bestStreak = 0, 
  journalCount = 0
}: BadgeGalleryProps) {
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [featuredBadgeIds, setFeaturedBadgeIds] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [celebrateBadge, setCelebrateBadge] = useState<string | null>(null);
  const previousBadgesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setIsClient(true);
    
    // Fetch featured badges from API
    async function fetchFeaturedBadges() {
      try {
        const res = await fetch(`/api/kids/${kidId}/featured-badges`);
        if (res.ok) {
          const data = await res.json();
          setFeaturedBadgeIds(data.featuredBadges || []);
        }
      } catch (error) {
        console.error('Failed to fetch featured badges:', error);
      }
    }
    
    fetchFeaturedBadges();
    
    const updateBadges = () => {
      // Get current unlocks from localStorage/db
      const unlocks = getUnlocks(kidId);
      const moons = getStars(kidId);
      
      // Calculate earned badges using helper functions
      const hasCompletedFirst = moons > 0 || unlocks.length > 0;
      const milestoneBadges = getEarnedMilestoneBadges(moons, hasCompletedFirst);
      const subjectBadges = getEarnedSubjectBadges(subjectCounts);
      const streakBadges = getEarnedStreakBadges(currentStreak, bestStreak);
      const journalBadges = getEarnedJournalBadges(journalCount);
      
      const earned = [
        ...unlocks,
        ...milestoneBadges,
        ...subjectBadges,
        ...streakBadges,
        ...journalBadges
      ];
      
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
  }, [kidId, subjectCounts, currentStreak, bestStreak, journalCount, isClient]);

  // Toggle featured badge
  const toggleFeaturedBadge = async (badgeId: string) => {
    const isCurrentlyFeatured = featuredBadgeIds.includes(badgeId);
    const isEarned = earnedBadgeIds.includes(badgeId);

    
    if (!isEarned) {
      toast.error('You must earn this badge first!');
      return;
    }

    let newFeaturedBadges: string[];
    
    if (isCurrentlyFeatured) {
      // Remove from featured
      newFeaturedBadges = featuredBadgeIds.filter(id => id !== badgeId);
    } else {
      // Add to featured (max 3)
      if (featuredBadgeIds.length >= 3) {
        toast.error('You can only feature 3 badges at a time!');
        return;
      }
      newFeaturedBadges = [...featuredBadgeIds, badgeId];
    }

    // Update locally first for instant feedback
    setFeaturedBadgeIds(newFeaturedBadges);

    // Save to API
    try {
      const res = await fetch(`/api/kids/${kidId}/featured-badges`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featuredBadges: newFeaturedBadges }),
      });

      if (!res.ok) {
        throw new Error('Failed to update featured badges');
      }

      const badge = getBadgeById(badgeId);
      if (isCurrentlyFeatured) {
        toast.success(`Removed "${badge?.name}" from featured!`);
      } else {
        toast.success(`Added "${badge?.name}" to featured! ✨`);
      }
    } catch (error) {
      console.error('Failed to update featured badges:', error);
      toast.error('Failed to update featured badges');
      // Revert on error
      setFeaturedBadgeIds(featuredBadgeIds);
    }
  };

  const earnedCount = earnedBadgeIds.length;
  const totalCount = ALL_BADGES.length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Medal size={20} weight="duotone" className="text-amber-500" />
          My Badges
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {isClient ? earnedCount : 0} / {totalCount} collected
        </span>
      </div>

      {/* Milestone Badges */}
      <BadgeSection 
        title="Milestones" 
        badges={MILESTONE_BADGES} 
        earnedIds={earnedBadgeIds}
        featuredBadgeIds={featuredBadgeIds}
        onToggleFeatured={toggleFeaturedBadge}
      />
      
      {/* Subject Badges - dynamically rendered */}
      {SUBJECT_BADGE_GROUPS.map(group => (
        <BadgeSection 
          key={group.key}
          title={group.name} 
          badges={group.badges} 
          earnedIds={earnedBadgeIds}
          subjectCounts={subjectCounts}
          subjectKey={group.key}
          featuredBadgeIds={featuredBadgeIds}
          onToggleFeatured={toggleFeaturedBadge}
        />
      ))}
      
      {/* Special Badges */}
      <BadgeSection 
        title="Special Achievements" 
        badges={SPECIAL_BADGES} 
        earnedIds={earnedBadgeIds}
        featuredBadgeIds={featuredBadgeIds}
        onToggleFeatured={toggleFeaturedBadge}    
      />
      
      {/* Badge unlock celebration modal */}
      <BadgeUnlockModal 
        badgeId={celebrateBadge} 
        onClose={() => setCelebrateBadge(null)} 
      />
    </div>
  );
}
