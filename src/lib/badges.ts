// Badge definitions for the Lunara Quest gamification system
// Badges are earned through milestones, subject completion, streaks, or special achievements

import { 
  Plant,
  Star, 
  Moon, 
  Sparkle,
  Crown,
  SealCheck,
  Medal,
  Confetti,
  Book,
  Books,
  Bird,
  Pencil,
  Notebook,
  PenNib,
  Scroll,
  Feather,
  Article,
  NumberSquareOne,
  Calculator,
  PuzzlePiece,
  Trophy,
  MathOperations,
  ChartLine,
  Flask,
  TestTube,
  Leaf,
  Rocket,
  Atom,
  Microscope,
  Globe,
  GlobeHemisphereWest,
  MapTrifold,
  Buildings,
  Compass,
  Flag,
  Scroll as HistoryScroll,
  Palette,
  PaintBrush,
  MusicNote,
  Camera,
  Shapes,
  Sparkle as ArtSparkle,
  PaintBucket,
  Laptop,
  Code,
  Terminal,
  Robot,
  Cpu,
  Database,
  CloudArrowUp,
  PersonSimpleRun,
  Barbell,
  Heart,
  Bicycle,
  Football,
  Target,
  Mountains,
  House,
  Wrench,
  FirstAid,
  HandHeart,
  Broom,
  Clock,
  Fire,
  Lightning,
  Flame,
  Timer,
  CalendarCheck,
  Notebook as JournalNotebook,
  BookOpenText,
  PencilCircle,
  Lightbulb,
  IconWeight
} from '@phosphor-icons/react';
import { ComponentType } from 'react';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<{ size?: number; weight?: IconWeight; className?: string }>;
  category: 'milestone' | 'subject' | 'special';
  subjectKey?: string; // For badge gallery grouping
  criteria?: {
    type: 'moons' | 'subject' | 'first' | 'streak' | 'journal' | 'special';
    threshold?: number;
    subject?: string;
  };
  color: string;
}

// ============ MILESTONE BADGES (auto-earned based on total moons) ============
export const MILESTONE_BADGES: Badge[] = [
  {
    id: 'first-sprout',
    name: 'First Sprout',
    description: 'Completed your first activity!',
    icon: Plant,
    category: 'milestone',
    criteria: { type: 'first' },
    color: 'text-green-500',
  },
  {
    id: 'star-collector',
    name: 'Star Collector',
    description: 'Earned 10 moons - you\'re gathering light!',
    icon: Star,
    category: 'milestone',
    criteria: { type: 'moons', threshold: 10 },
    color: 'text-yellow-500',
  },
  {
    id: 'moonlit',
    name: 'Moonlit',
    description: 'Earned 50 moons - your glow is growing!',
    icon: Moon,
    category: 'milestone',
    criteria: { type: 'moons', threshold: 50 },
    color: 'text-indigo-400',
  },
  {
    id: 'lunar-legend',
    name: 'Lunar Legend',
    description: 'Earned 100 moons - you shine bright!',
    icon: Sparkle,
    category: 'milestone',
    criteria: { type: 'moons', threshold: 100 },
    color: 'text-purple-500',
  },
  {
    id: 'constellation-keeper',
    name: 'Constellation Keeper',
    description: 'Earned 200 moons - lighting up the sky!',
    icon: Crown,
    category: 'milestone',
    criteria: { type: 'moons', threshold: 200 },
    color: 'text-amber-400',
  },
  {
    id: 'galaxy-guardian',
    name: 'Galaxy Guardian',
    description: 'Earned 500 moons - a cosmic achievement!',
    icon: SealCheck,
    category: 'milestone',
    criteria: { type: 'moons', threshold: 500 },
    color: 'text-cyan-400',
  },
  {
    id: 'supernova',
    name: 'Supernova',
    description: 'Earned 1000 moons - an explosive learner!',
    icon: Medal,
    category: 'milestone',
    criteria: { type: 'moons', threshold: 1000 },
    color: 'text-orange-400',
  },
  {
    id: 'universe-master',
    name: 'Universe Master',
    description: 'Earned 2500 moons - you\'ve mastered the cosmos!',
    icon: Confetti,
    category: 'milestone',
    criteria: { type: 'moons', threshold: 2500 },
    color: 'text-pink-400',
  },
];

// Helper to create subject badges with consistent thresholds
function createSubjectBadges(
  _subject: string,
  subjectKey: string,
  names: string[],
  descriptions: string[],
  icons: ComponentType<{ size?: number; weight?: IconWeight; className?: string }>[],
  colors: string[]
): Badge[] {
  const thresholds = [10, 25, 50, 75, 100, 150, 200];
  return thresholds.map((threshold, i) => ({
    id: `${subjectKey}-${threshold}`,
    name: names[i],
    description: descriptions[i],
    icon: icons[i],
    category: 'subject' as const,
    subjectKey,
    criteria: { type: 'subject' as const, subject: subjectKey, threshold },
    color: colors[i],
  }));
}

