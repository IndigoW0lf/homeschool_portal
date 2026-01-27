'use client';

import { Trophy } from '@phosphor-icons/react';
import { SUBJECT_BADGE_GROUPS, getBadgeById, type Badge } from '@/lib/badges';

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
                      backgroundColor: subject.currentBadge?.color.includes('text-') 
                        ? subject.currentBadge.color.replace('text-', 'rgb(var(--').replace('-500', '-500-rgb))').replace('-400', '-400-rgb))').replace('-600', '-600-rgb))')
                        : 'var(--amber-500)'
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
