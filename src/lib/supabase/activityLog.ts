// Activity Log data access functions
// CRUD operations for parent-logged homeschool activities

import { createServerClient } from './server';

export interface ActivityLogEntry {
  id: string;
  kidId: string;
  date: string;
  subject: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  source: string;
  sourceItemId: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface ActivityLogInsert {
  kidId: string;
  date: string;
  subject: string;
  title: string;
  description?: string;
  durationMinutes?: number;
  source?: string;
  sourceItemId?: string;
}

// Predefined subjects for the dropdown
export const SUBJECTS = [
  'Math',
  'Reading',
  'Writing',
  'Language Arts',
  'Science',
  'Social Studies',
  'History',
  'Art',
  'Music',
  'PE',
  'Life Skills',
  'Foreign Language',
  'Technology',
  'Field Trip',
  'Other'
] as const;

export type Subject = typeof SUBJECTS[number];

/**
 * Get activity log entries for a kid, optionally filtered by date range
 */
export async function getActivityLog(
  kidId: string,
  startDate?: string,
  endDate?: string
): Promise<ActivityLogEntry[]> {
  const supabase = await createServerClient();
  
  let query = supabase
    .from('activity_log')
    .select('*')
    .eq('kid_id', kidId)
    .order('date', { ascending: false });
  
  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching activity log:', error);
    return [];
  }
  
  return (data || []).map(row => ({
    id: row.id,
    kidId: row.kid_id,
    date: row.date,
    subject: row.subject,
    title: row.title,
    description: row.description,
    durationMinutes: row.duration_minutes,
    source: row.source,
    sourceItemId: row.source_item_id,
    createdAt: row.created_at,
    createdBy: row.created_by
  }));
}

/**
 * Get activity log for multiple kids (for reports)
 */
export async function getActivityLogForKids(
  kidIds: string[],
  startDate?: string,
  endDate?: string
): Promise<ActivityLogEntry[]> {
  const supabase = await createServerClient();
  
  let query = supabase
    .from('activity_log')
    .select('*')
    .in('kid_id', kidIds)
    .order('date', { ascending: false });
  
  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching activity log:', error);
    return [];
  }
  
  return (data || []).map(row => ({
    id: row.id,
    kidId: row.kid_id,
    date: row.date,
    subject: row.subject,
    title: row.title,
    description: row.description,
    durationMinutes: row.duration_minutes,
    source: row.source,
    sourceItemId: row.source_item_id,
    createdAt: row.created_at,
    createdBy: row.created_by
  }));
}

/**
 * Get summary of activity log (hours per subject)
 */
export async function getActivityLogSummary(
  kidId: string,
  startDate?: string,
  endDate?: string
): Promise<{ subject: string; totalMinutes: number; count: number }[]> {
  const entries = await getActivityLog(kidId, startDate, endDate);
  
  const summary: Record<string, { totalMinutes: number; count: number }> = {};
  
  for (const entry of entries) {
    if (!summary[entry.subject]) {
      summary[entry.subject] = { totalMinutes: 0, count: 0 };
    }
    summary[entry.subject].totalMinutes += entry.durationMinutes || 0;
    summary[entry.subject].count += 1;
  }
  
  return Object.entries(summary).map(([subject, data]) => ({
    subject,
    ...data
  })).sort((a, b) => b.totalMinutes - a.totalMinutes);
}

/**
 * Insert a new activity log entry
 */
export async function createActivityLogEntry(
  entry: ActivityLogInsert
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = await createServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('activity_log')
    .insert({
      kid_id: entry.kidId,
      date: entry.date,
      subject: entry.subject,
      title: entry.title,
      description: entry.description || null,
      duration_minutes: entry.durationMinutes || null,
      source: entry.source || 'manual',
      source_item_id: entry.sourceItemId || null,
      created_by: user?.id || null
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Error creating activity log entry:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, id: data.id };
}

/**
 * Update an activity log entry
 */
export async function updateActivityLogEntry(
  id: string,
  updates: Partial<ActivityLogInsert>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();
  
  const updateData: Record<string, unknown> = {};
  if (updates.date) updateData.date = updates.date;
  if (updates.subject) updateData.subject = updates.subject;
  if (updates.title) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.durationMinutes !== undefined) updateData.duration_minutes = updates.durationMinutes;
  
  const { error } = await supabase
    .from('activity_log')
    .update(updateData)
    .eq('id', id);
  
  if (error) {
    console.error('Error updating activity log entry:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

/**
 * Delete an activity log entry
 */
export async function deleteActivityLogEntry(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();
  
  const { error } = await supabase
    .from('activity_log')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting activity log entry:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
}