// ============ READING BADGES ============
export const READING_BADGES: Badge[] = createSubjectBadges(
  'Reading',
  'reading',
  ['Page Turner', 'Bookworm', 'Story Seeker', 'Tale Weaver', 'Wise Owl', 'Library Legend', 'Literary Master'],
  [
    'Read 10 lessons - just getting started!',
    'Read 25 lessons - you love books!',
    'Read 50 lessons - seeking adventures!',
    'Read 75 lessons - weaving through worlds!',
    'Read 100 lessons - wise beyond your pages!',
    'Read 150 lessons - a legendary reader!',
    'Read 200 lessons - master of literature!'
  ],
  [Book, Book, Books, Feather, Bird, Crown, Article],
  ['text-amber-600', 'text-amber-500', 'text-amber-500', 'text-amber-400', 'text-amber-400', 'text-amber-300', 'text-amber-300']
);

// ============ WRITING BADGES ============
export const WRITING_BADGES: Badge[] = createSubjectBadges(
  'Writing',
  'writing',
  ['First Draft', 'Word Weaver', 'Storyteller', 'Poet\'s Heart', 'Author\'s Mind', 'Master Scribe', 'Writing Wizard'],
  [
    'Wrote 10 lessons - your story begins!',
    'Wrote 25 lessons - weaving words!',
    'Wrote 50 lessons - tales to tell!',
    'Wrote 75 lessons - poetry in motion!',
    'Wrote 100 lessons - thinking like an author!',
    'Wrote 150 lessons - mastering the craft!',
    'Wrote 200 lessons - a true wizard with words!'
  ],
  [Pencil, Pencil, Notebook, PenNib, PenNib, Scroll, Scroll],
  ['text-blue-600', 'text-blue-500', 'text-blue-500', 'text-blue-400', 'text-blue-400', 'text-blue-300', 'text-blue-300']
);

// ============ MATH & LOGIC BADGES ============
export const MATH_BADGES: Badge[] = createSubjectBadges(
  'Math & Logic',
  'math',
  ['Number Novice', 'Number Ninja', 'Logic Learner', 'Equation Expert', 'Puzzle Pro', 'Math Champion', 'Calculator King'],
  [
    'Solved 10 math lessons - numbers are fun!',
    'Solved 25 math lessons - quick calculations!',
    'Solved 50 math lessons - logical thinking!',
    'Solved 75 math lessons - equation expert!',
    'Solved 100 math lessons - puzzle master!',
    'Solved 150 math lessons - math champion!',
    'Solved 200 math lessons - ruler of numbers!'
  ],
  [NumberSquareOne, NumberSquareOne, Calculator, MathOperations, PuzzlePiece, Trophy, ChartLine],
  ['text-purple-600', 'text-purple-500', 'text-purple-500', 'text-purple-400', 'text-purple-400', 'text-purple-300', 'text-purple-300']
);

// ============ SCIENCE BADGES ============
export const SCIENCE_BADGES: Badge[] = createSubjectBadges(
  'Science',
  'science',
  ['Curious Kid', 'Curious Mind', 'Lab Explorer', 'Experiment Expert', 'Nature Keeper', 'Discovery Expert', 'Science Genius'],
  [
    'Explored 10 science lessons - curiosity sparked!',
    'Explored 25 science lessons - asking great questions!',
    'Explored 50 science lessons - lab adventures!',
    'Explored 75 science lessons - experiments galore!',
    'Explored 100 science lessons - nature explorer!',
    'Explored 150 science lessons - discovering wonders!',
    'Explored 200 science lessons - scientific genius!'
  ],
  [Flask, Flask, TestTube, Atom, Leaf, Rocket, Microscope],
  ['text-green-600', 'text-green-500', 'text-green-500', 'text-green-400', 'text-green-400', 'text-green-300', 'text-green-300']
);

// ============ SOCIAL STUDIES BADGES ============
export const SOCIAL_STUDIES_BADGES: Badge[] = createSubjectBadges(
  'Social Studies',
  'social_studies',
  ['Explorer', 'Map Reader', 'History Buff', 'Culture Curious', 'Geography Guru', 'World Traveler', 'Global Citizen'],
  [
    'Learned 10 social studies lessons - exploring begins!',
    'Learned 25 social studies lessons - reading the map!',
    'Learned 50 social studies lessons - history lover!',
    'Learned 75 social studies lessons - culture explorer!',
    'Learned 100 social studies lessons - geography expert!',
    'Learned 150 social studies lessons - world traveler!',
    'Learned 200 social studies lessons - global citizen!'
  ],
  [Globe, MapTrifold, HistoryScroll, Buildings, GlobeHemisphereWest, Compass, Flag],
  ['text-orange-600', 'text-orange-500', 'text-orange-500', 'text-orange-400', 'text-orange-400', 'text-orange-300', 'text-orange-300']
);

