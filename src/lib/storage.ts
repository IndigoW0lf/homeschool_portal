// localStorage utilities for done state persistence
// Key format: `homeschool_done::${kidId}::${date}::${lessonId}`
// NOW WITH DATABASE SYNC for cross-device visibility!

import { supabase } from '@/lib/supabase/browser';

const STORAGE_PREFIX = 'homeschool_done';

export function getDoneKey(kidId: string, date: string, lessonId: string): string {
  return `${STORAGE_PREFIX}::${kidId}::${date}::${lessonId}`;
}

export function isDone(kidId: string, date: string, lessonId: string): boolean {
  if (typeof window === 'undefined') return false;
  const key = getDoneKey(kidId, date, lessonId);
  const value = localStorage.getItem(key);
  return value === 'true';
}

/**
 * Set completion status - updates BOTH localStorage (for instant UI) AND database (for sync)
 * @param scheduleItemId - The schedule_items.id (NOT the lesson/assignment id)
 */
export async function setDone(
  kidId: string, 
  date: string, 
  itemId: string, 
  done: boolean,
  scheduleItemId?: string // Optional - if provided, syncs to database
): Promise<void> {
  if (typeof window === 'undefined') return;
  
  // 1. Update localStorage immediately for instant UI feedback
  const key = getDoneKey(kidId, date, itemId);
  if (done) {
    localStorage.setItem(key, 'true');
  } else {
    localStorage.removeItem(key);
  }
  
  // 2. Sync to database if we have the schedule_item ID
  if (scheduleItemId) {
    try {
      const status = done ? 'completed' : 'pending';
      const completed_at = done ? new Date().toISOString() : null;
      
      await supabase
        .from('schedule_items')
        .update({ status, completed_at })
        .eq('id', scheduleItemId);
        
      console.log(`✅ Synced completion to DB: ${scheduleItemId} -> ${status}`);
    } catch (err) {
      console.error('Failed to sync completion to database:', err);
      // Don't throw - local state is already updated, DB sync is best-effort
    }
  }
}

/**
 * Legacy sync version - still works but doesn't sync to DB
 */
export function setDoneLocal(kidId: string, date: string, lessonId: string, done: boolean): void {
  if (typeof window === 'undefined') return;
  const key = getDoneKey(kidId, date, lessonId);
  if (done) {
    localStorage.setItem(key, 'true');
  } else {
    localStorage.removeItem(key);
  }
}

export async function toggleDone(
  kidId: string, 
  date: string, 
  itemId: string,
  scheduleItemId?: string
): Promise<boolean> {
  const currentState = isDone(kidId, date, itemId);
  const newState = !currentState;
  await setDone(kidId, date, itemId, newState, scheduleItemId);
  return newState;
}

export function getDoneCount(kidId: string, date: string, lessonIds: string[]): number {
  if (typeof window === 'undefined') return 0;
  return lessonIds.filter(lessonId => isDone(kidId, date, lessonId)).length;
}
