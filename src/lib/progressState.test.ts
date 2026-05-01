/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStars,
  getAwardLedger,
  markAwarded,
  isAwarded,
  isDailyBonusAwarded,
  markDailyBonusAwarded,
  getStreak,
  setStreak,
  updateStreakIfCompleted,
  ensureUnlocksForStars,
  getUnlocks,
  setUnlocks,
} from './progressState';

const KID = 'test-kid-1';
const DATE = '2026-04-30';

beforeEach(() => {
  localStorage.clear();
});

// ----------------------------------------------------------------
// Stars
// ----------------------------------------------------------------
describe('getStars', () => {
  it('returns 0 when no stars stored', () => {
    expect(getStars(KID)).toBe(0);
  });
});

// ----------------------------------------------------------------
// Award ledger
// ----------------------------------------------------------------
describe('award ledger', () => {
  it('returns empty ledger by default', () => {
    expect(getAwardLedger(KID, DATE)).toEqual({});
  });

  it('markAwarded / isAwarded round-trips correctly', () => {
    markAwarded(KID, DATE, 'lesson-abc');
    expect(isAwarded(KID, DATE, 'lesson-abc')).toBe(true);
    expect(isAwarded(KID, DATE, 'lesson-xyz')).toBe(false);
  });

  it('isDailyBonusAwarded returns false before marking', () => {
    expect(isDailyBonusAwarded(KID, DATE)).toBe(false);
  });

  it('markDailyBonusAwarded / isDailyBonusAwarded round-trips correctly', () => {
    markDailyBonusAwarded(KID, DATE);
    expect(isDailyBonusAwarded(KID, DATE)).toBe(true);
  });

  it('awards are scoped per kid and date', () => {
    markAwarded(KID, DATE, 'lesson-1');
    expect(isAwarded('other-kid', DATE, 'lesson-1')).toBe(false);
    expect(isAwarded(KID, '2026-01-01', 'lesson-1')).toBe(false);
  });
});

// ----------------------------------------------------------------
// Streaks
// ----------------------------------------------------------------
describe('updateStreakIfCompleted', () => {
  // School days are Tue (2), Wed (3), Thu (4) per the implementation.
  // Use local date construction (year, month-1, day) to avoid UTC offset shifting getDay().
  const tuesday   = new Date(2026, 3, 28); // April 28, 2026 - Tuesday
  const wednesday = new Date(2026, 3, 29); // April 29, 2026 - Wednesday
  const thursday  = new Date(2026, 3, 30); // April 30, 2026 - Thursday
  const monday    = new Date(2026, 3, 27); // April 27, 2026 - Monday (not a school day)

  it('ignores non-school days', () => {
    updateStreakIfCompleted(KID, monday);
    expect(getStreak(KID).current).toBe(0);
  });

  it('starts a streak of 1 on first school day completion', () => {
    updateStreakIfCompleted(KID, tuesday);
    const streak = getStreak(KID);
    expect(streak.current).toBe(1);
    expect(streak.best).toBe(1);
  });

  it('increments streak on consecutive school day', () => {
    updateStreakIfCompleted(KID, tuesday);
    updateStreakIfCompleted(KID, wednesday);
    expect(getStreak(KID).current).toBe(2);
  });

  it('increments streak across three consecutive school days', () => {
    updateStreakIfCompleted(KID, tuesday);
    updateStreakIfCompleted(KID, wednesday);
    updateStreakIfCompleted(KID, thursday);
    expect(getStreak(KID).current).toBe(3);
    expect(getStreak(KID).best).toBe(3);
  });

  it('resets streak when a school day is missed', () => {
    updateStreakIfCompleted(KID, tuesday);
    // Skip Wednesday, complete Thursday -- streak should reset to 1
    updateStreakIfCompleted(KID, thursday);
    expect(getStreak(KID).current).toBe(1);
  });

  it('does not regress streak when called twice on the same day', () => {
    updateStreakIfCompleted(KID, tuesday);
    updateStreakIfCompleted(KID, wednesday);
    // Call again for same day (already completed)
    updateStreakIfCompleted(KID, wednesday);
    expect(getStreak(KID).current).toBe(2);
  });

  it('tracks best streak independently of current', () => {
    updateStreakIfCompleted(KID, tuesday);
    updateStreakIfCompleted(KID, wednesday);
    updateStreakIfCompleted(KID, thursday);
    // Next week: skip Tuesday May 5, come back on Wednesday May 6 -- streak resets to 1
    const nextWednesday = new Date(2026, 4, 6); // May 6, 2026 - Wednesday
    updateStreakIfCompleted(KID, nextWednesday);
    const streak = getStreak(KID);
    expect(streak.current).toBe(1);
    expect(streak.best).toBe(3);
  });
});

// ----------------------------------------------------------------
// Unlocks
// ----------------------------------------------------------------
describe('ensureUnlocksForStars', () => {
  it('returns empty array for 0 stars', () => {
    const unlocks = ensureUnlocksForStars(KID, 0);
    expect(unlocks).toHaveLength(0);
  });

  it('unlocks first badge at 5 stars', () => {
    const unlocks = ensureUnlocksForStars(KID, 5);
    expect(unlocks).toContain('unlock-badge-1');
    expect(unlocks).not.toContain('unlock-badge-2');
  });

  it('unlocks all thresholds at max stars', () => {
    const unlocks = ensureUnlocksForStars(KID, 100);
    expect(unlocks).toHaveLength(6);
  });

  it('does not duplicate unlocks on repeated calls', () => {
    ensureUnlocksForStars(KID, 10);
    const unlocks = ensureUnlocksForStars(KID, 10);
    const unique = new Set(unlocks);
    expect(unique.size).toBe(unlocks.length);
  });

  it('persists unlocks to localStorage', () => {
    ensureUnlocksForStars(KID, 20);
    const stored = getUnlocks(KID);
    expect(stored).toContain('unlock-badge-1');
    expect(stored).toContain('unlock-badge-2');
    expect(stored).toContain('unlock-badge-3');
  });

  it('does not remove existing unlocks when called with fewer stars', () => {
    setUnlocks(KID, ['unlock-badge-1', 'unlock-badge-2']);
    const unlocks = ensureUnlocksForStars(KID, 3); // Below threshold for badge-1
    expect(unlocks).toContain('unlock-badge-1');
  });
});