// ============ ARTS BADGES ============
export const ARTS_BADGES: Badge[] = createSubjectBadges(
  'Arts',
  'arts',
  ['Doodler', 'Color Mixer', 'Art Explorer', 'Canvas Creator', 'Creative Soul', 'Art Star', 'Master Artist'],
  [
    'Created 10 art lessons - first doodles!',
    'Created 25 art lessons - mixing colors!',
    'Created 50 art lessons - exploring art!',
    'Created 75 art lessons - canvas creator!',
    'Created 100 art lessons - creative soul!',
    'Created 150 art lessons - shining star!',
    'Created 200 art lessons - master artist!'
  ],
  [Palette, PaintBrush, Shapes, Camera, MusicNote, ArtSparkle, PaintBucket],
  ['text-rose-600', 'text-rose-500', 'text-rose-500', 'text-rose-400', 'text-rose-400', 'text-rose-300', 'text-rose-300']
);

// ============ COMPUTER SCIENCE BADGES ============
export const COMPUTER_SCIENCE_BADGES: Badge[] = createSubjectBadges(
  'Computer Science',
  'computer_science',
  ['Code Curious', 'Keyboard Kid', 'Code Crafter', 'Digital Builder', 'Tech Wizard', 'Programming Pro', 'Computer Genius'],
  [
    'Completed 10 CS lessons - curious about code!',
    'Completed 25 CS lessons - keyboard warrior!',
    'Completed 50 CS lessons - crafting code!',
    'Completed 75 CS lessons - building digital!',
    'Completed 100 CS lessons - tech wizard!',
    'Completed 150 CS lessons - programming pro!',
    'Completed 200 CS lessons - computer genius!'
  ],
  [Laptop, Code, Terminal, Robot, Cpu, Database, CloudArrowUp],
  ['text-cyan-600', 'text-cyan-500', 'text-cyan-500', 'text-cyan-400', 'text-cyan-400', 'text-cyan-300', 'text-cyan-300']
);

// ============ PE / MOVEMENT BADGES ============
export const PE_BADGES: Badge[] = createSubjectBadges(
  'PE & Movement',
  'pe',
  ['Mover', 'Active Kid', 'Sports Star', 'Fitness Fan', 'Athlete', 'Champion', 'MVP'],
  [
    'Completed 10 PE lessons - getting moving!',
    'Completed 25 PE lessons - staying active!',
    'Completed 50 PE lessons - sports star!',
    'Completed 75 PE lessons - fitness fan!',
    'Completed 100 PE lessons - true athlete!',
    'Completed 150 PE lessons - champion!',
    'Completed 200 PE lessons - most valuable player!'
  ],
  [PersonSimpleRun, Heart, Football, Barbell, Bicycle, Target, Mountains],
  ['text-red-600', 'text-red-500', 'text-red-500', 'text-red-400', 'text-red-400', 'text-red-300', 'text-red-300']
);

// ============ LIFE SKILLS BADGES ============
export const LIFE_SKILLS_BADGES: Badge[] = createSubjectBadges(
  'Life Skills',
  'life_skills',
  ['Helper', 'Handy Kid', 'Life Learner', 'Skill Builder', 'Problem Solver', 'Life Expert', 'Independence Star'],
  [
    'Completed 10 life skills lessons - helpful!',
    'Completed 25 life skills lessons - handy kid!',
    'Completed 50 life skills lessons - learning life!',
    'Completed 75 life skills lessons - building skills!',
    'Completed 100 life skills lessons - problem solver!',
    'Completed 150 life skills lessons - life expert!',
    'Completed 200 life skills lessons - independent star!'
  ],
  [House, Wrench, FirstAid, Broom, HandHeart, Clock, Clock],
  ['text-pink-600', 'text-pink-500', 'text-pink-500', 'text-pink-400', 'text-pink-400', 'text-pink-300', 'text-pink-300']
);

