// Badge definitions for the Lunara Quest gamification system
// Badges are earned through milestones, subject completion, or purchased in the shop

import { 
  Plant,
  Star, 
  Moon, 
  Sparkle,
  Book,
  Books,
  Bird,
  Crown,
  Pencil,
  Notebook,
  PenNib,
  Scroll,
  NumberSquareOne,
  Calculator,
  PuzzlePiece,
  Trophy,
  Flask,
  TestTube,
  Leaf,
  Rocket,
  Bug,
  Wind,
  Dog,
  Timer,
  Rainbow,
  IconWeight
} from '@phosphor-icons/react';
import { ComponentType } from 'react';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<{ size?: number; weight?: IconWeight; className?: string }>;
  category: 'milestone' | 'subject' | 'identity';
  criteria?: {
    type: 'moons' | 'subject' | 'first' | 'studio';
    threshold?: number;
    subject?: string;
  };
  cost?: number; // For purchasable badges
  color: string; // Tailwind color class for the badge
}

// ============ MILESTONE BADGES (auto-earned) ============
export const MILESTONE_BADGES: Badge[] = [
  {
    id: 'first-sprout',
    name: 'First Sprout',
    description: 'You planted your first seed of learning!',
    icon: Plant,
    category: 'milestone',
    criteria: { type: 'first' },
    color: 'text-green-500',
  },
  {
    id: 'star-collector',
    name: 'Star Collector',
    description: "You're gathering light!",
    icon: Star,
    category: 'milestone',
    criteria: { type: 'moons', threshold: 10 },
    color: 'text-yellow-500',
  },
  {
    id: 'moonlit',
    name: 'Moonlit',
    description: 'Your glow is growing!',
    icon: Moon,
    category: 'milestone',
    criteria: { type: 'moons', threshold: 50 },
    color: 'text-indigo-400',
  },
  {
    id: 'lunar-legend',
    name: 'Lunar Legend',
    description: 'You shine bright in the night sky!',
    icon: Sparkle,
    category: 'milestone',
    criteria: { type: 'moons', threshold: 100 },
    color: 'text-purple-500',
  },
];

// ============ SUBJECT BADGES (earned by completing lessons) ============
// Reading badges
export const READING_BADGES: Badge[] = [
  {
    id: 'reading-25',
    name: 'Bookworm',
    description: 'Completed 25 reading lessons!',
    icon: Book,
    category: 'subject',
    criteria: { type: 'subject', subject: 'reading', threshold: 25 },
    color: 'text-amber-600',
  },
  {
    id: 'reading-50',
    name: 'Story Seeker',
    description: 'Completed 50 reading lessons!',
    icon: Books,
    category: 'subject',
    criteria: { type: 'subject', subject: 'reading', threshold: 50 },
    color: 'text-amber-500',
  },
  {
    id: 'reading-75',
    name: 'Wise Owl',
    description: 'Completed 75 reading lessons!',
    icon: Bird,
    category: 'subject',
    criteria: { type: 'subject', subject: 'reading', threshold: 75 },
    color: 'text-amber-400',
  },
  {
    id: 'reading-100',
    name: 'Library Legend',
    description: 'Completed 100 reading lessons!',
    icon: Crown,
    category: 'subject',
    criteria: { type: 'subject', subject: 'reading', threshold: 100 },
    color: 'text-amber-300',
  },
];

// Writing badges
export const WRITING_BADGES: Badge[] = [
  {
    id: 'writing-25',
    name: 'Word Weaver',
    description: 'Completed 25 writing lessons!',
    icon: Pencil,
    category: 'subject',
    criteria: { type: 'subject', subject: 'writing', threshold: 25 },
    color: 'text-blue-600',
  },
  {
    id: 'writing-50',
    name: 'Storyteller',
    description: 'Completed 50 writing lessons!',
    icon: Notebook,
    category: 'subject',
    criteria: { type: 'subject', subject: 'writing', threshold: 50 },
    color: 'text-blue-500',
  },
  {
    id: 'writing-75',
    name: "Author's Mind",
    description: 'Completed 75 writing lessons!',
    icon: PenNib,
    category: 'subject',
    criteria: { type: 'subject', subject: 'writing', threshold: 75 },
    color: 'text-blue-400',
  },
  {
    id: 'writing-100',
    name: 'Master Scribe',
    description: 'Completed 100 writing lessons!',
    icon: Scroll,
    category: 'subject',
    criteria: { type: 'subject', subject: 'writing', threshold: 100 },
    color: 'text-blue-300',
  },
];

