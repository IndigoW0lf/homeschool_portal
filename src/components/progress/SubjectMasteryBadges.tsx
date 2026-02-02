'use client';

import { Trophy } from '@phosphor-icons/react';
import { SUBJECT_BADGE_GROUPS, type Badge } from '@/lib/badges';

interface SubjectMasteryBadgesProps {
  subjectCounts: Record<string, number>;
}

// Map our internal subject keys to badge system keys
const SUBJECT_KEY_MAP: Record<string, string> = {
  'reading': 'reading',
  'writing': 'writing',
  'math': 'math',
  'math & logic': 'math',
  'science': 'science',
  'social_studies': 'social_studies',
  'social studies': 'social_studies',
  'arts': 'arts',
  'computer_science': 'computer_science',
  'computer science': 'computer_science',
  'pe': 'pe',
  'pe & movement': 'pe',
  'life_skills': 'life_skills',
  'life skills': 'life_skills',
  'electives': 'arts', // Map electives to arts
};

// Convert Tailwind text color classes to CSS color values
const COLOR_MAP: Record<string, string> = {
  'text-amber-600': '#d97706',
  'text-amber-500': '#f59e0b',
  'text-amber-400': '#fbbf24',
  'text-amber-300': '#fcd34d',
  'text-blue-600': '#2563eb',
  'text-blue-500': '#3b82f6',
  'text-blue-400': '#60a5fa',
  'text-blue-300': '#93c5fd',
  'text-purple-600': '#9333ea',
  'text-purple-500': '#a855f7',
  'text-purple-400': '#c084fc',
  'text-purple-300': '#d8b4fe',
  'text-green-600': '#16a34a',
  'text-green-500': '#22c55e',
  'text-green-400': '#4ade80',
  'text-green-300': '#86efac',
  'text-orange-600': '#ea580c',
  'text-orange-500': '#f97316',
  'text-orange-400': '#fb923c',
  'text-orange-300': '#fdba74',
  'text-rose-600': '#e11d48',
  'text-rose-500': '#f43f5e',
  'text-rose-400': '#fb7185',
  'text-rose-300': '#fda4af',
  'text-cyan-600': '#0891b2',
  'text-cyan-500': '#06b6d4',
  'text-cyan-400': '#22d3ee',
  'text-cyan-300': '#67e8f9',
  'text-red-600': '#dc2626',
  'text-red-500': '#ef4444',
  'text-red-400': '#f87171',
  'text-red-300': '#fca5a5',
  'text-pink-600': '#db2777',
  'text-pink-500': '#ec4899',
  'text-pink-400': '#f472b6',
  'text-pink-300': '#f9a8d4',
};

function getProgressBarColor(colorClass?: string): string {
  if (!colorClass) return '#f59e0b'; // amber-500 default
  return COLOR_MAP[colorClass] || '#f59e0b';
}

function normalizeSubjectKey(key: string): string {
  const lowered = key.toLowerCase();
  return SUBJECT_KEY_MAP[lowered] || lowered;
}

// Get the highest earned badge and next badge for a subject
function getSubjectBadgeProgress(subjectKey: string, count: number): {
  currentBadge: Badge | null;
  nextBadge: Badge | null;
  progress: number;
  currentThreshold: number;
  nextThreshold: number;
} {
  const group = SUBJECT_BADGE_GROUPS.find(g => g.key === subjectKey);
  if (!group) {
    return { currentBadge: null, nextBadge: null, progress: 0, currentThreshold: 0, nextThreshold: 10 };
  }

  const thresholds = [10, 25, 50, 75, 100, 150, 200];
  let currentBadge: Badge | null = null;
  let nextBadge: Badge | null = null;
  let currentThreshold = 0;
  let nextThreshold = 10;

  for (let i = 0; i < thresholds.length; i++) {
    if (count >= thresholds[i]) {
      currentBadge = group.badges[i];
      currentThreshold = thresholds[i];
      nextThreshold = thresholds[i + 1] || thresholds[i];
      nextBadge = group.badges[i + 1] || null;
    } else {
      if (!currentBadge) {
        nextBadge = group.badges[0];
        nextThreshold = thresholds[0];
      }
      break;
    }
  }

  // Calculate progress to next badge
  const progressStart = currentThreshold;
  const progressEnd = nextThreshold;
  const progress = nextBadge 
    ? Math.min(((count - progressStart) / (progressEnd - progressStart)) * 100, 100)
    : 100; // Maxed out

  return { currentBadge, nextBadge, progress, currentThreshold, nextThreshold };
}

export function SubjectMasteryBadges({ subjectCounts }: SubjectMasteryBadgesProps) {
  // Normalize and aggregate counts by badge subject keys
  const normalizedCounts: Record<string, number> = {};
  
  for (const [key, count] of Object.entries(subjectCounts)) {
    const normalizedKey = normalizeSubjectKey(key);
    normalizedCounts[normalizedKey] = (normalizedCounts[normalizedKey] || 0) + count;
  }

  // Get badge progress for each subject group
  const subjectProgress = SUBJECT_BADGE_GROUPS.map(group => {
    const count = normalizedCounts[group.key] || 0;
    const { currentBadge, nextBadge, progress, currentThreshold, nextThreshold } = 
      getSubjectBadgeProgress(group.key, count);
    
    return {
      key: group.key,
      name: group.name,
      count,
      currentBadge,
      nextBadge,
      progress,
      nextThreshold,
    };
  });

  // Only show subjects that have activity or are the main 8
  const displaySubjects = subjectProgress.filter(s => 
    s.count > 0 || ['reading', 'writing', 'math', 'science', 'social_studies', 'arts', 'life_skills', 'pe'].includes(s.key)
  );

  if (displaySubjects.length === 0) {
    return null;
  }

  return (
    <div className="card p-5 space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2 text-heading">
        <Trophy size={16} weight="duotone" className="text-amber-500" />
        Subject Mastery
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {displaySubjects.map(subject => {
          const BadgeIcon = subject.currentBadge?.icon;
          const NextBadgeIcon = subject.nextBadge?.icon;
          const hasStarted = subject.count > 0;
          
          return (
            <div 
              key={subject.key}
              className={`relative p-3 rounded-xl border transition-all ${
                hasStarted 
                  ? 'bg-[var(--background-elevated)] border-[var(--border)] hover:border-amber-500/30'
                  : 'bg-[var(--background-secondary)]/50 border-transparent opacity-60'
              }`}
            >
              {/* Badge Icon */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  hasStarted 
                    ? subject.currentBadge?.color.replace('text-', 'bg-').replace('500', '500/20') || 'bg-amber-500/20'
                    : 'bg-[var(--background-secondary)]'
                }`}>
                  {BadgeIcon ? (
                    <BadgeIcon 
                      size={20} 
                      weight="duotone" 
                      className={subject.currentBadge?.color || 'text-muted'}
                    />
                  ) : NextBadgeIcon ? (
                    <NextBadgeIcon 
                      size={20} 
                      weight="regular" 
                      className="text-muted opacity-50"
                    />
                  ) : (
                    <Trophy size={20} className="text-muted opacity-30" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-heading truncate">
                    {subject.currentBadge?.name || subject.name}
                  </p>
                  <p className="text-[10px] text-muted truncate">{subject.name}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="h-1.5 bg-[var(--background-secondary)] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${subject.progress}%`,
                      backgroundColor: getProgressBarColor(subject.currentBadge?.color)
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted">
                  <span>{subject.count} activities</span>
                  {subject.nextBadge && (
                    <span>→ {subject.nextThreshold}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