// ============ SPECIAL BADGES (streaks, journals, achievements) ============
export const SPECIAL_BADGES: Badge[] = [
  // Streak badges
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Completed activities 7 days in a row!',
    icon: Fire,
    category: 'special',
    criteria: { type: 'streak', threshold: 7 },
    color: 'text-orange-500',
  },
  {
    id: 'streak-30',
    name: 'Monthly Master',
    description: 'Completed activities 30 days in a row!',
    icon: Flame,
    category: 'special',
    criteria: { type: 'streak', threshold: 30 },
    color: 'text-orange-400',
  },
  {
    id: 'streak-100',
    name: 'Century Streak',
    description: 'Completed activities 100 days in a row!',
    icon: Lightning,
    category: 'special',
    criteria: { type: 'streak', threshold: 100 },
    color: 'text-yellow-400',
  },
  // Journal badges
  {
    id: 'journal-10',
    name: 'Journal Starter',
    description: 'Wrote 10 journal entries!',
    icon: JournalNotebook,
    category: 'special',
    criteria: { type: 'journal', threshold: 10 },
    color: 'text-teal-500',
  },
  {
    id: 'journal-25',
    name: 'Thoughtful Writer',
    description: 'Wrote 25 journal entries!',
    icon: BookOpenText,
    category: 'special',
    criteria: { type: 'journal', threshold: 25 },
    color: 'text-teal-400',
  },
  {
    id: 'journal-50',
    name: 'Reflection Pro',
    description: 'Wrote 50 journal entries!',
    icon: PencilCircle,
    category: 'special',
    criteria: { type: 'journal', threshold: 50 },
    color: 'text-teal-400',
  },
  {
    id: 'journal-100',
    name: 'Journal Master',
    description: 'Wrote 100 journal entries - a true reflector!',
    icon: Lightbulb,
    category: 'special',
    criteria: { type: 'journal', threshold: 100 },
    color: 'text-teal-300',
  },
  // Special achievements
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Completed an activity before 8am!',
    icon: Bird,
    category: 'special',
    criteria: { type: 'special' },
    color: 'text-yellow-500',
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Completed an activity after 8pm!',
    icon: Moon,
    category: 'special',
    criteria: { type: 'special' },
    color: 'text-indigo-500',
  },
  {
    id: 'busy-bee',
    name: 'Busy Bee',
    description: 'Completed 5 activities in one day!',
    icon: Timer,
    category: 'special',
    criteria: { type: 'special' },
    color: 'text-yellow-500',
  },
  {
    id: 'well-rounded',
    name: 'Well Rounded',
    description: 'Completed activities in 5 different subjects!',
    icon: CalendarCheck,
    category: 'special',
    criteria: { type: 'special' },
    color: 'text-emerald-500',
  },
];

// All badges combined
export const ALL_BADGES: Badge[] = [
  ...MILESTONE_BADGES,
  ...READING_BADGES,
  ...WRITING_BADGES,
  ...MATH_BADGES,
  ...SCIENCE_BADGES,
  ...SOCIAL_STUDIES_BADGES,
  ...ARTS_BADGES,
  ...COMPUTER_SCIENCE_BADGES,
  ...PE_BADGES,
  ...LIFE_SKILLS_BADGES,
  ...SPECIAL_BADGES,
];

// Subject badge arrays for iteration
export const SUBJECT_BADGE_GROUPS = [
  { key: 'reading', name: 'Reading', badges: READING_BADGES },
  { key: 'writing', name: 'Writing', badges: WRITING_BADGES },
  { key: 'math', name: 'Math & Logic', badges: MATH_BADGES },
  { key: 'science', name: 'Science', badges: SCIENCE_BADGES },
  { key: 'social_studies', name: 'Social Studies', badges: SOCIAL_STUDIES_BADGES },
  { key: 'arts', name: 'Arts', badges: ARTS_BADGES },
  { key: 'computer_science', name: 'Computer Science', badges: COMPUTER_SCIENCE_BADGES },
  { key: 'pe', name: 'PE & Movement', badges: PE_BADGES },
  { key: 'life_skills', name: 'Life Skills', badges: LIFE_SKILLS_BADGES },
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
  const allSubjectBadges = SUBJECT_BADGE_GROUPS.flatMap(g => g.badges);
  
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

// Helper to check streak badges
export function getEarnedStreakBadges(currentStreak: number, bestStreak: number): string[] {
  const earned: string[] = [];
  const maxStreak = Math.max(currentStreak, bestStreak);
  
  for (const badge of SPECIAL_BADGES) {
    if (badge.criteria?.type === 'streak' && badge.criteria.threshold && maxStreak >= badge.criteria.threshold) {
      earned.push(badge.id);
    }
  }
  
  return earned;
}

// Helper to check journal badges
export function getEarnedJournalBadges(journalCount: number): string[] {
  const earned: string[] = [];
  
  for (const badge of SPECIAL_BADGES) {
    if (badge.criteria?.type === 'journal' && badge.criteria.threshold && journalCount >= badge.criteria.threshold) {
      earned.push(badge.id);
    }
  }
  
  return earned;
}
