'use server';

import { createServerClient } from './server';
import { LessonRow, AssignmentItemRow, ResourceRow, ScheduleItemRow } from '@/types';

// Lessons
export async function createLesson(lesson: Omit<LessonRow, 'id' | 'created_at'>) {
  const supabase = await createServerClient();
  
  // Get the authenticated user for RLS
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('lessons')
    .insert({ ...lesson, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateLessonOrder(items: { id: string; display_order: number }[]) {
  const supabase = await createServerClient();
  
  // Parallel updates for order
  const updates = items.map(item => 
    supabase
      .from('lessons')
      .update({ display_order: item.display_order })
      .eq('id', item.id)
  );

  await Promise.all(updates);
  return true;
}

export async function togglePinLesson(id: string, is_pinned: boolean) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('lessons')
    .update({ is_pinned })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLesson(id: string, lesson: Partial<LessonRow>) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('lessons')
    .update(lesson)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLesson(id: string) {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function cloneLesson(id: string) {
  const supabase = await createServerClient();
  
  // Get the authenticated user for RLS
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  // Fetch the original lesson
  const { data: original, error: fetchError } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .single();
  
  if (fetchError || !original) throw fetchError || new Error('Lesson not found');
  
  // Create a copy with new title and user_id
  const { data, error } = await supabase
    .from('lessons')
    .insert({
      title: `${original.title} (Copy)`,
      type: original.type,
      instructions: original.instructions,
      tags: original.tags,
      estimated_minutes: original.estimated_minutes,
      parent_notes: original.parent_notes,
      user_id: user.id, // RLS requires this
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Schedule a lesson to one or more students on a specific date
 * This assigns an existing lesson to the calendar without duplicating it
 */
export async function scheduleLesson(
  lessonId: string, 
  studentIds: string[], 
  date: string
): Promise<{ success: boolean; scheduled: number }> {
  const supabase = await createServerClient();
  
  // Get the authenticated user for RLS
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  // Create schedule items for each student
  const scheduleItems = studentIds.map(studentId => ({
    lesson_id: lessonId,
    student_id: studentId,
    date: date,
    item_type: 'lesson',
    status: 'pending',
    user_id: user.id
  }));
  
  const { data, error } = await supabase
    .from('schedule_items')
    .insert(scheduleItems)
    .select();

  if (error) throw error;
  return { success: true, scheduled: data?.length || 0 };
}

/**
 * Schedule an assignment to one or more students on a specific date
 */
export async function scheduleAssignment(
  assignmentId: string,
  studentIds: string[],
  date: string
): Promise<{ success: boolean; scheduled: number }> {
  const supabase = await createServerClient();
  
  // Get the authenticated user for RLS
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const scheduleItems = studentIds.map(studentId => ({
    assignment_id: assignmentId,
    student_id: studentId,
    date: date,
    item_type: 'assignment',
    status: 'pending',
    user_id: user.id
  }));
  
  const { data, error } = await supabase
    .from('schedule_items')
    .insert(scheduleItems)
    .select();

  if (error) throw error;
  return { success: true, scheduled: data?.length || 0 };
}

// Assignments (Items)
export async function createAssignment(assignment: Omit<AssignmentItemRow, 'id' | 'created_at' | 'user_id'>) {
  const supabase = await createServerClient();
  
  // Get the authenticated user for RLS
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('assignment_items')
    .insert({ ...assignment, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAssignment(id: string, assignment: Partial<AssignmentItemRow>) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('assignment_items')
    .update(assignment)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAssignment(id: string) {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from('assignment_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function cloneAssignment(id: string) {
  const supabase = await createServerClient();
  
  // Fetch the original assignment
  const { data: original, error: fetchError } = await supabase
    .from('assignment_items')
    .select('*')
    .eq('id', id)
    .single();
  
  if (fetchError || !original) throw fetchError || new Error('Assignment not found');
  
  // Create a copy with new title
  const { data, error } = await supabase
    .from('assignment_items')
    .insert({
      title: `${original.title} (Copy)`,
      type: original.type,
      deliverable: original.deliverable,
      rubric: original.rubric,
      steps: original.steps,
      parent_notes: original.parent_notes,
      estimated_minutes: original.estimated_minutes,
      tags: original.tags,
      links: original.links,
      is_template: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Resources
export async function createResource(resource: Omit<ResourceRow, 'id'>) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('resources')
    .insert(resource)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateResource(id: string, resource: Partial<ResourceRow>) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('resources')
    .update(resource)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteResource(id: string) {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Schedule / Playlist
export async function assignItemToSchedule(
  type: 'lesson' | 'assignment',
  itemId: string,
  date: string,
  studentIds: string[]
) {
  const supabase = await createServerClient();
  
  console.log('assignItemToSchedule called with:', { type, itemId, date, studentIds });

  if (!studentIds.length) {
    console.warn('assignItemToSchedule: No student IDs provided!');
    return false;
  }
  
  // Get the authenticated user for RLS
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('assignItemToSchedule: Not authenticated');
    throw new Error('Not authenticated');
  }

  const rows = studentIds.map(studentId => ({
    date,
    student_id: studentId,
    item_type: type,
    lesson_id: type === 'lesson' ? itemId : null,
    assignment_id: type === 'assignment' ? itemId : null,
    status: 'pending',
    user_id: user.id
  }));
  
  console.log('Inserting rows:', rows);

  const { error } = await supabase
    .from('schedule_items')
    .insert(rows);

  if (error) {
    console.error('assignItemToSchedule DB Error:', error);
    throw error;
  }
  
  console.log('assignItemToSchedule success');
  return true;
}

export async function addToSchedule(item: Omit<ScheduleItemRow, 'id' | 'status' | 'completed_at'>) {
  const supabase = await createServerClient();
  
  // Get the authenticated user for RLS
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  // TODO: Validate item_type matches ID presence (e.g. if type='lesson', lesson_id must be set)
  
  const { data, error } = await supabase
    .from('schedule_items')
    .insert({ ...item, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}
// ... existing code ...

export async function toggleScheduleItemComplete(id: string, isCompleted: boolean) {
  const supabase = await createServerClient();
  const status = isCompleted ? 'completed' : 'pending';
  const completed_at = isCompleted ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from('schedule_items')
    .update({ status, completed_at })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Deletes an item from the schedule
export async function deleteScheduleItemAction(id: string) {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from('schedule_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Remove all schedule items within a date range (used when creating holidays)
export async function removeScheduleItemsForDateRange(
  startDate: string,
  endDate: string
): Promise<number> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('schedule_items')
    .delete()
    .gte('date', startDate)
    .lte('date', endDate)
    .select('id');

  if (error) {
    console.error('Error removing schedule items for date range:', error);
    throw error;
  }
  
  return data?.length || 0;
}

// ========== PROGRESS MUTATIONS ==========

// Award stars for completing an item (prevents double-awarding)
export async function awardStars(
  kidId: string,
  date: string,
  itemId: string,
  starsToAward: number = 1
): Promise<{ success: boolean; alreadyAwarded: boolean; newTotal?: number }> {
  const supabase = await createServerClient();
  
  // Try to insert award (will fail if already awarded due to unique constraint)
  const { error: awardError } = await supabase
    .from('progress_awards')
    .insert({
      kid_id: kidId,
      date,
      item_id: itemId,
      stars_earned: starsToAward
    });
  
  if (awardError) {
    if (awardError.code === '23505') {
      // Unique constraint violation - already awarded
      return { success: true, alreadyAwarded: true };
    }
    console.error('Error awarding stars:', awardError);
    return { success: false, alreadyAwarded: false };
  }
  
  // Update total stars in student_progress
  const { data: progress, error: fetchError } = await supabase
    .from('student_progress')
    .select('total_stars')
    .eq('kid_id', kidId)
    .single();
  
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching progress:', fetchError);
  }
  
  const currentStars = progress?.total_stars || 0;
  const newTotal = currentStars + starsToAward;
  
  await supabase
    .from('student_progress')
    .upsert({
      kid_id: kidId,
      total_stars: newTotal,
      updated_at: new Date().toISOString()
    }, { onConflict: 'kid_id' });

  // Update moons (currency)
  // We do this separately because it live in the 'kids' table
  const { data: kidData } = await supabase
    .from('kids')
    .select('moons')
    .eq('id', kidId)
    .single();
    
  if (kidData) {
     await supabase
       .from('kids')
       .update({ moons: (kidData.moons || 0) + starsToAward })
       .eq('id', kidId);
  }
  
  return { success: true, alreadyAwarded: false, newTotal };
}

// Update streak when completing all items for a school day
export async function updateStreak(kidId: string, completionDate: string): Promise<void> {
  const supabase = await createServerClient();
  
  // Fetch current progress
  const { data: progress } = await supabase
    .from('student_progress')
    .select('*')
    .eq('kid_id', kidId)
    .single();
  
  const schoolDays = progress?.school_days || [2, 3, 4]; // Tue, Wed, Thu
  const date = new Date(completionDate + 'T12:00:00'); // Noon to avoid timezone issues
  const dayOfWeek = date.getDay();
  
  // Only count school days
  if (!schoolDays.includes(dayOfWeek)) {
    return;
  }
  
  const lastCompleted = progress?.last_completed_date;
  let newStreak = progress?.current_streak || 0;
  let bestStreak = progress?.best_streak || 0;
  
  if (!lastCompleted) {
    // First completion ever
    newStreak = 1;
  } else {
    // Check if this is the next expected school day
    const lastDate = new Date(lastCompleted + 'T12:00:00');
    const nextExpected = getNextSchoolDay(lastDate, schoolDays);
    const nextExpectedStr = formatDateString(nextExpected);
    
    if (completionDate === nextExpectedStr) {
      // Perfect continuation
      newStreak += 1;
    } else if (completionDate > nextExpectedStr) {
      // Missed days, reset streak
      newStreak = 1;
    }
    // If completionDate < nextExpectedStr, already completed (do nothing)
  }
  
  if (newStreak > bestStreak) {
    bestStreak = newStreak;
  }
  
  // Update progress
  await supabase
    .from('student_progress')
    .upsert({
      kid_id: kidId,
      current_streak: newStreak,
      best_streak: bestStreak,
      last_completed_date: completionDate,
      updated_at: new Date().toISOString()
    }, { onConflict: 'kid_id' });
}

// Helper: get next school day after a given date
function getNextSchoolDay(date: Date, schoolDays: number[]): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  while (!schoolDays.includes(next.getDay())) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

// Helper: format date as YYYY-MM-DD
function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Grant an unlock (badge)
export async function grantUnlock(kidId: string, unlockId: string): Promise<boolean> {
  const supabase = await createServerClient();
  
  const { error } = await supabase
    .from('student_unlocks')
    .insert({
      kid_id: kidId,
      unlock_id: unlockId
    });
  
  if (error && error.code !== '23505') {
    console.error('Error granting unlock:', error);
    return false;
  }
  
  return true;
}

// Check and grant unlocks based on star thresholds
const UNLOCK_THRESHOLDS: { stars: number; unlockId: string }[] = [
  { stars: 5, unlockId: 'unlock-badge-1' },
  { stars: 10, unlockId: 'unlock-badge-2' },
  { stars: 20, unlockId: 'unlock-badge-3' },
  { stars: 35, unlockId: 'unlock-badge-4' },
  { stars: 50, unlockId: 'unlock-badge-5' },
  { stars: 75, unlockId: 'unlock-badge-6' },
];

export async function checkAndGrantUnlocks(kidId: string, totalStars: number): Promise<string[]> {
  const newUnlocks: string[] = [];
  
  for (const threshold of UNLOCK_THRESHOLDS) {
    if (totalStars >= threshold.stars) {
      const success = await grantUnlock(kidId, threshold.unlockId);
      if (success) {
        newUnlocks.push(threshold.unlockId);
      }
    }
  }
  
  return newUnlocks;
}

// Holidays
export async function createHoliday(holiday: { 
  name: string; 
  emoji?: string; 
  start_date: string; 
  end_date?: string | null;
}) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('holidays')
    .insert({
      name: holiday.name,
      emoji: holiday.emoji || '📅',
      start_date: holiday.start_date,
      end_date: holiday.end_date || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateHoliday(id: string, holiday: Partial<{
  name: string;
  emoji: string;
  start_date: string;
  end_date: string | null;
}>) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('holidays')
    .update(holiday)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteHoliday(id: string) {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from('holidays')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function updateAssignmentOrder(items: { id: string; display_order: number }[]) {
  const supabase = await createServerClient();
  
  // Parallel updates for order
  const updates = items.map(item => 
    supabase
      .from('assignment_items')
      .update({ display_order: item.display_order })
      .eq('id', item.id)
  );

  await Promise.all(updates);
  return true;
}

export async function togglePinAssignment(id: string, is_pinned: boolean) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('assignment_items')
    .update({ is_pinned })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ========== DESIGN STUDIO TIER UNLOCKS ==========

/**
 * Unlock a design studio tier for a kid
 * Validates moon balance, deducts moons, updates tier level, and records unlock history
 */
export async function unlockDesignStudioTier(
  kidId: string,
  targetTier: 1 | 2 | 3 | 4,
  moonCost: number
): Promise<{ success: boolean; error?: string; newMoonBalance?: number }> {
  const supabase = await createServerClient();
  
  // Fetch current kid data
  const { data: kid, error: fetchError } = await supabase
    .from('kids')
    .select('design_studio_tier, design_studio_tier_unlocks, moons')
    .eq('id', kidId)
    .single();
  
  if (fetchError || !kid) {
    return { success: false, error: 'Kid not found' };
  }
  
  const currentTier = kid.design_studio_tier || 1;
  const currentMoons = kid.moons || 0;
  
  // Validation
  if (targetTier <= currentTier) {
    return { success: false, error: 'Already at or above this tier' };
  }
  
  if (targetTier !== currentTier + 1) {
    return { success: false, error: 'Must unlock tiers in order' };
  }
  
  if (currentMoons < moonCost) {
    return { success: false, error: 'Insufficient moons' };
  }
  
  // Deduct moons and update tier
  const newMoonBalance = currentMoons - moonCost;
  const unlockTimestamp = new Date().toISOString();
  
  // Update tier unlocks JSONB
  const tierUnlocks = (kid.design_studio_tier_unlocks || {}) as Record<string, string>;
  tierUnlocks[targetTier.toString()] = unlockTimestamp;
  
  const { error: updateError } = await supabase
    .from('kids')
    .update({
      design_studio_tier: targetTier,
      design_studio_tier_unlocks: tierUnlocks,
      moons: newMoonBalance,
    })
    .eq('id', kidId);
  
  if (updateError) {
    console.error('Error updating kid tier:', updateError);
    return { success: false, error: 'Failed to update tier' };
  }
  
  // Record unlock history
  const { error: historyError } = await supabase
    .from('design_tier_unlocks')
    .insert({
      kid_id: kidId,
      from_tier: currentTier,
      to_tier: targetTier,
      moon_cost: moonCost,
      unlocked_at: unlockTimestamp,
    });
  
  if (historyError) {
    console.error('Error recording tier unlock history:', historyError);
    // Don't fail the whole operation for history errors
  }
  
  return { success: true, newMoonBalance };
}
