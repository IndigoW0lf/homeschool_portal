// Progress state management: stars, streaks, unlocks, awards
// All functions are client-safe (check typeof window)

const STARS_PREFIX = 'homeschool_stars';
const STREAK_PREFIX = 'homeschool_streak';
const UNLOCKS_PREFIX = 'homeschool_unlocks';
const AWARDS_PREFIX = 'homeschool_awards';

interface AwardLedger {
  [itemId: string]: boolean; // true if item was awarded (includes 'dailyBonus' key)
}

interface StreakState {
  current: number;
  best: number;
  lastCompletedDate: string | null;
}

// Stars
export function getStars(kidId: string): number {
  if (typeof window === 'undefined') return 0;
  const key = `${STARS_PREFIX}::${kidId}`;
  const value = localStorage.getItem(key);
  return value ? parseInt(value, 10) : 0;
}

export function addStars(kidId: string, amount: number): void {
  if (typeof window === 'undefined') return;
  const key = `${STARS_PREFIX}::${kidId}`;
  const current = getStars(kidId);
  localStorage.setItem(key, String(current + amount));
}

// Award Ledger (prevents double-awards)
export function getAwardLedger(kidId: string, date: string): AwardLedger {
  if (typeof window === 'undefined') return {};
  const key = `${AWARDS_PREFIX}::${kidId}::${date}`;
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : {};
}

export function setAwardLedger(kidId: string, date: string, ledger: AwardLedger): void {
  if (typeof window === 'undefined') return;
  const key = `${AWARDS_PREFIX}::${kidId}::${date}`;
  localStorage.setItem(key, JSON.stringify(ledger));
}

export function markAwarded(kidId: string, date: string, itemId: string): void {
  const ledger = getAwardLedger(kidId, date);
  ledger[itemId] = true;
  setAwardLedger(kidId, date, ledger);
}

export function isAwarded(kidId: string, date: string, itemId: string): boolean {
  const ledger = getAwardLedger(kidId, date);
  return !!ledger[itemId];
}

export function isDailyBonusAwarded(kidId: string, date: string): boolean {
  const ledger = getAwardLedger(kidId, date);
  return !!ledger.dailyBonus;
}

export function markDailyBonusAwarded(kidId: string, date: string): void {
  const ledger = getAwardLedger(kidId, date);
  ledger.dailyBonus = true;
  setAwardLedger(kidId, date, ledger);
}

// Streaks
export function getStreak(kidId: string): StreakState {
  if (typeof window === 'undefined') {
    return { current: 0, best: 0, lastCompletedDate: null };
  }
  const key = `${STREAK_PREFIX}::${kidId}`;
  const value = localStorage.getItem(key);
  if (!value) {
    return { current: 0, best: 0, lastCompletedDate: null };
  }
  return JSON.parse(value);
}

export function setStreak(kidId: string, streak: StreakState): void {
  if (typeof window === 'undefined') return;
  const key = `${STREAK_PREFIX}::${kidId}`;
  localStorage.setItem(key, JSON.stringify(streak));
}

function isSchoolDay(date: Date): boolean {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  return day === 2 || day === 3 || day === 4; // Tue, Wed, Thu
}

function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getNextSchoolDayAfter(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  while (!isSchoolDay(next)) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

export function updateStreakIfCompleted(kidId: string, date: Date): void {
  if (!isSchoolDay(date)) return; // Only count school days
  
  const streak = getStreak(kidId);
  const dateString = getDateString(date);
  
  if (!streak.lastCompletedDate) {
    // First completion
    streak.current = 1;
    streak.best = 1;
    streak.lastCompletedDate = dateString;
  } else {
    const lastDate = new Date(streak.lastCompletedDate);
    const nextExpectedSchoolDay = getNextSchoolDayAfter(lastDate);
    const todayString = getDateString(date);
    const expectedString = getDateString(nextExpectedSchoolDay);
    
    if (todayString === expectedString) {
      // Perfect continuation
      streak.current += 1;
      streak.lastCompletedDate = dateString;
    } else if (todayString > expectedString) {
      // Missed some days, reset
      streak.current = 1;
      streak.lastCompletedDate = dateString;
    }
    // If today < expected, do nothing (already completed today)
    
    if (streak.current > streak.best) {
      streak.best = streak.current;
    }
  }
  
  setStreak(kidId, streak);
}

// Unlocks
const UNLOCK_THRESHOLDS = [5, 10, 20, 35, 50, 75];
const UNLOCK_IDS = [
  'unlock-badge-1',
  'unlock-badge-2',
  'unlock-badge-3',
  'unlock-badge-4',
  'unlock-badge-5',
  'unlock-badge-6',
];

export function getUnlocks(kidId: string): string[] {
  if (typeof window === 'undefined') return [];
  const key = `${UNLOCKS_PREFIX}::${kidId}`;
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : [];
}

export function setUnlocks(kidId: string, unlocks: string[]): void {
  if (typeof window === 'undefined') return;
  const key = `${UNLOCKS_PREFIX}::${kidId}`;
  localStorage.setItem(key, JSON.stringify(unlocks));
}

export function ensureUnlocksForStars(kidId: string, stars: number): string[] {
  const currentUnlocks = getUnlocks(kidId);
  const newUnlocks: string[] = [...currentUnlocks];
  
  UNLOCK_THRESHOLDS.forEach((threshold, index) => {
    if (stars >= threshold && !currentUnlocks.includes(UNLOCK_IDS[index])) {
      newUnlocks.push(UNLOCK_IDS[index]);
    }
  });
  
  if (newUnlocks.length > currentUnlocks.length) {
    setUnlocks(kidId, newUnlocks);
  }
  
  return newUnlocks;
}

// Shop purchases
const PURCHASES_PREFIX = 'homeschool_purchases';

export function getPurchases(kidId: string): string[] {
  if (typeof window === 'undefined') return [];
  const key = `${PURCHASES_PREFIX}::${kidId}`;
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : [];
}

export function setPurchases(kidId: string, purchases: string[]): void {
  if (typeof window === 'undefined') return;
  const key = `${PURCHASES_PREFIX}::${kidId}`;
  localStorage.setItem(key, JSON.stringify(purchases));
}

export function isPurchased(kidId: string, itemId: string): boolean {
  const purchases = getPurchases(kidId);
  return purchases.includes(itemId);
}

export function purchaseItem(kidId: string, itemId: string, cost: number, itemUnlocks: string[]): boolean {
  const currentStars = getStars(kidId);
  if (currentStars < cost) return false;
  if (isPurchased(kidId, itemId)) return false; // Already purchased
  
  // Deduct stars
  addStars(kidId, -cost);
  
  // Add to purchases
  const purchases = getPurchases(kidId);
  purchases.push(itemId);
  setPurchases(kidId, purchases);
  
  // Add to unlocks
  const unlocks = getUnlocks(kidId);
  itemUnlocks.forEach(unlockId => {
    if (!unlocks.includes(unlockId)) {
      unlocks.push(unlockId);
    }
  });
  setUnlocks(kidId, unlocks);
  
  return true;
}

// Helper to get unlocks for a shop item
export function getItemUnlocks(itemId: string, unlocks: string[]): string[] {
  return unlocks || [];
}