// Math/Logic badges
export const MATH_BADGES: Badge[] = [
  {
    id: 'math-25',
    name: 'Number Ninja',
    description: 'Completed 25 math/logic lessons!',
    icon: NumberSquareOne,
    category: 'subject',
    criteria: { type: 'subject', subject: 'math', threshold: 25 },
    color: 'text-purple-600',
  },
  {
    id: 'math-50',
    name: 'Logic Learner',
    description: 'Completed 50 math/logic lessons!',
    icon: Calculator,
    category: 'subject',
    criteria: { type: 'subject', subject: 'math', threshold: 50 },
    color: 'text-purple-500',
  },
  {
    id: 'math-75',
    name: 'Puzzle Pro',
    description: 'Completed 75 math/logic lessons!',
    icon: PuzzlePiece,
    category: 'subject',
    criteria: { type: 'subject', subject: 'math', threshold: 75 },
    color: 'text-purple-400',
  },
  {
    id: 'math-100',
    name: 'Math Champion',
    description: 'Completed 100 math/logic lessons!',
    icon: Trophy,
    category: 'subject',
    criteria: { type: 'subject', subject: 'math', threshold: 100 },
    color: 'text-purple-300',
  },
];

// Science badges
export const SCIENCE_BADGES: Badge[] = [
  {
    id: 'science-25',
    name: 'Curious Mind',
    description: 'Completed 25 science lessons!',
    icon: Flask,
    category: 'subject',
    criteria: { type: 'subject', subject: 'science', threshold: 25 },
    color: 'text-green-600',
  },
  {
    id: 'science-50',
    name: 'Lab Explorer',
    description: 'Completed 50 science lessons!',
    icon: TestTube,
    category: 'subject',
    criteria: { type: 'subject', subject: 'science', threshold: 50 },
    color: 'text-green-500',
  },
  {
    id: 'science-75',
    name: 'Nature Keeper',
    description: 'Completed 75 science lessons!',
    icon: Leaf,
    category: 'subject',
    criteria: { type: 'subject', subject: 'science', threshold: 75 },
    color: 'text-green-400',
  },
  {
    id: 'science-100',
    name: 'Discovery Expert',
    description: 'Completed 100 science lessons!',
    icon: Rocket,
    category: 'subject',
    criteria: { type: 'subject', subject: 'science', threshold: 100 },
    color: 'text-green-300',
  },
];

// ============ IDENTITY BADGES (purchasable in shop) ============
export const IDENTITY_BADGES: Badge[] = [
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'For kids who do their best thinking at night',
    icon: Bird,
    category: 'identity',
    cost: 10,
    color: 'text-indigo-500',
  },
  {
    id: 'busy-bee',
    name: 'Busy Bee',
    description: 'Always buzzing with activity',
    icon: Bug,
    category: 'identity',
    cost: 10,
    color: 'text-yellow-500',
  },
  {
    id: 'free-spirit',
    name: 'Free Spirit',
    description: 'Learning happens everywhere',
    icon: Wind,
    category: 'identity',
    cost: 10,
    color: 'text-cyan-500',
  },
  {
    id: 'clever-fox',
    name: 'Clever Fox',
    description: 'Quick thinking, clever solutions',
    icon: Dog,
    category: 'identity',
    cost: 15,
    color: 'text-orange-500',
  },
  {
    id: 'slow-steady',
    name: 'Slow & Steady',
    description: 'Taking your time is a superpower',
    icon: Timer,
    category: 'identity',
    cost: 15,
    color: 'text-emerald-500',
  },
  {
    id: 'rainbow-maker',
    name: 'Rainbow Maker',
    description: 'Bringing color to everything',
    icon: Rainbow,
    category: 'identity',
    cost: 15,
    color: 'text-pink-500',
  },
];

// All badges combined
export const ALL_BADGES: Badge[] = [
  ...MILESTONE_BADGES,
  ...READING_BADGES,
  ...WRITING_BADGES,
  ...MATH_BADGES,
  ...SCIENCE_BADGES,
  ...IDENTITY_BADGES,
];

// Helper to get a badge by ID
export function getBadgeById(id: string): Badge | undefined {
  return ALL_BADGES.find(badge => badge.id === id);
}

// Helper to check if a milestone badge is earned based on moons
export function getEarnedMilestoneBadges(totalMoons: number, hasCompletedFirst: boolean): string[] {
  const earned: string[] = [];
  
  for (const badge of MILESTONE_BADGES) {
    if (badge.criteria?.type === 'first' && hasCompletedFirst) {
      earned.push(badge.id);
    } else if (badge.criteria?.type === 'moons' && badge.criteria.threshold && totalMoons >= badge.criteria.threshold) {
      earned.push(badge.id);
    }
  }
  
  return earned;
}

// Helper to check subject badges based on completion counts
export function getEarnedSubjectBadges(subjectCounts: Record<string, number>): string[] {
  const earned: string[] = [];
  const allSubjectBadges = [...READING_BADGES, ...WRITING_BADGES, ...MATH_BADGES, ...SCIENCE_BADGES];
  
  for (const badge of allSubjectBadges) {
    if (badge.criteria?.type === 'subject' && badge.criteria.subject && badge.criteria.threshold) {
      const count = subjectCounts[badge.criteria.subject] || 0;
      if (count >= badge.criteria.threshold) {
        earned.push(badge.id);
      }
    }
  }
  
  return earned;
}
